'use client';

import { useState } from 'react';
import { RoomState, MemberData } from '@/lib/types';
import { auraColor } from '@/lib/utils';

interface Props {
  roomState: RoomState;
  myId: string;
  isHost: boolean;
  canControl: boolean;
  onStartFocus: () => void;
  onOpenSettings: () => void;
}

export default function LobbyView({ roomState, myId, isHost, canControl, onStartFocus, onOpenSettings }: Props) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(roomState.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const focusMin = Math.round(roomState.settings.focusDuration / 60000);
  const breakMin = Math.round(roomState.settings.breakDuration / 60000);
  const count = roomState.members.length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">

        {/* Room code card */}
        <div className="glass rounded-3xl p-8 mb-5 text-center glow-yellow fade-in">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-500/70 mb-4">
            room code
          </p>

          <button
            onClick={copyCode}
            className="font-mono text-5xl font-bold tracking-[0.25em] text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer bg-yellow-500/8 rounded-2xl px-8 py-5 border border-yellow-500/20 hover:border-yellow-500/40 active:scale-95 w-full block"
          >
            {roomState.code}
          </button>

          <p className="text-gray-600 text-xs mt-3">
            {copied ? '✅ copied!' : 'tap to copy · send it to your friends'}
          </p>

          <div className="flex justify-center gap-5 mt-5 text-xs text-gray-500">
            <span>⏱ {focusMin}min focus</span>
            <span>·</span>
            <span>☕ {breakMin}min break</span>
            <span>·</span>
            <span>🚨 {roomState.settings.checksPerSession} checks</span>
          </div>
        </div>

        {/* Squad list */}
        <div className="glass rounded-3xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">
              who&apos;s here
              <span className="ml-2 text-yellow-400 font-black">{count}</span>
            </h3>
            {count === 1 && (
              <span className="text-xs text-gray-600 italic">just you so far...</span>
            )}
          </div>

          <div className="space-y-2">
            {roomState.members.map(m => (
              <LobbyMemberRow key={m.id} member={m} isSelf={m.id === myId} />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center flex-wrap">
          {canControl && (
            <button className="btn btn-primary px-8 py-3 text-sm font-bold" onClick={onStartFocus}>
              ▶ Start Session
            </button>
          )}
          {isHost && (
            <button className="btn btn-ghost px-5 py-3 text-sm" onClick={onOpenSettings}>
              ⚙️ Settings
            </button>
          )}
          {!canControl && (
            <div className="text-gray-500 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
              waiting for the host to start...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function LobbyMemberRow({ member, isSelf }: { member: MemberData; isSelf: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
      isSelf
        ? 'bg-yellow-500/8 border border-yellow-500/20'
        : 'bg-white/3 border border-white/5'
    }`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
        isSelf ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/8 text-gray-300'
      }`}>
        {member.username[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{member.username}</span>
          {member.isHost && (
            <span className="text-xs bg-yellow-500/15 text-yellow-300 px-1.5 py-0.5 rounded-md font-bold">👑 host</span>
          )}
          {isSelf && (
            <span className="text-xs bg-white/8 text-gray-400 px-1.5 py-0.5 rounded-md">you</span>
          )}
        </div>
        {member.aura !== 0 && (
          <div className={`text-xs mt-0.5 ${auraColor(member.aura)}`}>
            {member.aura > 0 ? '+' : ''}{member.aura} aura
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-xs text-gray-600">ready</span>
      </div>
    </div>
  );
}
