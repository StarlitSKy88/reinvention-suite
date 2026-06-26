// Package handlers 多轮 AI 诊断 API
package handlers

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/reinvention/api/internal/ai"
	"github.com/reinvention/api/internal/db"
	"github.com/reinvention/api/internal/models"
)

// DiagnoseHandler 多轮 AI 诊断处理器
type DiagnoseHandler struct {
	DB  *db.DB
	LLM *ai.Client
}

// 4 轮问题（与 prompts/multi-turn-diagnosis.ts 保持一致）
var roundQuestions = map[int][]models.Question{
	1: {
		{ID: "q1_situation", Question: "你现在的处境是什么？（失业 / 上班族 / 学生 / 创业 / 其他）请具体说明收入、存款、固定支出。", PromptHint: "如：失业 5 个月，原月薪 15k，存款 3 万，月支出 8k"},
		{ID: "q2_money_history", Question: "你过去挣到过钱吗？最多一次是多少？是怎么做到的？", PromptHint: "工资、奖金、副业、卖东西都算"},
		{ID: "q3_time", Question: "你每天能稳定投入多少时间？注意：是连续 90 天能稳定投入。", PromptHint: "如：工作日 2 小时 / 周末 8 小时 / 全职 100%"},
	},
	2: {
		{ID: "q4_resources", Question: "你身边有什么资源？包括：技能、人脉、工具、环境。", PromptHint: "如：会 PPT 和 Excel，同学在金融行业"},
		{ID: "q5_relationships", Question: "你能随时打电话求助的 5 个人是谁？他们在什么领域有资源？"},
		{ID: "q6_money_access", Question: "你能动用多少钱？（家人 / 朋友 / 信用卡 / 贷款）你的征信如何？"},
	},
	3: {
		{ID: "q7_wins", Question: "你过去做成过的最有成就感的 3 件事是什么？你在里面扮演什么角色？"},
		{ID: "q8_failures", Question: "你过去失败过的最惨的 3 件事是什么？为什么会失败？你学到了什么？"},
		{ID: "q9_biggest_money", Question: "你赚过的最大一笔钱是怎么赚到的？当时为什么能成？"},
	},
	4: {
		{ID: "q10_strength", Question: "你最擅长什么？即使没人付钱你也愿意花时间做的事", PromptHint: "写文章、陪人聊天、整理信息、找规律、说服别人"},
		{ID: "q11_role_model", Question: "你身边有没有'做到了'的人？他/她是怎么做到的？和你有什么相似/不同？"},
		{ID: "q12_never_do", Question: "你绝对不想做的事是什么？写得越具体越好。", PromptHint: "如：绝对不做销售 / 绝对不碰直播"},
		{ID: "q13_deadline", Question: "你希望在多久内挣到目标钱？（1 年 / 3 年 / 5 年）你的目标具体是什么？"},
	},
}

// Start 启动诊断
// POST /api/diagnose/start
// Body: { userId?: string }
// Response: DiagnoseStartResponse
func (h *DiagnoseHandler) Start(c *gin.Context) {
	var body struct {
		UserID string `json:"userId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		body.UserID = ""
	}
	if body.UserID == "" {
		body.UserID = "demo-user"
	}

	session, err := h.DB.CreateSession(body.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create session",
		})
		return
	}

	c.JSON(http.StatusOK, models.DiagnoseStartResponse{
		Success:      true,
		SessionID:    session.ID,
		CurrentRound: 1,
		TotalRounds:  4,
		Questions:    roundQuestions[1],
		StartedAt:    session.StartedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

// Answer 提交本轮答案 → AI 总结 + 下一轮
// POST /api/diagnose/answer
// Body: { sessionId, answers: [{ questionId, answer }] }
// Response: DiagnoseAnswerResponse
func (h *DiagnoseHandler) Answer(c *gin.Context) {
	var body struct {
		SessionID string                 `json:"sessionId"`
		Answers   []models.DiagnoseAnswer `json:"answers"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	session, err := h.DB.GetSession(body.SessionID)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Session not found",
		})
		return
	}

	if session.CompletedAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Session already completed",
		})
		return
	}

	// 更新答案
	answers, _ := session.ParseAnswers()
	if answers == nil {
		answers = make(map[string]string)
	}
	for _, a := range body.Answers {
		answers[a.QuestionID] = a.Answer
	}

	currentRound := session.CurrentRound
	nextRound := currentRound + 1

	// 生成 AI 总结
	summary, err := h.generateRoundSummary(answers, currentRound)
	if err != nil {
		// 失败时给个默认总结
		summary = h.fallbackSummary(currentRound)
	}

	// 完整 4 轮 → 完成
	if nextRound > 4 {
		// 调用 LLM 生成最终方案
		plan, _ := h.generateFinalPlan(answers)
		h.DB.CompleteSession(session.ID, plan)
		c.JSON(http.StatusOK, models.DiagnoseAnswerResponse{
			Success:  true,
			Summary:  summary,
			NextRound: nil,
			Complete: true,
		})
		return
	}

	// 更新数据库
	h.DB.UpdateAnswers(session.ID, answers, nextRound)

	c.JSON(http.StatusOK, models.DiagnoseAnswerResponse{
		Success:   true,
		Summary:   summary,
		NextRound: &nextRound,
		Complete:  false,
		Questions: roundQuestions[nextRound],
	})
}

