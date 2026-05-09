package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

func main() {
	fmt.Println("🛰️ Conectando al servidor MCP...")

	resp, err := http.Get("http://localhost:3000/mcp")
	if err != nil {
		log.Fatalf("❌ Error: %v", err)
	}

	reader := bufio.NewReader(resp.Body)
	var sessionID string
	for {
		line, err := reader.ReadString('\n')
		if err != nil { log.Fatalf("❌ Error: %v", err) }
		if strings.Contains(line, "sessionid=") {
			parts := strings.Split(line, "sessionid=")
			sessionID = strings.TrimSpace(parts[1])
			break
		}
	}

	fmt.Printf("✅ Sesión activa: %s\n", sessionID)
	go func() { io.Copy(io.Discard, resp.Body) }()

	// INITIALIZE
	callToolRaw(sessionID, "initialize", map[string]interface{}{
		"protocolVersion": "2024-11-05",
		"capabilities":    map[string]interface{}{},
		"clientInfo": map[string]interface{}{"name": "test", "version": "1"},
	})

	time.Sleep(500 * time.Millisecond)

	p1 := "El pasado lunes, Elena Rodríguez de TechNova anunció la adquisición de Nordic AI."
	fmt.Println("🎬 Enviando Párrafo 1...")
	callToolRaw(sessionID, "tools/call", map[string]interface{}{
		"name": "process_diagram_step",
		"arguments": map[string]interface{}{"text": p1},
	})

	time.Sleep(5 * time.Second)

	p2 := "Sarah Jenkins coordinó la auditoría para Rodríguez."
	fmt.Println("🎬 Enviando Párrafo 2 (con memoria de Elena Rodríguez)...")
	callToolRaw(sessionID, "tools/call", map[string]interface{}{
		"name": "process_diagram_step",
		"arguments": map[string]interface{}{"text": p2},
	})

	fmt.Println("\n🏁 Prueba finalizada. ¡Deberías ver el grafo en la App!")
}

func callToolRaw(sessionID, method string, params interface{}) {
	url := fmt.Sprintf("http://localhost:3000/mcp?sessionid=%s", sessionID)
	payload := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      time.Now().Unix(),
		"method":  method,
		"params":  params,
	}
	body, _ := json.Marshal(payload)
	resp, _ := http.Post(url, "application/json", bytes.NewBuffer(body))
	if resp != nil { resp.Body.Close() }
}
