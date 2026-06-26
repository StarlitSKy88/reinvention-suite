package models

import "time"

// DiagnoseSession 诊断会话
type DiagnoseSession struct {
	ID           string     `db:"id" json:"id"`
	UserID       string     `db:"user_id" json:"userId"`
	StartedAt    time.Time  `db:"started_at" json:"startedAt"`
	CompletedAt  *time.Time `db:"completed_at" json:"completedAt,omitempty"`
	CurrentRound int        `db:"current_round" json:"currentRound"`
	AnswersJSON  string     `db:"answers_json" json:"-"`
	PlanText     string     `db:"plan_text" json:"planText,omitempty"`
}

// API 响应类型
type DiagnoseStartResponse struct {
	Success     bool   `json:"success"`
	SessionID   string `json:"sessionId"`
	CurrentRound int   `json:"currentRound"`
	TotalRounds  int   `json:"totalRounds"`
	Questions    []Question `json:"questions"`
	StartedAt    string `json:"startedAt"`
}

type Question struct {
	ID         string `json:"id"`
	Question   string `json:"question"`
	PromptHint string `json:"promptHint,omitempty"`
}

type DiagnoseAnswer struct {
	QuestionID string `json:"questionId"`
	Answer     string `json:"answer"`
}

type DiagnoseAnswerResponse struct {
	Success   bool       `json:"success"`
	Summary   string     `json:"summary"`
	NextRound *int       `json:"nextRound"`
	Complete  bool       `json:"complete"`
	Questions []Question `json:"questions,omitempty"`
}

type DiagnoseFinalResponse struct {
	Success          bool   `json:"success"`
	Analysis         string `json:"analysis"`
	CompletedAt      string `json:"completedAt"`
	TotalRounds      int    `json:"totalRounds"`
	QuestionsAnswered int    `json:"questionsAnswered"`
}
