-- 猜历史人物 · 数据库 Schema
-- 在 Supabase SQL Editor 中运行此文件

-- 游戏状态表（同一时间只有一行 status='playing'）
CREATE TABLE IF NOT EXISTS game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_figure TEXT NOT NULL,
  figure_context TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'playing',
  question_count INTEGER NOT NULL DEFAULT 0,
  guessed_by TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 如果表已存在但缺少 difficulty 字段，运行下面这行：
-- ALTER TABLE game_state ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'normal';

-- 问答记录表
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_state(id) ON DELETE CASCADE,
  sequence_num INTEGER NOT NULL,
  user_nickname TEXT NOT NULL,
  user_avatar TEXT NOT NULL,
  question_text TEXT NOT NULL,
  ai_answer TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_questions_session ON questions(session_id, sequence_num);
CREATE INDEX IF NOT EXISTS idx_game_state_status ON game_state(status);

-- 启用 Realtime（新版 Supabase 已自动包含，此行可选；若报错跳过即可）
-- ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
-- ALTER PUBLICATION supabase_realtime ADD TABLE questions;

-- RLS 策略：允许所有人读取
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_select_game_state" ON game_state
  FOR SELECT USING (true);

CREATE POLICY "allow_all_select_questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "allow_all_insert_questions" ON questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_all_update_game_state" ON game_state
  FOR UPDATE USING (true);
