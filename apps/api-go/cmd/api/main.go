// Reinvention API - Go (Gin)
// 多轮 AI 诊断后端
package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/reinvention/api/internal/ai"
	"github.com/reinvention/api/internal/db"
	"github.com/reinvention/api/internal/handlers"
)

func main() {
	// 1. 初始化数据库
	dbPath := getEnv("DB_PATH", "./reinvention.db")
	if dbPath == "" {
		dbPath = ":memory:"
	}

	database, err := db.New(dbPath)
	if err != nil {
		log.Fatalf("Failed to init database: %v", err)
	}
	defer database.Close()

	if err := database.InitSchema(); err != nil {
		log.Fatalf("Failed to init schema: %v", err)
	}
	log.Println("✓ Database initialized")

	// 2. 初始化 LLM 客户端
	llm := ai.New()
	log.Println("✓ LLM client initialized")

	// 3. 初始化 Gin
	r := gin.Default()

	// 4. CORS（EdgeOne Pages 部署时不需要，但本地开发需要）
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * 3600,
	}))

	// 5. 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"service":   "reinvention-api",
			"runtime":   "go-gin",
			"timestamp": gin.H{},
		})
	})

	// 6. 诊断 API
	diagnose := handlers.DiagnoseHandler{DB: database, LLM: llm}
	dg := r.Group("/api/diagnose")
	{
		dg.POST("/start", diagnose.Start)
		dg.POST("/answer", diagnose.Answer)
		dg.POST("/final", diagnose.Final)
	}

	// 7. 启动服务
	port := getEnv("PORT", "9000")
	log.Printf("✓ Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
