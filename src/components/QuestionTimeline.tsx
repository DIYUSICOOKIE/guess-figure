'use client';

import { Question } from '@/types';

const ANSWER_COLORS: Record<string, string> = {
  '是': 'text-green-600',
  '不是': 'text-red-500',
  '不确定': 'text-amber-500',
  '无关': 'text-gray-400',
  '猜对了': 'text-emerald-500 font-bold text-lg',
};

interface Props {
  questions: Question[];
}

export default function QuestionTimeline({ questions }: Props) {
  if (questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
        还没有人提问，你来问第一个吧 👇
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2">
      <div className="relative pl-8">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-amber-200 rounded" />

        {questions.map((q, i) => (
          <div key={q.id} className="relative mb-5">
            {/* Timeline dot */}
            <div
              className={`absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm
                ${q.is_correct ? 'bg-emerald-400' : 'bg-amber-300'}`}
            />

            {/* Sequence number */}
            <span className="text-xs text-gray-300 font-mono mr-1.5">
              #{q.sequence_num}
            </span>

            {/* Question */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-gray-800 font-medium text-[15px] leading-relaxed">
                {q.question_text}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-auto">
                {q.user_avatar} {q.user_nickname}
              </span>
            </div>

            {/* AI Answer */}
            <div className={`mt-1 text-sm ${ANSWER_COLORS[q.ai_answer] || 'text-gray-500'}`}>
              → {q.ai_answer || '判定中...'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
