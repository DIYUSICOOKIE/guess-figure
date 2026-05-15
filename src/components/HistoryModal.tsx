'use client';

import { Question, GuessedFigureSummary } from '@/types';
import QuestionTimeline from './QuestionTimeline';

interface Props {
  figure: GuessedFigureSummary;
  questions: Question[];
  onClose: () => void;
}

export default function HistoryModal({ figure, questions, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{figure.figure_name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-2 text-sm text-gray-400 flex gap-4">
          <span>猜对者：{figure.guessed_by || '未知'}</span>
          <span>提问 {figure.question_count} 次</span>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-3 max-h-[50vh]">
          {questions.length === 0 ? (
            <p className="text-gray-300 text-center py-8">暂无问答记录</p>
          ) : (
            <QuestionTimeline questions={questions} />
          )}
        </div>

        {/* Close */}
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium
              hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
