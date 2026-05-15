export type Difficulty = 'easy' | 'normal' | 'hard';

export interface GameState {
  id: string;
  current_figure: string;
  figure_context: string;
  status: 'playing' | 'completed';
  question_count: number;
  guessed_by: string;
  difficulty: Difficulty;
  created_at: string;
}

export interface Question {
  id: string;
  session_id: string;
  sequence_num: number;
  user_nickname: string;
  user_avatar: string;
  question_text: string;
  ai_answer: string;
  is_correct: boolean;
  created_at: string;
}

export interface UserProfile {
  nickname: string;
  avatar: string;
}

export interface GuessedFigureSummary {
  id: string;
  figure_name: string;
  question_count: number;
  guessed_by: string;
  difficulty: Difficulty;
  created_at: string;
}
