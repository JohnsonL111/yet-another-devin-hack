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
    member.status === 'mog-pending'   ? 'border-yellow-500/50 glow-yellow' :
    member.status === 'mog-certified' ? 'border-green-500/50 glow-green'   :
    member.status === 'mog-failed'    ? 'border-red-500/50 glow-red'       :
    isSelf                            ? 'border-yellow-500/25'             :
    'border-white/8';

  return (
    <div className={`glass rounded-2xl p-5 border transition-all duration-300 ${statusBorder}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar / photo */}
          {member.latestPhotoBase64 ? (
            <button
              onClick={() => onViewPhoto?.(member.latestPhotoBase64!, member.username)}
              className="w-10 h-10 rounded-full border-2 border-green-500/40 flex-shrink-0 overflow-hidden hover:border-green-400 hover:scale-105 transition-all"
              title="View their photo"
            >
              <img src={member.latestPhotoBase64} alt="mog" className="w-full h-full object-cover" />
            </button>
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${
              isSelf ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/8 text-gray-300'
            }`}>
              {member.username[0]?.toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="font-bold text-sm flex items-center gap-1.5 flex-wrap leading-tight">
              {member.username}
              {member.isHost && <span className="text-xs bg-yellow-500/15 text-yellow-300 px-1.5 py-0.5 rounded-md font-bold">👑</span>}
              {isSelf && <span className="text-xs bg-white/8 text-gray-400 px-1.5 py-0.5 rounded-md">you</span>}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {statusEmoji(member.status)} {statusLabel(member.status)}
            </div>
          </div>
        </div>

        {/* Aura — clickable */}
        <button
          onClick={() => setShowLog(v => !v)}
          className="text-right flex-shrink-0 hover:opacity-75 transition-opacity group"
          title="Aura history"
        >
          <div className={`font-black text-xl leading-none ${auraColor(member.aura)}`}>
            {member.aura > 0 ? '+' : ''}{member.aura}
          </div>
          <div className="text-[10px] text-gray-600 mt-0.5 group-hover:text-gray-400 transition-colors">
            aura {showLog ? '▲' : '▼'}
          </div>
        </button>
      </div>

      {/* Aura log */}
      {showLog && (
        <div className="mb-3 bg-black/20 rounded-xl p-3 fade-in border border-white/5">
          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">Aura log</div>
          <AuraLog log={member.auraLog} />
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
        <span>✅ {member.passedChecks}</span>
        <span>💀 {member.failedChecks}</span>
        <span>📤 {member.sentSuccessfully}</span>
      </div>

      {/* Mog check button */}
      {!isSelf && roomMode === 'focus' && (
        <div>
          {myCooldownRemaining > 0 ? (
            <div className="text-xs text-orange-500/60 text-center py-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
              cooldown: {Math.ceil(myCooldownRemaining / 1000)}s
            </div>
          ) : (
            <button
              className="btn btn-mog w-full justify-center"
              disabled={!canMog}
              onClick={() => canMog && onMogCheck(member.id)}
              title={
                myChecksRemaining === 0 ? 'out of checks' :
                alreadyPending        ? 'already sent one' :
                member.status === 'mog-pending' ? 'already being checked' :
                'send a mog check'
              }
            >
              🚨 mog check
              <span className="opacity-60 text-[10px]">({myChecksRemaining} left)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
