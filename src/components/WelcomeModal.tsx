'use client';

import { useState } from 'react';
import { UserProfile } from '@/types';

const AVATARS = [
  '🐱', '🐶', '🐼', '🦊', '🐸', '🐵', '🐮', '🐨',
  '🐯', '🦁', '🐻', '🐰', '🐲', '🦄', '🐙', '🐳',
  '🦜', '🐞', '🦋', '🐌', '🐢', '🦖', '🐉', '🌸',
];

interface Props {
  onDone: (profile: UserProfile) => void;
}

export default function WelcomeModal({ onDone }: Props) {
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [nickname, setNickname] = useState('');

  const handleSubmit = () => {
    const name = nickname.trim().slice(0, 8);
    if (name.length < 2) return;
    onDone({ nickname: name, avatar });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
          👋 欢迎来猜历史人物
        </h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          选择一个头像和昵称开始吧
        </p>

        {/* Avatar Picker */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">{avatar}</div>
          <div className="flex flex-wrap justify-center gap-2 max-h-[140px] overflow-y-auto p-1">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl transition-all
                  ${a === avatar ? 'bg-amber-100 ring-2 ring-amber-400 scale-110' : 'hover:bg-gray-100'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Nickname Input */}
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="输入昵称（2-8字）"
          maxLength={8}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-base
            focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
            placeholder:text-gray-300"
          autoFocus
        />

        <button
          onClick={handleSubmit}
          disabled={nickname.trim().length < 2}
          className="w-full mt-4 py-3 rounded-xl bg-amber-400 text-white font-semibold text-base
            hover:bg-amber-500 active:scale-[0.98] transition-all
            disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          开始游戏
        </button>
      </div>
    </div>
  );
}
