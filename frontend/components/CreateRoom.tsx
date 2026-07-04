'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';

interface Props { onBack: () => void; }

export default function CreateRoom({ onBack }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [checksPerSession, setChecksPerSession] = useState(2);
  const [cooldownMin, setCooldownMin] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleCreate() {
    if (!username.trim()) { setError('Enter your display name first!'); return; }
    setLoading(true);
    setError('');

    const socket = getSocket();
    socket.connect();

    socket.once('room-created', ({ code, memberId }: { code: string; memberId: string }) => {
      sessionStorage.setItem('studymog_memberId', memberId);
      sessionStorage.setItem('studymog_username', username.trim());
      router.push(`/room/${code}`);
    });

    socket.emit('create-room', {
      username: username.trim(),
      focusDuration: focusMin * 60 * 1000,
      breakDuration: breakMin * 60 * 1000,
      checksPerSession,
      cooldownMs: cooldownMin * 60 * 1000,
    });
  }

  return (
    <div className="fade-in glass rounded-3xl p-8 w-full max-w-md">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-300 text-sm mb-6 flex items-center gap-1 transition-colors">
        ← Back
      </button>
      <h2 className="text-2xl font-bold mb-6">🏠 Create Study Room</h2>

      {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 rounded-lg p-3">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Display Name</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Academic Weapon 🧑‍💻"
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Focus (min)</label>
            <input type="number" min={1} max={120} value={focusMin} onChange={e => setFocusMin(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Break (min)</label>
            <input type="number" min={1} max={60} value={breakMin} onChange={e => setBreakMin(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Mog Checks / Session</label>
            <input type="number" min={0} max={10} value={checksPerSession} onChange={e => setChecksPerSession(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Cooldown (min)</label>
            <input type="number" min={0} max={30} value={cooldownMin} onChange={e => setCooldownMin(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary w-full mt-6 py-3 text-base justify-center"
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? '⏳ Creating...' : '🚀 Create Room'}
      </button>
    </div>
  );
}
