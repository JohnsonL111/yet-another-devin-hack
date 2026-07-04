'use client';

import { useState } from 'react';
import CreateRoom from '@/components/CreateRoom';
import JoinRoom from '@/components/JoinRoom';

export default function Home() {
  const [view, setView] = useState<'home' | 'create' | 'join'>('home');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)' }} />

      {view === 'home' && (
        <div className="fade-in text-center max-w-xl w-full">
          <div className="text-8xl mb-4">😤</div>
          <h1 className="text-5xl font-black tracking-tight mb-3"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Study Mog
          </h1>
          <p className="text-gray-400 text-xl mb-2">Stay locked in. Catch your friends slacking.</p>
          <p className="text-gray-600 text-sm mb-10">Multiplayer Pomodoro · Mog Checks · Aura Points</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn btn-primary text-lg px-8 py-4" onClick={() => setView('create')}>
              🏠 Create Study Room
            </button>
            <button className="btn btn-ghost text-lg px-8 py-4" onClick={() => setView('join')}>
              🔗 Join Study Room
            </button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 text-center">
            {[
              { icon: '⏱️', title: 'Shared Timer', desc: 'Server-synced Pomodoro for the whole squad' },
              { icon: '🚨', title: 'Mog Checks', desc: 'Suspect someone slacking? Send a Mog Check. Prove it.' },
              { icon: '✨', title: 'Aura System', desc: 'Gain or lose Aura based on your academic weapon energy' },
            ].map(f => (
              <div key={f.title} className="glass rounded-2xl p-5 fade-in">
                <div className="text-3xl mb-2">{f.icon}</div>
                <div className="font-semibold text-sm text-white mb-1">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'create' && (
        <CreateRoom onBack={() => setView('home')} />
      )}

      {view === 'join' && (
        <JoinRoom onBack={() => setView('home')} />
      )}
    </div>
  );
}
