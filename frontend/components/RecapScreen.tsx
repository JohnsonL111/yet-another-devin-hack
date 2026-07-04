'use client';

import { useEffect, useState } from 'react';
import { RecapData } from '@/lib/types';
import { auraColor } from '@/lib/utils';
import AuraLog from './AuraLog';
import PhotoGallery from './PhotoGallery';
import confetti from 'canvas-confetti';

interface Props {
  recap: RecapData;
  myId: string;
  onStartBreak: () => void;
  onNewSession: () => void;
  onBackToLobby: () => void;
  isHost: boolean;
}

export default function RecapScreen({ recap, myId, onStartBreak, onNewSession, onBackToLobby, isHost }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);

  useEffect(() => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#7c3aed', '#4f46e5', '#a78bfa', '#60a5fa', '#fbbf24'] });
  }, []);

  const sorted = [...recap.members].sort((a, b) => b.sessionAura - a.sessionAura);
  const focusMin = Math.round(recap.focusDurationMs / 60000);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-sm overflow-y-auto py-8">
      {showPhotos && <PhotoGallery photos={recap.photos} onClose={() => setShowPhotos(false)} />}

      <div className="glass rounded-3xl p-8 w-full max-w-2xl mx-4 fade-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-3xl font-black mb-1">Session Complete!</h2>
          <p className="text-gray-400">{focusMin} minute focus session — everyone gets +50 Aura</p>
        </div>

        {recap.mvp && (
          <div className="glass rounded-2xl p-5 mb-6 text-center border border-yellow-500/30 glow-yellow">
            <div className="text-3xl mb-1">👑</div>
            <div className="text-xl font-black text-yellow-300">Session MVP</div>
            <div className="text-2xl font-bold mt-1">{recap.mvp.username}</div>
            <div className="text-yellow-400/70 text-sm">+{recap.mvp.sessionAura} Aura this session</div>
          </div>
        )}

        {/* Photos button */}
        {recap.photos.length > 0 && (
          <button
            onClick={() => setShowPhotos(true)}
            className="w-full mb-4 glass rounded-xl px-4 py-3 border border-green-500/20 hover:border-green-500/40 transition-all flex items-center justify-center gap-2 text-sm text-green-300"
          >
            📸 View {recap.photos.length} Mog Check Photo{recap.photos.length !== 1 ? 's' : ''}
          </button>
        )}

        <div className="space-y-2 mb-6">
          {sorted.map((m, i) => (
            <div key={m.id} className={`glass rounded-xl border transition-all ${m.id === myId ? 'border-purple-500/40' : 'border-white/5'}`}>
              {/* Row */}
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              >
                <div className="text-xl font-black w-6 text-gray-500">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center gap-1 text-sm flex-wrap">
                    {m.username}
                    {m.id === myId && <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">you</span>}
                    {recap.mvp?.id === m.id && <span className="text-xs">👑</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    ✅ {m.sessionPassedChecks} · ❌ {m.sessionFailedChecks} · 📤 {m.sessionSentSuccessfully}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <div>
                    <div className={`font-black text-lg ${auraColor(m.sessionAura)}`}>
                      {m.sessionAura >= 0 ? '+' : ''}{m.sessionAura}
                    </div>
                    <div className="text-xs text-gray-600">Total: {m.totalAura}</div>
                  </div>
                  <span className="text-gray-600 text-xs">{expandedId === m.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Aura log */}
              {expandedId === m.id && (
                <div className="border-t border-white/5 px-4 py-3 fade-in">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Aura breakdown</div>
                  <AuraLog log={m.auraLog} />
                </div>
              )}
            </div>
          ))}
        </div>

        {isHost ? (
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="btn btn-ghost flex-1 min-w-[120px] justify-center" onClick={onBackToLobby}>
              🏠 Back to Lobby
            </button>
            <button className="btn btn-success flex-1 min-w-[120px] justify-center" onClick={onStartBreak}>
              ☕ Start Break
            </button>
            <button className="btn btn-primary flex-1 min-w-[120px] justify-center" onClick={onNewSession}>
              🔁 New Session
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm">Waiting for host to continue...</p>
        )}
      </div>
    </div>
  );
}
