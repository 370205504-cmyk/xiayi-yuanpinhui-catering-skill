package main

import (
	"embed"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/options/assets"
	"github.com/wailsapp/wails/v2/pkg/options/framer"
)

//go:embed all:frontend/dist
var assets embed.FS

type App struct {
	quit chan bool
}

func NewApp() *App {
	return &App{
		quit: make(chan bool),
	}
}

func main() {
	// 创建应用
	app := NewApp()

	// 启动后端服务
	go app.startBackend()

	// 创建应用实例
	err := wails.Run(&options.App{
		Title:  "雨姗AI收银助手 v5.0.1",
		Width:  1280,
		Height: 800,
		MinWidth: 1024,
		MinHeight: 600,
		AssetServer: &assets.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		OnStartup:        app.startup,
		OnDomReady:       app.domReady,
		OnBeforeClose:   app.beforeClose,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:     false,
		},
	})

	if err != nil {
		log.Fatal("Error running application:", err)
	}
}

// 启动后端服务
func (a *App) startBackend() {
	// TODO: 在这里启动 Node.js 后端服务
	fmt.Println("正在启动后端服务...")
	time.Sleep(2 * time.Second)
	fmt.Println("后端服务启动成功！")
}

// 生命周期钩子
func (a *App) startup(ctx context.Context) {
	fmt.Println("应用启动中...")
}

func (a *App) domReady(ctx context.Context) {
	fmt.Println("DOM 准备就绪！")
}

func (a *App) beforeClose(ctx context.Context) bool {
	fmt.Println("应用即将关闭...")
	return true
}

func (a *App) shutdown(ctx context.Context) {
	fmt.Println("应用已关闭！")
}

// 后端API代理（示例）
func (a *App) GetOrders(w http.ResponseWriter, r *http.Request) {
	// 代理到后端API
	fmt.Fprintf(w, `{"success": true, "message": "订单列表"}`)
}

func (a *App) GetMenu(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, `{"success": true, "message": "菜单列表"}`)
}

func (a *App) ProcessPayment(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, `{"success": true, "message": "支付处理中"}`)
}
