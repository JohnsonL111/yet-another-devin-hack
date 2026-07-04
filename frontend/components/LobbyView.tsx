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

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Room code share card */}
        <div className="glass rounded-3xl p-8 mb-6 text-center glow-purple fade-in">
          <div className="text-4xl mb-2">🏠</div>
          <h2 className="text-xl font-bold text-gray-300 mb-4">Waiting for the session to start...</h2>
          <p className="text-gray-500 text-sm mb-5">Share this code with your friends to join</p>

          <button
            onClick={copyCode}
            className="font-mono text-5xl font-black tracking-[0.2em] text-purple-300 hover:text-purple-200 transition-colors cursor-pointer bg-purple-500/10 rounded-2xl px-8 py-4 border border-purple-500/20 hover:border-purple-500/40 active:scale-95 w-full"
          >
            {roomState.code}
          </button>
          <p className="text-gray-600 text-xs mt-3">
            {copied ? '✅ Copied to clipboard!' : 'Click to copy room code'}
          </p>

          <div className="flex justify-center gap-6 mt-5 text-sm text-gray-500">
            <span>⏱️ {focusMin}min focus</span>
            <span>☕ {breakMin}min break</span>
            <span>🚨 {roomState.settings.checksPerSession} checks/session</span>
          </div>
        </div>

        {/* Participants */}
        <div className="glass rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-300 flex items-center gap-2">
              👥 Study Squad
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                {roomState.members.length} {roomState.members.length === 1 ? 'person' : 'people'}
              </span>
            </h3>
          </div>
          <div className="space-y-3">
            {roomState.members.map(m => (
              <LobbyMemberRow key={m.id} member={m} isSelf={m.id === myId} />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {canControl && (
            <button className="btn btn-primary px-8 py-3 text-base" onClick={onStartFocus}>
              ▶ Start Focus Session
            </button>
          )}
          {isHost && (
            <button className="btn btn-ghost px-5 py-3" onClick={onOpenSettings}>
              ⚙️ Settings
            </button>
          )}
          {!canControl && (
            <div className="text-gray-500 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              Waiting for host to start the session...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LobbyMemberRow({ member, isSelf }: { member: MemberData; isSelf: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isSelf ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-white/3'}`}>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
        {member.username[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{member.username}</span>
          {member.isHost && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full flex-shrink-0">👑 host</span>
          )}
          {isSelf && (
            <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full flex-shrink-0">you</span>
          )}
        </div>
        {member.aura !== 0 && (
          <div className={`text-xs ${auraColor(member.aura)}`}>
            {member.aura > 0 ? '+' : ''}{member.aura} Aura
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-gray-500">Ready</span>
      </div>
    </div>
  );
}
