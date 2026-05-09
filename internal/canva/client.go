package canva

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

type CanvaClient struct {
	ClientID     string
	ClientSecret string
	AccessToken  string
	RefreshToken string
	OnTokensSave func(access, refresh string)
}

func NewCanvaClient(clientID, clientSecret, accessToken, refreshToken string, onSave func(string, string)) *CanvaClient {
	if clientID == "" || clientSecret == "" {
		fmt.Println("Advertencia: Credenciales de Canva no configuradas en config.json")
		return nil
	}

	return &CanvaClient{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		OnTokensSave: onSave,
	}
}

func generateCodeVerifier() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

func generateCodeChallenge(verifier string) string {
	h := sha256.New()
	h.Write([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}

func (c *CanvaClient) StartOAuthFlow(openBrowser func(url string)) error {
	verifier := generateCodeVerifier()
	challenge := generateCodeChallenge(verifier)
	state := generateCodeVerifier()[:16] 
	redirectURI := "http://127.0.0.1:8080/oauth/callback"

	scopes := "design:content:read design:content:write brandtemplate:meta:read"
	authURL := fmt.Sprintf("https://www.canva.com/api/oauth/authorize?code_challenge=%s&code_challenge_method=S256&response_type=code&client_id=%s&redirect_uri=%s&scope=%s&state=%s", 
		challenge, c.ClientID, url.QueryEscape(redirectURI), url.QueryEscape(scopes), state)

	errChan := make(chan error)
	
	mux := http.NewServeMux()
	server := &http.Server{Addr: "127.0.0.1:8080", Handler: mux}

	mux.HandleFunc("/oauth/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("code")
		if code == "" {
			errStr := r.URL.Query().Get("error")
			fmt.Fprintf(w, "Error de autorización: %s", errStr)
			errChan <- fmt.Errorf("authorization failed: %s", errStr)
			return
		}

		err := c.exchangeCodeForToken(code, verifier, redirectURI)
		if err != nil {
			fmt.Fprintf(w, "Error al obtener tokens: %v", err)
			errChan <- err
			return
		}

		fmt.Fprintf(w, "¡Autorización completada con éxito! Puedes cerrar esta ventana y volver a la aplicación.")
		errChan <- nil
	})

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errChan <- err
		}
	}()

	openBrowser(authURL)

	err := <-errChan
	server.Close()
	return err
}

func (c *CanvaClient) exchangeCodeForToken(code, verifier, redirectURI string) error {
	tokenURL := "https://api.canva.com/rest/v1/oauth/token"
	
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("code_verifier", verifier)
	data.Set("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(c.ClientID + ":" + c.ClientSecret))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error al cambiar código por token (%d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return err
	}

	c.AccessToken = result.AccessToken
	c.RefreshToken = result.RefreshToken
	if c.OnTokensSave != nil {
		c.OnTokensSave(c.AccessToken, c.RefreshToken)
	}

	return nil
}

func (c *CanvaClient) RefreshTokens() error {
	if c.RefreshToken == "" {
		return fmt.Errorf("no refresh token available")
	}

	tokenURL := "https://api.canva.com/rest/v1/oauth/token"
	
	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", c.RefreshToken)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(c.ClientID + ":" + c.ClientSecret))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error al refrescar token (%d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return err
	}

	c.AccessToken = result.AccessToken
	if result.RefreshToken != "" {
		c.RefreshToken = result.RefreshToken
	}
	if c.OnTokensSave != nil {
		c.OnTokensSave(c.AccessToken, c.RefreshToken)
	}

	return nil
}

func (c *CanvaClient) EnsureAuthenticated() error {
	if c.AccessToken != "" {
		return nil
	}
	if c.RefreshToken != "" {
		return c.RefreshTokens()
	}
	return fmt.Errorf("user is not authenticated with Canva (no tokens)")
}

func (c *CanvaClient) doGet(url string) ([]byte, int, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Authorization", "Bearer "+c.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return body, resp.StatusCode, nil
}

func (c *CanvaClient) doPost(url string, payload interface{}) ([]byte, int, error) {
	jsonData, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Authorization", "Bearer "+c.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return body, resp.StatusCode, nil
}

func (c *CanvaClient) ListTemplates() (string, error) {
	if err := c.EnsureAuthenticated(); err != nil {
		return "", err
	}

	body, statusCode, err := c.doGet("https://api.canva.com/rest/v1/brand-templates")
	if err != nil {
		return "", err
	}

	if statusCode == 401 && c.RefreshToken != "" {
		if err := c.RefreshTokens(); err == nil {
			body, statusCode, err = c.doGet("https://api.canva.com/rest/v1/brand-templates")
			if err != nil {
				return "", err
			}
		}
	}

	if statusCode >= 400 {
		return "", fmt.Errorf("error en Canva ListTemplates (%d): %s", statusCode, string(body))
	}
	return string(body), nil
}

func (c *CanvaClient) CreateDesignFromTemplate(templateID string, title string, textData map[string]string) (string, error) {
	if err := c.EnsureAuthenticated(); err != nil {
		return "", err
	}

	payload := map[string]interface{}{
		"brand_template_id": templateID,
		"title":             title,
		"data":              textData,
	}

	body, statusCode, err := c.doPost("https://api.canva.com/rest/v1/autofill", payload)
	if err != nil {
		return "", err
	}

	if statusCode == 401 && c.RefreshToken != "" {
		if err := c.RefreshTokens(); err == nil {
			body, statusCode, err = c.doPost("https://api.canva.com/rest/v1/autofill", payload)
			if err != nil {
				return "", err
			}
		}
	}

	if statusCode >= 400 {
		return "", fmt.Errorf("error en Canva Autofill (%d): %s", statusCode, string(body))
	}

	return string(body), nil
}
