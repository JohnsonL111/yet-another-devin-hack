'use client';

import { useState } from 'react';
import { RoomSettings } from '@/lib/types';

interface Props {
  settings: RoomSettings;
  onSave: (updated: Partial<RoomSettings>) => void;
  onClose: () => void;
  isRunning: boolean;
}

export default function SettingsModal({ settings, onSave, onClose, isRunning }: Props) {
  const [focusMin, setFocusMin] = useState(Math.round(settings.focusDuration / 60000));
  const [breakMin, setBreakMin] = useState(Math.round(settings.breakDuration / 60000));
  const [checks, setChecks] = useState(settings.checksPerSession);
  const [cooldownMin, setCooldownMin] = useState(Math.round(settings.cooldownMs / 60000));
  const [timerControl, setTimerControl] = useState(settings.timerControlPermission);

  function handleSave() {
    onSave({
      focusDuration: focusMin * 60 * 1000,
      breakDuration: breakMin * 60 * 1000,
      checksPerSession: checks,
      cooldownMs: cooldownMin * 60 * 1000,
      timerControlPermission: timerControl,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl p-7 w-full max-w-md mx-4 fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">⚙️ Room Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl transition-colors">✕</button>
        </div>

        {isRunning && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5 text-xs text-yellow-400">
            ⚠️ Timer duration changes take effect on the next session.
          </div>
        )}

        <div className="space-y-5">
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
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Mog Checks/Session</label>
              <input type="number" min={0} max={10} value={checks} onChange={e => setChecks(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Cooldown (min)</label>
              <input type="number" min={0} max={30} value={cooldownMin} onChange={e => setCooldownMin(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">⏱️ Timer Controls</label>
            <div className="grid grid-cols-2 gap-2">
              {(['host-only', 'all'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setTimerControl(opt)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium border transition-all ${
                    timerControl === opt
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-white/3 border-white/8 text-gray-400 hover:bg-white/8'
                  }`}
                >
                  {opt === 'host-only' ? '👑 Host only' : '👥 Everyone'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1.5">
              {timerControl === 'all' ? 'All members can start, pause, and reset the timer.' : 'Only the host can control the timer.'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button className="btn btn-ghost flex-1 justify-center" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1 justify-center" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
