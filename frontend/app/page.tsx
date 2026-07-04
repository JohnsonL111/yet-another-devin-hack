'use client';

import { useState } from 'react';
import CreateRoom from '@/components/CreateRoom';
import JoinRoom from '@/components/JoinRoom';

export default function Home() {
  const [view, setView] = useState<'home' | 'create' | 'join'>('home');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* bg blobs */}
      <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

      {view === 'home' && (
        <div className="fade-in text-center max-w-xl w-full">
          <div className="text-7xl mb-5 select-none">😤</div>

          <h1 className="text-6xl font-bold tracking-tight mb-3 leading-none"
            style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Study Mog
          </h1>

          <p className="text-gray-300 text-xl font-medium mb-2">
            your friends said they&apos;d grind. they&apos;re lying.
          </p>
          <p className="text-gray-600 text-sm mb-10">
            shared pomodoro timer · webcam mog checks · aura points for the drip
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="btn btn-primary text-base px-8 py-3.5 text-black font-bold" onClick={() => setView('create')}>
              🏠 Create Room
            </button>
            <button className="btn btn-ghost text-base px-8 py-3.5" onClick={() => setView('join')}>
              🔗 Join Room
            </button>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-4 text-center">
            {[
              {
                icon: '⏱️',
                title: 'Shared Timer',
                desc: 'One Pomodoro clock for everyone. No excuses about "losing track of time".',
              },
              {
                icon: '🚨',
                title: 'Mog Checks',
                desc: 'Think someone\'s on TikTok? Send a check. They have 60s to prove otherwise.',
              },
              {
                icon: '✨',
                title: 'Aura Points',
                desc: 'Stay locked in, pass checks, gain Aura. Fail a check, lose it. Simple.',
              },
            ].map(f => (
              <div key={f.title} className="glass rounded-2xl p-5 fade-in hover:border-white/20 transition-colors">
                <div className="text-3xl mb-2">{f.icon}</div>
                <div className="font-bold text-sm text-white mb-1.5">{f.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'create' && <CreateRoom onBack={() => setView('home')} />}
      {view === 'join' && <JoinRoom onBack={() => setView('home')} />}
    </div>
  );
}
