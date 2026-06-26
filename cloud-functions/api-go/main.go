// EdgeOne Cloud Functions Go 入口
// 与 cmd/api/main.go 共享逻辑，通过环境变量 DB_PATH=:memory: 区分
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/reinvention/api/internal/ai"
	"github.com/reinvention/api/internal/db"
	"github.com/reinvention/api/internal/handlers"
)

func main() {
	// EdgeOne Cloud Functions：进程内 SQLite（每次冷启动重新初始化）
	// 生产场景建议用 Cloudflare D1（外部 SQLite 兼容）
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "file::memory:?cache=shared"
	}

	database, err := db.New(dbPath)
	if err != nil {
		log.Fatalf("DB init: %v", err)
	}
	defer database.Close()

	if err := database.InitSchema(); err != nil {
		log.Fatalf("Schema init: %v", err)
	}

	llm := ai.New()

	r := gin.New()
	r.Use(gin.Recovery())

	// CORS（同域名部署可不需，但加上保险）
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"runtime": "go-gin-edgeone",
		})
	})

	diagnose := handlers.DiagnoseHandler{DB: database, LLM: llm}
	dg := r.Group("/api/diagnose")
	{
		dg.POST("/start", diagnose.Start)
		dg.POST("/answer", diagnose.Answer)
		dg.POST("/final", diagnose.Final)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}
	log.Printf("EdgeOne Go function starting on :%s", port)
	r.Run(":" + port)
}
