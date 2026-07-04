'use client';

import { useState } from 'react';
import { RoomPhoto, MogScorecard } from '@/lib/types';

interface Props {
  photos: RoomPhoto[];
  onClose: () => void;
}

const CRITERIA: { key: keyof MogScorecard; label: string; icon: string }[] = [
  { key: 'jawline',    label: 'Jawline',    icon: '💎' },
  { key: 'hair',       label: 'Hair',       icon: '💇' },
  { key: 'symmetry',   label: 'Symmetry',   icon: '⚖️' },
  { key: 'expression', label: 'Expression', icon: '😤' },
  { key: 'posture',    label: 'Posture',    icon: '🏋️' },
  { key: 'lighting',   label: 'Lighting',   icon: '💡' },
  { key: 'aura',       label: 'Aura',       icon: '✨' },
  { key: 'confidence', label: 'Confidence', icon: '🔥' },
  { key: 'focus',      label: 'Focus',      icon: '🎯' },
];

function scoreColor(n: number) {
  if (n >= 8) return 'text-green-400';
  if (n >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="h-1 bg-white/10 rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function PhotoGallery({ photos, onClose }: Props) {
  const [enlarged, setEnlarged] = useState<RoomPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="glass rounded-3xl p-8 w-full max-w-md mx-4 fade-in text-center" onClick={e => e.stopPropagation()}>
          <div className="text-5xl mb-3">📷</div>
          <h2 className="text-xl font-bold mb-2">No Photos Yet</h2>
          <p className="text-gray-500 text-sm mb-6">Mog Check photos will appear here when someone passes a check.</p>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl p-6 w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            📸 Mog Check Photos
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">{photos.length}</span>
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...photos].reverse().map((photo, i) => (
              <button
                key={i}
                onClick={() => setEnlarged(photo)}
                className="group relative rounded-xl overflow-hidden border border-white/8 hover:border-green-500/40 transition-all aspect-square"
              >
                <img src={photo.photoBase64} alt={photo.username} className="w-full h-full object-cover" />
                {/* Overall score badge */}
                {photo.scorecard && (
                  <div className="absolute top-1.5 right-1.5 bg-black/80 rounded-lg px-1.5 py-0.5 text-xs font-black">
                    <span className={scoreColor(photo.scorecard.overall)}>{photo.scorecard.overall}/10</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                  <span className="text-white font-bold text-sm truncate w-full text-center">{photo.username}</span>
                  <span className="text-green-400 text-xs">📸 Mog Certified</span>
                  <span className="text-gray-400 text-xs">by {photo.fromUsername}</span>
                  {photo.scorecard && (
                    <span className={`text-xs font-bold mt-1 ${scoreColor(photo.scorecard.overall)}`}>
                      Overall: {photo.scorecard.overall}/10
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enlarged view */}
      {enlarged && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90" onClick={() => setEnlarged(null)}>
          <div
            className="w-full mx-4 fade-in flex flex-col sm:flex-row gap-4 max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Photo */}
            <div className="flex-shrink-0 sm:w-64">
              <img src={enlarged.photoBase64} alt={enlarged.username} className="w-full rounded-2xl border border-green-500/30" />
              <div className="text-center mt-3">
                <p className="font-bold text-lg">{enlarged.username}</p>
                <p className="text-green-400 text-sm">📸 Mog Certified</p>
                <p className="text-gray-500 text-xs">checked by {enlarged.fromUsername}</p>
                <p className="text-gray-600 text-xs mt-1">{new Date(enlarged.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Scorecard */}
            {enlarged.scorecard ? (
              <div className="flex-1 glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base">Mog Scorecard</h3>
                  <div className={`text-2xl font-black ${scoreColor(enlarged.scorecard.overall)}`}>
                    {enlarged.scorecard.overall}/10
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-300 italic mb-4 leading-snug">
                  &ldquo;{enlarged.scorecard.summary}&rdquo;
                </p>

                {/* Criteria */}
                <div className="space-y-2">
                  {CRITERIA.map(({ key, label, icon }) => {
                    const score = enlarged.scorecard![key as keyof MogScorecard] as number;
                    return (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-center">{icon}</span>
                        <span className="w-20 text-gray-400 flex-shrink-0">{label}</span>
                        <ScoreBar score={score} />
                        <span className={`w-8 text-right font-bold flex-shrink-0 ${scoreColor(score)}`}>{score}/10</span>
                      </div>
                    );
                  })}
                </div>

                {enlarged.scorecard.mogBonus > 0 && (
                  <div className="mt-4 text-center glass rounded-xl py-2 px-3 border border-yellow-500/20">
                    <span className="text-yellow-400 text-sm font-bold">✨ Mog Bonus: +{enlarged.scorecard.mogBonus} aura</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 glass rounded-2xl p-4 flex items-center justify-center">
                <p className="text-gray-500 text-sm">⏳ Analyzing mog...</p>
              </div>
            )}

            <div className="flex justify-center sm:hidden mt-2">
              <button className="btn btn-ghost" onClick={() => setEnlarged(null)}>✕ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