// Final 获取最终方案
// POST /api/diagnose/final
// Body: { sessionId }
// Response: DiagnoseFinalResponse
func (h *DiagnoseHandler) Final(c *gin.Context) {
	var body struct {
		SessionID string `json:"sessionId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	session, err := h.DB.GetSession(body.SessionID)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Session not found",
		})
		return
	}

	if session.CompletedAt == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Session not completed",
		})
		return
	}

	c.JSON(http.StatusOK, models.DiagnoseFinalResponse{
		Success:          true,
		Analysis:         session.PlanText,
		CompletedAt:      session.CompletedAt.Format("2006-01-02T15:04:05Z07:00"),
		TotalRounds:      4,
		QuestionsAnswered: 13,
	})
}

// generateRoundSummary 生成每轮总结
func (h *DiagnoseHandler) generateRoundSummary(answers map[string]string, round int) (string, error) {
	// 提取本轮答案
	questions := roundQuestions[round]
	var prompt strings.Builder
	prompt.WriteString(fmt.Sprintf("用户第 %d 轮回答：\n\n", round))
	for _, q := range questions {
		answer, ok := answers[q.ID]
		if !ok {
			answer = "（未回答）"
		}
		prompt.WriteString(fmt.Sprintf("Q: %s\nA: %s\n\n", q.Question, answer))
	}

	systemPrompt := "你是一位顶级商业咨询师。基于用户的回答，给出'我看到你'的总结。150 字以内。直接说重点，不要鸡汤。"
	userPrompt := prompt.String()

	return h.LLM.Chat(systemPrompt, userPrompt, 400)
}

// generateFinalPlan 生成最终 2000 字方案
func (h *DiagnoseHandler) generateFinalPlan(answers map[string]string) (string, error) {
	var prompt strings.Builder
	prompt.WriteString("用户完整画像（4 轮 13 问）：\n\n")
	for i := 1; i <= 4; i++ {
		questions := roundQuestions[i]
		prompt.WriteString(fmt.Sprintf("### 第 %d 轮\n", i))
		for _, q := range questions {
			answer, ok := answers[q.ID]
			if !ok {
				answer = "（未回答）"
			}
			prompt.WriteString(fmt.Sprintf("- %s\n  %s\n", q.Question, answer))
		}
		prompt.WriteString("\n")
	}

	systemPrompt := "你是一位顶级商业咨询师。基于用户的完整画像，输出一份'你的 500 万路径'方案。2000 字以内，必须包含：起点评估、3 条可行路径、最小第一步、3 个真实陷阱、一句话建议。要求：基于用户实际回答、具体数字、真实案例、不讲鸡汤。"
	userPrompt := prompt.String()

	return h.LLM.Chat(systemPrompt, userPrompt, 4000)
}

// fallbackSummary 失败时的默认总结
func (h *DiagnoseHandler) fallbackSummary(round int) string {
	templates := map[int]string{
		1: "我看到了你的基本情况。这是你的起点评估。",
		2: "我看到了你的资源。你的下一步该认真想想。",
		3: "我看到了你的成败历史。这是宝贵的信号。",
		4: "我看到了你的偏好和目标。",
	}
	if t, ok := templates[round]; ok {
		return t
	}
	return "继续。"
}

// 安全正则工具
var _stripHTML = regexp.MustCompile(`<[^>]+>`)

func stripHTML(s string) string {
	return _stripHTML.ReplaceAllString(s, "")
}
