package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	
	_ "antigravity-writer/internal/ortinit"
)

func init() {
	if os.Getenv("WEBKIT_DISABLE_COMPOSITING_MODE") == "" {
		os.Setenv("WEBKIT_DISABLE_COMPOSITING_MODE", "1")
	}
	if os.Getenv("WEBKIT_DISABLE_DMABUF_RENDERER") == "" {
		os.Setenv("WEBKIT_DISABLE_DMABUF_RENDERER", "1")
	}
}

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	mcpOnly := flag.Bool("mcp-only", false, "Start only the MCP server in headless mode")
	flag.Parse()

	// Redirigir logs a un archivo local en modo GUI
	if !*mcpOnly {
		logFile, err := os.OpenFile("writer.log", os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
		if err == nil {
			os.Stdout = logFile
			os.Stderr = logFile
			log.SetOutput(logFile)
		}
	}

	// Create an instance of the app structure
	app := NewApp()

	if *mcpOnly {
		fmt.Println("Starting Antigravity Writer in MCP-only headless mode...")
		os.Stdout.Sync()
		app.headless = true
		app.startup(context.Background())
		fmt.Println("Server startup call finished. Entering select{} blocking...")
		os.Stdout.Sync()
		select {}
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Antigravity Writer",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 15, G: 17, B: 21, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
		// Opciones específicas para Linux
		Linux: &linux.Options{
			WindowIsTranslucent: false,
		},
		// Opciones específicas para Windows
		Windows: &windows.Options{
			WebviewUserDataPath:                 os.Getenv("LOCALAPPDATA") + `\antigravity-writer`,
			WebviewGpuIsDisabled:                true,
			WebviewDisableRendererCodeIntegrity: true,
		},
		// Esta opción es clave para que no se bloqueen funcionalidades por seguridad estricta en local
		CSSDragProperty: "widows",
		CSSDragValue:    "1",
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
