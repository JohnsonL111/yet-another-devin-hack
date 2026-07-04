'use client';

import { useEffect } from 'react';
import { RecapData } from '@/lib/types';
import { auraColor } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface Props {
  recap: RecapData;
  myId: string;
  onStartBreak: () => void;
  onNewSession: () => void;
  isHost: boolean;
}

export default function RecapScreen({ recap, myId, onStartBreak, onNewSession, isHost }: Props) {
  useEffect(() => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#7c3aed', '#4f46e5', '#a78bfa', '#60a5fa', '#fbbf24'] });
  }, []);

  const sorted = [...recap.members].sort((a, b) => b.sessionAura - a.sessionAura);
  const focusMin = Math.round(recap.focusDurationMs / 60000);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-sm overflow-y-auto py-8">
      <div className="glass rounded-3xl p-8 w-full max-w-2xl mx-4 fade-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-3xl font-black mb-1">Session Complete!</h2>
          <p className="text-gray-400">{focusMin} minute focus session finished</p>
        </div>

        {recap.mvp && (
          <div className="glass rounded-2xl p-5 mb-6 text-center border border-yellow-500/30 glow-yellow">
            <div className="text-3xl mb-1">👑</div>
            <div className="text-xl font-black text-yellow-300">Session MVP</div>
            <div className="text-2xl font-bold mt-1">{recap.mvp.username}</div>
            <div className="text-yellow-400/70 text-sm">+{recap.mvp.sessionAura} Aura this session</div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {sorted.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center gap-4 glass rounded-xl px-4 py-3 border transition-all ${m.id === myId ? 'border-purple-500/40' : 'border-white/5'}`}
            >
              <div className="text-xl font-black w-6 text-gray-500">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </div>
              <div className="flex-1">
                <div className="font-bold flex items-center gap-1">
                  {m.username}
                  {m.id === myId && <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">you</span>}
                  {recap.mvp?.id === m.id && <span className="text-xs">👑</span>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  ✅ {m.sessionPassedChecks} passed · ❌ {m.sessionFailedChecks} failed · 📤 {m.sessionSentSuccessfully} sent
                </div>
              </div>
              <div className="text-right">
                <div className={`font-black text-lg ${auraColor(m.sessionAura)}`}>
                  {m.sessionAura >= 0 ? '+' : ''}{m.sessionAura}
                </div>
                <div className="text-xs text-gray-600">Total: {m.totalAura}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-4 mb-6 text-sm text-gray-500">
          <div className="font-semibold text-gray-300 mb-2">Aura Breakdown</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span>🎯 Finish session</span><span className="text-green-400">+50</span>
            <span>✅ Pass a Mog Check</span><span className="text-green-400">+25</span>
            <span>❌ Fail a Mog Check</span><span className="text-red-400">−30</span>
            <span>📤 Target passes your check</span><span className="text-green-400">+10</span>
          </div>
        </div>

        {isHost && (
          <div className="flex gap-3">
            <button className="btn btn-success flex-1 justify-center" onClick={onStartBreak}>
              ☕ Start Break
            </button>
            <button className="btn btn-primary flex-1 justify-center" onClick={onNewSession}>
              🔁 New Session
            </button>
          </div>
        )}
        {!isHost && (
          <p className="text-center text-gray-500 text-sm">Waiting for host to start the next session...</p>
        )}
      </div>
    </div>
  );
}
