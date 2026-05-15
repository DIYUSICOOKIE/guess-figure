'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase';
import { GameState, Question, UserProfile } from '@/types';
import QuestionTimeline from '@/components/QuestionTimeline';
import GuessResultModal from '@/components/GuessResultModal';

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

export default function PlayPage() {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<GameState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultFigure, setResultFigure] = useState('');
  const [resultGuessedBy, setResultGuessedBy] = useState('');
  const [isSurrender, setIsSurrender] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Init
  useEffect(() => {
    const saved = loadProfile();
    if (!saved) {
      router.replace('/');
      return;
    }
    setProfile(saved);
    initGame(saved);
  }, []);

  async function initGame(user: UserProfile) {
    try {
      const res = await fetch('/api/new-game', { method: 'POST' });
      const data = await res.json();

      if (!data.session) {
        setError('游戏初始化失败');
        return;
      }

      setSession(data.session);

      // Load existing questions
      const { data: existing } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', data.session.id)
        .order('sequence_num', { ascending: true });

      if (existing) setQuestions(existing as Question[]);

      // If game already completed
      if (data.session.status === 'completed') {
        setResultFigure(data.session.current_figure);
        setResultGuessedBy(data.session.guessed_by);
        setShowResult(true);
      }
    } catch (err) {
      console.error('Init game error:', err);
      setError('加载失败，请刷新重试');
    }
  }

  // Realtime: questions
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`questions-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'questions',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const q = payload.new as Question;
          setQuestions((prev) => {
            if (prev.some((x) => x.id === q.id)) return prev;
            return [...prev, q];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // Realtime: game completion
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`game-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_state',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as GameState;
          if (updated.status === 'completed') {
            setResultFigure(updated.current_figure);
            setResultGuessedBy(updated.guessed_by);
            setShowResult(true);
          }
          setSession(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // Scroll to bottom when questions change
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [questions]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !session || !profile) return;

    // End with ? or 吗
    if (!text.endsWith('?') && !text.endsWith('？') && !text.includes('吗')) {
      setError('请以问句形式提问（以"吗"或"？"结尾）');
      return;
    }

    setSending(true);
    setError('');
    setInput('');

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          question: text,
          userNickname: profile.nickname,
          userAvatar: profile.avatar,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || '发送失败');
        return;
      }

      const data = await res.json();

      if (data.isCorrect) {
        setResultFigure(data.figureName);
        setResultGuessedBy(profile.nickname);
        setShowResult(true);
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSending(false);
    }
  }, [input, sending, session, profile]);

  const handleSurrender = useCallback(async () => {
    if (!session) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/surrender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '投降失败');
        return;
      }
      setResultFigure(data.figureName);
      setResultGuessedBy('');
      setIsSurrender(true);
      setShowResult(true);
    } catch {
      setError('网络错误');
    } finally {
      setSending(false);
    }
  }, [session]);

  const handleNewGame = useCallback(async () => {
    setShowResult(false);
    setResultFigure('');
    setResultGuessedBy('');
    setIsSurrender(false);
    setQuestions([]);
    setError('');

    try {
      const res = await fetch('/api/new-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true, difficulty: session?.difficulty || 'normal' }),
      });
      const data = await res.json();
      if (data.session) setSession(data.session);
    } catch {
      setError('创建新游戏失败');
    }
  }, []);

  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-[#fefce8]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-100/60 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-gray-600 p-1 -ml-1"
        >
          ← 返回
        </button>
        <h1 className="text-base font-semibold text-gray-700 flex-1 text-center mr-6">
          猜历史人物
        </h1>
        <span className="text-xs text-gray-400 flex items-center gap-2">
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium
            ${session?.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-600' :
              session?.difficulty === 'hard' ? 'bg-red-100 text-red-500' :
              'bg-amber-100 text-amber-600'}`}>
            {session?.difficulty === 'easy' ? '简单' : session?.difficulty === 'hard' ? '困难' : '普通'}
          </span>
          提问 {session?.question_count || 0}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 text-red-500 text-sm rounded-lg">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Timeline */}
      <div ref={timelineRef} className="flex-1 overflow-y-auto px-4 py-4">
        <QuestionTimeline questions={questions} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur-sm border-t border-amber-100/60 sticky bottom-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="是某个朝代/身份/性别/功绩...吗？"
            disabled={sending || session?.status === 'completed'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
              placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim() || session?.status === 'completed'}
            className="px-5 py-2.5 rounded-xl bg-amber-400 text-white font-semibold text-sm
              hover:bg-amber-500 active:scale-[0.96] transition-all
              disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {sending ? '...' : '发送'}
          </button>
        </div>
        {session?.status !== 'completed' && (
          <div className="text-center mt-2">
            <button
              onClick={handleSurrender}
              disabled={sending}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors py-1 px-2
                disabled:opacity-50"
            >
              🏳️ 投降，告诉我答案
            </button>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {showResult && (
        <GuessResultModal
          figureName={resultFigure}
          guessedBy={isSurrender ? '' : resultGuessedBy}
          questionCount={session?.question_count || questions.length}
          isSurrender={isSurrender}
          onNewGame={handleNewGame}
          onGoHome={() => router.push('/')}
        />
      )}
    </div>
  );
}
