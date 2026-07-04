'use client';

import { useState } from 'react';
import { RoomPhoto } from '@/lib/types';

interface Props {
  photos: RoomPhoto[];
  onClose: () => void;
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
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                  <span className="text-white font-bold text-sm truncate w-full text-center">{photo.username}</span>
                  <span className="text-green-400 text-xs">📸 Mog Certified</span>
                  <span className="text-gray-400 text-xs">checked by {photo.fromUsername}</span>
                </div>
                <div className="absolute bottom-1.5 left-1.5 right-1.5 opacity-0 group-hover:opacity-0">
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enlarged view */}
      {enlarged && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90" onClick={() => setEnlarged(null)}>
          <div className="max-w-lg w-full mx-4 fade-in" onClick={e => e.stopPropagation()}>
            <img src={enlarged.photoBase64} alt={enlarged.username} className="w-full rounded-2xl border border-green-500/30" />
            <div className="text-center mt-3">
              <p className="font-bold text-lg">{enlarged.username}</p>
              <p className="text-green-400 text-sm">📸 Mog Certified — caught studying by {enlarged.fromUsername}</p>
              <p className="text-gray-600 text-xs mt-1">{new Date(enlarged.timestamp).toLocaleTimeString()}</p>
            </div>
            <div className="flex justify-center mt-4">
              <button className="btn btn-ghost" onClick={() => setEnlarged(null)}>✕ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
