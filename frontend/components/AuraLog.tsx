'use client';

import { AuraEvent } from '@/lib/types';

const LABELS: Record<AuraEvent['reason'], { icon: string; label: string }> = {
  'session-complete':       { icon: '🎯', label: 'Finished the session' },
  'mog-check-passed':       { icon: '✅', label: 'Survived a Mog Check' },
  'mog-check-failed':       { icon: '❌', label: 'Failed a Mog Check' },
  'mog-check-sent-success': { icon: '📤', label: 'Check you sent passed' },
};

interface Props {
  log: AuraEvent[];
}

export default function AuraLog({ log }: Props) {
  if (log.length === 0) {
    return <p className="text-xs text-gray-600 italic text-center py-2">No aura events yet.</p>;
  }

  return (
    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
      {[...log].reverse().map((evt, i) => {
        const { icon, label } = LABELS[evt.reason] ?? { icon: '✦', label: evt.reason };
        return (
          <div key={i} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <span>{icon}</span>
              <span>{label}</span>
            </span>
            <span className={`font-bold flex-shrink-0 ${evt.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {evt.delta >= 0 ? '+' : ''}{evt.delta}
            </span>
          </div>
        );
      })}
    </div>
  );
}
