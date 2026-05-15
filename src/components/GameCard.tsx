'use client';

import { Difficulty } from '@/types';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; colors: string }> = {
  easy: { label: '简单', colors: 'from-emerald-300 via-emerald-400 to-green-500 shadow-emerald-200/50 hover:shadow-emerald-200/60' },
  normal: { label: '普通', colors: 'from-amber-300 via-amber-400 to-orange-400 shadow-amber-200/50 hover:shadow-amber-200/60' },
  hard: { label: '困难', colors: 'from-red-300 via-red-400 to-rose-500 shadow-red-200/50 hover:shadow-red-200/60' },
};

interface Props {
  questionCount: number;
  difficulty: Difficulty;
  onClick: () => void;
}

export default function GameCard({ questionCount, difficulty, onClick }: Props) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;

  return (
    <button
      onClick={onClick}
      className={`w-full aspect-square max-w-[280px] mx-auto rounded-3xl
        bg-gradient-to-br ${config.colors}
        shadow-lg active:scale-[0.97] transition-all duration-200
        flex flex-col items-center justify-center cursor-pointer`}
    >
      <span className="text-xs text-white/70 font-medium mb-2 bg-white/20 px-3 py-0.5 rounded-full">
        {config.label}
      </span>
      <span className="text-7xl font-black text-white drop-shadow-md select-none">
        ？
      </span>
      <span className="text-white/80 text-sm mt-3 font-medium">
        已提问 {questionCount} 次
      </span>
      <span className="text-white/60 text-xs mt-1">
        点击开始提问
      </span>
    </button>
  );
}
