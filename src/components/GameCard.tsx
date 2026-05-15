'use client';

interface Props {
  questionCount: number;
  onClick: () => void;
}

export default function GameCard({ questionCount, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full aspect-square max-w-[280px] mx-auto rounded-3xl
        bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400
        shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-200/60
        active:scale-[0.97] transition-all duration-200
        flex flex-col items-center justify-center cursor-pointer"
    >
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
