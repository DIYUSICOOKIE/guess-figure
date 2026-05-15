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
  const [loading, setLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    if (!profile) return;

    async function init() {
      try {
        const res = await fetch('/api/new-game', { method: 'POST' });
        const data = await res.json();
        if (data.session) setCurrentGame(data.session);

        const { data: completed } = await supabase
          .from('game_state')
          .select('id, current_figure, question_count, guessed_by, created_at')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(20);

        if (completed) {
          setHistory(
            completed.map((r) => ({
              id: r.id,
              figure_name: r.current_figure,
              question_count: r.question_count,
              guessed_by: r.guessed_by,
              created_at: r.created_at,
            }))
          );
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [profile]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showWelcome && <WelcomeModal onDone={handleProfileDone} />}

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

        {/* Current Game */}
        {currentGame ? (
          <div className="mb-10">
            <GameCard
              questionCount={currentGame.question_count}
              onClick={() => router.push('/play')}
            />
          </div>
        ) : (
          <div className="mb-10 text-center">
            <div
              className="w-full aspect-square max-w-[280px] mx-auto rounded-3xl
              bg-white border border-dashed border-gray-200
              flex flex-col items-center justify-center text-gray-300"
            >
              <span className="text-5xl mb-3">🎉</span>
              <span className="text-sm">等待新题目...</span>
            </div>
          </div>
        )}

        {/* History */}
        <HistoryList figures={history} onSelect={handleSelectFigure} />
      </div>

      {selectedFigure && (
        <HistoryModal
          figure={selectedFigure}
          questions={historyQuestions}
          onClose={() => setSelectedFigure(null)}
        />
      )}
    </>
  );
}
