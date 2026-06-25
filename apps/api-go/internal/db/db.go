// Package db 数据库操作
package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"github.com/jmoiron/sqlx"
	"github.com/reinvention/api/internal/models"
)

// DB 数据库封装
type DB struct {
	*sqlx.DB
}

// New 创建新数据库（SQLite，兼容 Cloudflare D1）
func New(path string) (*DB, error) {
	db, err := sqlx.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	return &DB{db}, nil
}

// InitSchema 初始化 schema
func (d *DB) InitSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS diagnose_sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		started_at TIMESTAMP NOT NULL,
		completed_at TIMESTAMP,
		current_round INTEGER NOT NULL DEFAULT 1,
		answers_json TEXT NOT NULL DEFAULT '{}',
		plan_text TEXT DEFAULT ''
	);

	CREATE INDEX IF NOT EXISTS idx_user
		ON diagnose_sessions(user_id);

	CREATE INDEX IF NOT EXISTS idx_completed
		ON diagnose_sessions(completed_at);
	`
	_, err := d.Exec(schema)
	return err
}

// CreateSession 创建新会话
func (d *DB) CreateSession(userID string) (*models.DiagnoseSession, error) {
	session := &models.DiagnoseSession{
		ID:           "diag_" + uuid.New().String(),
		UserID:       userID,
		StartedAt:    time.Now(),
		CurrentRound: 1,
		AnswersJSON:  "{}",
	}
	_, err := d.Exec(
		`INSERT INTO diagnose_sessions
			(id, user_id, started_at, current_round, answers_json)
			VALUES (?, ?, ?, ?, ?)`,
		session.ID, session.UserID, session.StartedAt,
		session.CurrentRound, session.AnswersJSON,
	)
	if err != nil {
		return nil, err
	}
	return session, nil
}

// GetSession 获取会话
func (d *DB) GetSession(id string) (*models.DiagnoseSession, error) {
	var s models.DiagnoseSession
	err := d.Get(&s,
		`SELECT id, user_id, started_at, completed_at,
			current_round, answers_json, plan_text
		 FROM diagnose_sessions WHERE id = ?`,
		id,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// UpdateAnswers 更新答案
func (d *DB) UpdateAnswers(id string, answers map[string]string, currentRound int) error {
	answersJSON, _ := json.Marshal(answers)
	_, err := d.Exec(
		`UPDATE diagnose_sessions
		 SET answers_json = ?, current_round = ?
		 WHERE id = ?`,
		string(answersJSON), currentRound, id,
	)
	return err
}

// CompleteSession 标记完成 + 存储方案
func (d *DB) CompleteSession(id string, planText string) error {
	now := time.Now()
	_, err := d.Exec(
		`UPDATE diagnose_sessions
		 SET completed_at = ?, current_round = 5, plan_text = ?
		 WHERE id = ?`,
		now, planText, id,
	)
	return err
}

// ParseAnswers 解析答案 JSON
func (s *models.DiagnoseSession) ParseAnswers() (map[string]string, error) {
	var answers map[string]string
	if err := json.Unmarshal([]byte(s.AnswersJSON), &answers); err != nil {
		return nil, err
	}
	return answers, nil
}
