'use client';

import { useState } from 'react';
import { MemberData, RoomMode } from '@/lib/types';
import { statusEmoji, statusLabel, auraColor } from '@/lib/utils';
import AuraLog from './AuraLog';

interface Props {
  member: MemberData;
  isSelf: boolean;
  roomMode: RoomMode;
  myChecksRemaining: number;
  myCooldownRemaining: number;
  alreadyPending: boolean;
  onMogCheck: (toId: string) => void;
  onViewPhoto?: (photoBase64: string, username: string) => void;
}

export default function ParticipantCard({
  member, isSelf, roomMode, myChecksRemaining, myCooldownRemaining, alreadyPending, onMogCheck, onViewPhoto,
}: Props) {
  const [showLog, setShowLog] = useState(false);

  const canMog = roomMode === 'focus'
    && !isSelf
    && myChecksRemaining > 0
    && myCooldownRemaining <= 0
    && !alreadyPending
    && member.status !== 'mog-pending';

  const statusBorder =
    member.status === 'mog-pending' ? 'border-yellow-500/60 glow-yellow' :
    member.status === 'mog-certified' ? 'border-green-500/60 glow-green' :
    member.status === 'mog-failed' ? 'border-red-500/60 glow-red' :
    'border-white/8';

  return (
    <div className={`glass rounded-2xl p-5 border transition-all duration-300 ${statusBorder} ${isSelf ? 'ring-2 ring-purple-500/40' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar / photo */}
          {member.latestPhotoBase64 ? (
            <button
              onClick={() => onViewPhoto?.(member.latestPhotoBase64!, member.username)}
              className="w-10 h-10 rounded-full border-2 border-green-500/40 flex-shrink-0 overflow-hidden hover:border-green-400/70 hover:scale-105 transition-all cursor-pointer"
              title="View photo"
            >
              <img src={member.latestPhotoBase64} alt="selfie" className="w-full h-full object-cover" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-lg flex-shrink-0">
              {member.username[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-sm truncate flex items-center gap-1 flex-wrap">
              {member.username}
              {member.isHost && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full">host</span>}
              {isSelf && <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">you</span>}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {statusEmoji(member.status)} {statusLabel(member.status)}
            </div>
          </div>
        </div>

        {/* Aura score — clickable to expand log */}
        <button
          onClick={() => setShowLog(v => !v)}
          className="text-right flex-shrink-0 hover:opacity-80 transition-opacity"
          title="View aura history"
        >
          <div className={`font-black text-lg ${auraColor(member.aura)}`}>{member.aura > 0 ? '+' : ''}{member.aura}</div>
          <div className="text-xs text-gray-600">Aura {showLog ? '▲' : '▼'}</div>
        </button>
      </div>

      {/* Aura log (expandable) */}
      {showLog && (
        <div className="mb-3 bg-black/20 rounded-xl p-3 fade-in">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Aura History</div>
          <AuraLog log={member.auraLog} />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>✅ {member.passedChecks} passed</span>
        <span>❌ {member.failedChecks} failed</span>
        <span>📤 {member.sentSuccessfully} sent</span>
      </div>

      {!isSelf && roomMode === 'focus' && (
        <div className="mt-2">
          {myCooldownRemaining > 0 ? (
            <div className="text-xs text-yellow-500/70 text-center py-1.5 bg-yellow-500/5 rounded-lg">
              ⏳ Cooldown: {Math.ceil(myCooldownRemaining / 1000)}s
            </div>
          ) : (
            <button
              className="btn btn-mog w-full justify-center"
              disabled={!canMog}
              onClick={() => canMog && onMogCheck(member.id)}
              title={
                myChecksRemaining === 0 ? 'No checks remaining' :
                alreadyPending ? 'Already sent a check' :
                member.status === 'mog-pending' ? 'Already being checked' :
                'Send a Mog Check'
              }
            >
              🚨 Mog Check {myChecksRemaining > 0 ? `(${myChecksRemaining} left)` : '(0 left)'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
