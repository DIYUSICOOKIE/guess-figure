'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase';
import { GameState, UserProfile, GuessedFigureSummary, Question } from '@/types';
import WelcomeModal from '@/components/WelcomeModal';
import GameCard from '@/components/GameCard';
import HistoryList from '@/components/HistoryList';
import HistoryModal from '@/components/HistoryModal';

const STORAGE_KEY = 'guess-figure-user';

function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProfile(p: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export default function HomePage() {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GuessedFigureSummary[]>([]);
  const [selectedFigure, setSelectedFigure] = useState<GuessedFigureSummary | null>(null);
  const [historyQuestions, setHistoryQuestions] = useState<Question[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setShowWelcome(false);
    } else {
      setShowWelcome(true);
      setLoading(false);
    }
  }, []);

  const handleProfileDone = useCallback((p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setShowWelcome(false);
    setLoading(true);
    setInitError('');
  }, []);

  // Run init when profile becomes available
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setInitError('');

      try {
        const res = await fetch('/api/new-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || '服务器错误');
        }

        if (!cancelled && data.session) {
          setCurrentGame(data.session);
        }

        const { data: completed, error: historyErr } = await supabase
          .from('game_state')
          .select('id, current_figure, question_count, guessed_by, difficulty, created_at')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(20);

        if (historyErr) console.error('History query error:', historyErr);

        if (!cancelled && completed) {
          setHistory(
            completed.map((r) => ({
              id: r.id,
              figure_name: r.current_figure,
              question_count: r.question_count,
              guessed_by: r.guessed_by,
              difficulty: r.difficulty || 'normal',
              created_at: r.created_at,
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '未知错误';
          console.error('Init error:', msg);
          setInitError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [profile, retryKey]);

  // Realtime: game_state changes
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('home-game-state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state' },
        (payload) => {
          const updated = payload.new as GameState;
          if (payload.eventType === 'INSERT' && updated.status === 'playing') {
            setCurrentGame(updated);
          } else if (payload.eventType === 'UPDATE') {
            if (updated.id === currentGame?.id) {
              if (updated.status === 'completed') {
                setCurrentGame(null);
                setHistory((prev) => [
                  {
                    id: updated.id,
                    figure_name: updated.current_figure,
                    question_count: updated.question_count,
                    guessed_by: updated.guessed_by,
                    difficulty: (updated as GameState).difficulty || 'normal',
                    created_at: updated.created_at,
                  },
                  ...prev,
                ]);
              } else {
                setCurrentGame(updated);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, currentGame?.id]);

  const handleSelectFigure = useCallback(async (figure: GuessedFigureSummary) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', figure.id)
      .order('sequence_num', { ascending: true });

    setHistoryQuestions((data as Question[]) || []);
    setSelectedFigure(figure);
  }, []);

  // New user: just show welcome modal on clean background
  if (!profile && showWelcome) {
    return (
      <div className="min-h-screen bg-[#fefce8]">
        <WelcomeModal onDone={handleProfileDone} />
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fefce8]">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">正在连接...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8 text-sm text-gray-400">
        <span className="font-medium text-gray-500">
          {profile?.avatar} {profile?.nickname}
        </span>
        <div className="flex gap-4">
          <span>猜对 {history.length}</span>
          <span>
            提问{' '}
            {history.reduce((s, h) => s + h.question_count, 0) +
              (currentGame?.question_count || 0)}
          </span>
        </div>
      </div>

      {/* Error */}
      {initError && (
        <div className="mb-6 p-4 bg-red-50 rounded-xl text-center">
          <p className="text-red-500 text-sm mb-3">加载失败：{initError}</p>
          <button
            onClick={() => setRetryKey((k) => k + 1)}
            className="px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium
              hover:bg-red-600 active:scale-95 transition-all"
          >
            重试
          </button>
        </div>
      )}

      {/* Difficulty Selector */}
      <div className="mb-6">
        <div className="flex justify-center gap-2">
          {([
            ['easy', '😊 简单'],
            ['normal', '🤔 普通'],
            ['hard', '💀 困难'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setDifficulty(value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                ${difficulty === value
                  ? 'bg-amber-400 text-white shadow-sm'
                  : 'bg-white text-gray-400 hover:bg-amber-50 hover:text-amber-600 border border-gray-100'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Game */}
      {currentGame ? (
        <div className="mb-10">
          <GameCard
            questionCount={currentGame.question_count}
            difficulty={currentGame.difficulty || 'normal'}
            onClick={() => router.push('/play')}
          />
        </div>
      ) : (
        <div className="mb-10 text-center">
          <div className="w-full aspect-square max-w-[280px] mx-auto rounded-3xl
            bg-white border border-dashed border-gray-200
            flex flex-col items-center justify-center text-gray-300">
            <span className="text-5xl mb-3">🎉</span>
            <span className="text-sm">
              {initError ? '请点击上方重试按钮' : '有新题目时将自动出现'}
            </span>
          </div>
        </div>
      )}

      {/* History */}
      <HistoryList figures={history} onSelect={handleSelectFigure} />

      {selectedFigure && (
        <HistoryModal
          figure={selectedFigure}
          questions={historyQuestions}
          onClose={() => setSelectedFigure(null)}
        />
      )}
    </div>
  );
}
