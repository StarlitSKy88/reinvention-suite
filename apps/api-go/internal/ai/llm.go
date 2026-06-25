// Package ai LLM 集成
package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// Client LLM 客户端
type Client struct {
	BaseURL string
	APIKey  string
	Model   string
	http    *http.Client
}

// New 创建新 LLM 客户端
func New() *Client {
	return &Client{
		BaseURL: getEnv("MINIMAX_BASE_URL", "https://api.MiniMax.chat/v1"),
		APIKey:  os.Getenv("MINIMAX_API_KEY"),
		Model:   getEnv("MINIMAX_MODEL", "MiniMax-M3"),
		http:    &http.Client{Timeout: 60 * time.Second},
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// ChatMessage 聊天消息
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest 聊天请求
type ChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Temperature float64        `json:"temperature,omitempty"`
}

// ChatResponse 聊天响应
type ChatResponse struct {
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
	Usage struct {
		TotalTokens int `json:"total_tokens"`
	} `json:"usage"`
}

// Chat 调用 LLM
func (c *Client) Chat(systemPrompt, userPrompt string, maxTokens int) (string, error) {
	if c.APIKey == "" {
		return "", fmt.Errorf("MINIMAX_API_KEY not set")
	}

	reqBody := ChatRequest{
		Model:       c.Model,
		MaxTokens:   maxTokens,
		Temperature: 0.7,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}
	body, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("POST",
		c.BaseURL+"/chat/completions",
		bytes.NewReader(body),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("LLM error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result ChatResponse
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return "", err
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}
	return result.Choices[0].Message.Content, nil
}
