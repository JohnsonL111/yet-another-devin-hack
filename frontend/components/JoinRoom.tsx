'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';

interface Props { onBack: () => void; }

export default function JoinRoom({ onBack }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleJoin() {
    if (!username.trim()) { setError('Enter your display name!'); return; }
    if (code.trim().length !== 6) { setError('Room code must be 6 characters.'); return; }
    setLoading(true);
    setError('');

    const socket = getSocket();
    socket.connect();

    socket.once('room-joined', ({ code: roomCode, memberId }: { code: string; memberId: string }) => {
      sessionStorage.setItem('studymog_memberId', memberId);
      sessionStorage.setItem('studymog_username', username.trim());
      router.push(`/room/${roomCode}`);
    });

    socket.once('join-error', ({ message }: { message: string }) => {
      setError(message);
      setLoading(false);
    });

    socket.emit('join-room', { code: code.trim().toUpperCase(), username: username.trim() });
  }

  return (
    <div className="fade-in glass rounded-3xl p-8 w-full max-w-md">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-300 text-sm mb-6 flex items-center gap-1 transition-colors">
        ← Back
      </button>
      <h2 className="text-2xl font-bold mb-6">🔗 Join Study Room</h2>

      {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 rounded-lg p-3">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Display Name</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your name..."
            maxLength={20}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Room Code</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="text-center text-2xl font-mono tracking-[0.3em] uppercase"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>
      </div>

      <button
        className="btn btn-primary w-full mt-6 py-3 text-base justify-center"
        onClick={handleJoin}
        disabled={loading}
      >
        {loading ? '⏳ Joining...' : '🎯 Join Room'}
      </button>
    </div>
  );
}
