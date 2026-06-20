package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	
	_ "antigravity-writer/internal/ortinit"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	mcpOnly := flag.Bool("mcp-only", false, "Start only the MCP server in headless mode")
	flag.Parse()

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
		// Esta opción es clave para que no se bloqueen funcionalidades por seguridad estricta en local
		CSSDragProperty: "widows",
		CSSDragValue:    "1",
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
