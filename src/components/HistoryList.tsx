'use client';

import { GuessedFigureSummary } from '@/types';

interface Props {
  figures: GuessedFigureSummary[];
  onSelect: (figure: GuessedFigureSummary) => void;
}

export default function HistoryList({ figures, onSelect }: Props) {
  if (figures.length === 0) {
    return (
      <div className="text-center text-gray-300 text-sm py-8">
        还没有猜出过人物，来做第一个猜对的人吧！
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">
        已猜出人物
      </h3>
      {figures.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl
            bg-white border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50
            active:scale-[0.98] transition-all text-left"
        >
          <span className="font-medium text-gray-700">
            {f.figure_name}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium
              ${f.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-600' :
                f.difficulty === 'hard' ? 'bg-red-100 text-red-500' :
                'bg-amber-100 text-amber-600'}`}>
              {f.difficulty === 'easy' ? '简' : f.difficulty === 'hard' ? '难' : '普'}
            </span>
          </span>
          <span className="text-xs text-gray-400">
            {f.question_count} 次提问 · {f.guessed_by}
          </span>
        </button>
      ))}
    </div>
  );
}
