'use client';

interface Props {
  figureName: string;
  guessedBy: string;
  questionCount: number;
  isSurrender?: boolean;
  onNewGame: () => void;
  onGoHome: () => void;
}

export default function GuessResultModal({
  figureName,
  guessedBy,
  questionCount,
  isSurrender,
  onNewGame,
  onGoHome,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in">
        <div className="text-5xl mb-3">{isSurrender ? '🏳️' : '🎉'}</div>

        {isSurrender ? (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-1">答案揭晓</h2>
            <p className="text-sm text-gray-400 mb-1">没关系，下次加油！</p>
          </>
        ) : guessedBy ? (
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {guessedBy} 猜对了！
          </h2>
        ) : (
          <h2 className="text-xl font-bold text-gray-800 mb-1">你猜对了！</h2>
        )}

        <p className="text-3xl font-black text-amber-500 my-2">{figureName}</p>

        <p className="text-sm text-gray-400 mb-6">
          共提问 {questionCount} 次
        </p>

        <div className="flex gap-3">
          <button
            onClick={onNewGame}
            className="flex-1 py-3 rounded-xl bg-amber-400 text-white font-semibold
              hover:bg-amber-500 active:scale-[0.98] transition-all"
          >
            再猜一个
          </button>
          <button
            onClick={onGoHome}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold
              hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            返回主页
          </button>
        </div>
      </div>
    </div>
  );
}
