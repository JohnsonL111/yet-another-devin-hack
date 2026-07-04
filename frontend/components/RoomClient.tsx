'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { RoomState, RecapData, Toast, RoomSettings } from '@/lib/types';
import { formatMs } from '@/lib/utils';
import ParticipantCard from './ParticipantCard';
import MogCheckModal from './MogCheckModal';
import RecapScreen from './RecapScreen';
import ToastContainer from './ToastContainer';
import LobbyView from './LobbyView';
import SettingsModal from './SettingsModal';
import PhotoGallery from './PhotoGallery';
import confetti from 'canvas-confetti';

interface PendingCheck {
  checkId: string;
  fromUsername: string;
  expiresAt: number;
}

interface Props { code: string; }

export default function RoomClient({ code }: Props) {
  const router = useRouter();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myId, setMyId] = useState('');
  const [pendingCheck, setPendingCheck] = useState<PendingCheck | null>(null);
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [displayTime, setDisplayTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<{ src: string; name: string } | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const roomStateRef = useRef<RoomState | null>(null);

  function addToast(message: string, type: Toast['type'] = 'info') {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }

  function playBeep(freq = 440, duration = 0.15) {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(); osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  function playAlarm() {
    playBeep(880, 0.1);
    setTimeout(() => playBeep(660, 0.1), 150);
    setTimeout(() => playBeep(880, 0.2), 300);
  }

  const startTimerInterval = useCallback((state: RoomState) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (state.timer.endsAt) {
      timerIntervalRef.current = setInterval(() => {
        setDisplayTime(Math.max(0, state.timer.endsAt! - Date.now()));
      }, 100);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setDisplayTime(state.timer.remainingMs);
    }
  }, []);

  useEffect(() => {
    const memberId = sessionStorage.getItem('studymog_memberId');
    if (!memberId) { router.push('/'); return; }
    setMyId(memberId);

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.on('room-state', (state: RoomState) => {
      roomStateRef.current = state;
      setRoomState(state);
      startTimerInterval(state);
    });

    socket.on('receive-mog-check', (data: { checkId: string; fromUsername: string; expiresAt: number }) => {
      playAlarm();
      setPendingCheck(data);
    });

    socket.on('mog-check-success', (data: { toUsername: string }) => {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#fbbf24', '#10b981', '#a7f3d0'] });
      addToast(`📸 ${data.toUsername} actually was studying. mog certified.`, 'success');
    });

    socket.on('mog-scorecard', (data: { username: string; scorecard: { overall: number; summary: string; mogBonus: number } }) => {
      const { username, scorecard } = data;
      addToast(`✨ ${username} Mog Score: ${scorecard.overall}/10 — ${scorecard.summary}${scorecard.mogBonus > 0 ? ` (+${scorecard.mogBonus} bonus aura!)` : ''}`, 'info');
    });

    socket.on('mog-check-failure', (data: { toUsername: string; reason: string }) => {
      const reasons: Record<string, string> = {
        timeout:         'took too long. caught.',
        cancel:          'folded instantly 💀',
        disconnect:      'ran from the check 🏃',
        'session-ended': 'session ended mid-check',
      };
      addToast(`💀 ${data.toUsername} — ${reasons[data.reason] ?? 'failed'}. negative aura incoming.`, 'error');
    });

    socket.on('mog-check-rejected', (data: { reason: string; remainingMs?: number }) => {
      const msgs: Record<string, string> = {
        'already-pending': 'Target already has a pending check!',
        'cooldown-active': `Cooldown active! Wait ${data.remainingMs ? Math.ceil(data.remainingMs / 1000) + 's' : 'a bit'}.`,
        'no-checks-remaining': 'No Mog Checks remaining this session!',
        'not-in-focus': 'Can only Mog Check during focus sessions!',
        'cant-mog-yourself': "Can't Mog yourself — we all know you're slacking.",
      };
      addToast(`⚠️ ${msgs[data.reason] ?? data.reason}`, 'warning');
    });

    socket.on('host-migrated', (data: { newHostUsername: string }) => {
      addToast(`👑 ${data.newHostUsername} is now the host.`, 'info');
    });

    socket.on('session-ended', (recapData: RecapData) => {
      setRecap(recapData);
      setPendingCheck(null);
    });

    socket.on('room-ended', () => {
      addToast('🚪 The host ended the room. See ya!', 'info');
      sessionStorage.removeItem('studymog_memberId');
      sessionStorage.removeItem('studymog_username');
      disconnectSocket();
      setTimeout(() => router.push('/'), 1500);
    });

    socket.on('disconnect', () => {
      addToast('🔌 Disconnected. Trying to reconnect...', 'error');
    });

    // Re-request state in case the initial broadcast fired before this component mounted
    socket.emit('request-state');

    return () => {
      socket.off('room-state');
      socket.off('receive-mog-check');
      socket.off('mog-check-success');
      socket.off('mog-scorecard');
      socket.off('mog-check-failure');
      socket.off('mog-check-rejected');
      socket.off('host-migrated');
      socket.off('session-ended');
      socket.off('room-ended');
      socket.off('disconnect');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [router, startTimerInterval]);

  function handleLeaveRoom() {
    if (!confirm('Leave this room?')) return;
    getSocket().emit('leave-room');
    sessionStorage.removeItem('studymog_memberId');
    sessionStorage.removeItem('studymog_username');
    disconnectSocket();
    router.push('/');
  }

  function handleEndRoom() {
    if (!confirm('End the room for everyone? This cannot be undone.')) return;
    getSocket().emit('end-room');
    sessionStorage.removeItem('studymog_memberId');
    sessionStorage.removeItem('studymog_username');
    disconnectSocket();
    router.push('/');
  }

  function handleMogCheck(toId: string) {
    getSocket().emit('send-mog-check', { toMemberId: toId });
    addToast('🚨 mog check sent. they have 60 seconds.', 'warning');
  }

  function handleSubmitPhoto(checkId: string, photoBase64: string) {
    getSocket().emit('submit-mog-photo', { checkId, photoBase64 });
    setPendingCheck(null);
  }

  function handleFailCheck(checkId: string) {
    getSocket().emit('cancel-mog-check', { checkId });
    setPendingCheck(null);
  }

  function handleStartFocus() { setRecap(null); getSocket().emit('start-focus'); }
  function handleStartBreak() { setRecap(null); getSocket().emit('start-break'); }
  function handleBackToLobby() { setRecap(null); getSocket().emit('back-to-lobby'); }
  function handlePause() { getSocket().emit('pause-timer'); }
  function handleResume() { getSocket().emit('resume-timer'); }
  function handleReset() { getSocket().emit('reset-timer'); }

  function handleSaveSettings(updated: Partial<RoomSettings>) {
    getSocket().emit('update-settings', updated);
    addToast('⚙️ Settings updated!', 'success');
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">⏳ Connecting to room {code}...</div>
      </div>
    );
  }

  const me = roomState.members.find(m => m.id === myId);
  const isHost = me?.isHost ?? false;
  const canControl = isHost || roomState.settings.timerControlPermission === 'all';
  const isPaused = !roomState.timer.endsAt && roomState.mode !== 'waiting' && roomState.mode !== 'finished';

  const mySentAt = me?.lastCheckSentAt ?? null;
  const cooldownMs = roomState.settings.cooldownMs;
  const myCooldownRemaining = mySentAt ? Math.max(0, cooldownMs - (Date.now() - mySentAt)) : 0;
  const iHaveActiveSentCheck = roomState.activeChecks.some(c => c.fromMemberId === myId && c.status === 'pending');

  const timerColor = roomState.mode === 'focus' ? 'timer-glow' : roomState.mode === 'break' ? 'timer-glow-green' : 'text-gray-600';
  const modeLabel = roomState.mode === 'focus' ? '🎯 FOCUS' : roomState.mode === 'break' ? '☕ BREAK' : roomState.mode === 'finished' ? '✅ DONE' : '🏠 LOBBY';
  const modeBg = roomState.mode === 'focus' ? 'glow-purple' : roomState.mode === 'break' ? 'glow-green' : '';

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer toasts={toasts} />

      {pendingCheck && (
        <MogCheckModal
          checkId={pendingCheck.checkId}
          fromUsername={pendingCheck.fromUsername}
          expiresAt={pendingCheck.expiresAt}
          onSubmit={handleSubmitPhoto}
          onFail={handleFailCheck}
        />
      )}

      {recap && (
        <RecapScreen
          recap={recap}
          myId={myId}
          isHost={isHost}
          onStartBreak={handleStartBreak}
          onNewSession={handleStartFocus}
          onBackToLobby={handleBackToLobby}
        />
      )}

      {showSettings && isHost && (
        <SettingsModal
          settings={roomState.settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          isRunning={roomState.mode === 'focus' || roomState.mode === 'break'}
        />
      )}

      {showPhotos && (
        <PhotoGallery photos={roomState.photos} onClose={() => setShowPhotos(false)} />
      )}

      {/* Inline photo viewer */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90" onClick={() => setViewingPhoto(null)}>
          <div className="max-w-lg w-full mx-4 fade-in" onClick={e => e.stopPropagation()}>
            <img src={viewingPhoto.src} alt={viewingPhoto.name} className="w-full rounded-2xl border border-green-500/30" />
            <div className="text-center mt-3">
              <p className="font-bold">{viewingPhoto.name} — 📸 Mog Certified</p>
            </div>
            <div className="flex justify-center mt-4">
              <button className="btn btn-ghost" onClick={() => setViewingPhoto(null)}>✕ Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass border-b border-white/8 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">😤</span>
          <span className="font-bold hidden sm:block tracking-tight">study mog</span>
        </div>

        <button
          onClick={copyCode}
          className="glass px-3 py-1.5 rounded-xl font-mono font-bold tracking-widest text-purple-300 hover:bg-white/10 transition-all text-sm border border-purple-500/20"
        >
          {copied ? '✅' : `🔑 ${code}`}
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-lg font-bold text-xs tracking-wider ${
            roomState.mode === 'focus' ? 'bg-purple-500/20 text-purple-300' :
            roomState.mode === 'break' ? 'bg-green-500/20 text-green-300' :
            'bg-white/8 text-gray-400'
          }`}>{modeLabel}</span>
          <span className="text-gray-600 text-xs">👥 {roomState.members.length}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Photos button */}
          {roomState.photos.length > 0 && (
            <button
              onClick={() => setShowPhotos(true)}
              className="btn btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1"
              title="View Mog photos"
            >
              📸 {roomState.photos.length}
            </button>
          )}
          {/* Settings (host only) */}
          {isHost && (
            <button onClick={() => setShowSettings(true)} className="btn btn-ghost text-xs px-2.5 py-1.5" title="Settings">
              ⚙️
            </button>
          )}
          {/* End room (host) / Leave room (non-host) */}
          {isHost ? (
            <button onClick={handleEndRoom} className="btn btn-danger text-xs px-2.5 py-1.5" title="End room for everyone">
              🚪 End
            </button>
          ) : (
            <button onClick={handleLeaveRoom} className="btn btn-ghost text-xs px-2.5 py-1.5" title="Leave room">
              🚪 Leave
            </button>
          )}
        </div>
      </div>

      {/* Lobby view */}
      {roomState.mode === 'waiting' && (
        <LobbyView
          roomState={roomState}
          myId={myId}
          isHost={isHost}
          canControl={canControl}
          onStartFocus={handleStartFocus}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Active session view (focus / break / finished) */}
      {roomState.mode !== 'waiting' && (
        <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-6xl mx-auto w-full">
          {/* Timer */}
          <div className={`glass rounded-3xl p-8 mb-8 text-center w-full max-w-sm ${modeBg} transition-all duration-500`}>
            <div className={`text-7xl font-black font-mono ${timerColor} ${roomState.mode === 'focus' ? 'pulse-scale' : ''}`}>
              {formatMs(displayTime)}
            </div>
            <div className="text-gray-500 text-sm mt-2">{modeLabel}</div>
            {isPaused && <div className="text-yellow-400 text-xs mt-1 font-bold tracking-wider">⏸ PAUSED</div>}

            {canControl && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {roomState.mode === 'focus' && (
                  <>
                    {isPaused
                      ? <button className="btn btn-success" onClick={handleResume}>▶ Resume</button>
                      : <button className="btn btn-ghost" onClick={handlePause}>⏸ Pause</button>
                    }
                    <button className="btn btn-ghost" onClick={handleReset}>↩ Reset</button>
                  </>
                )}
                {roomState.mode === 'break' && (
                  <>
                    {isPaused
                      ? <button className="btn btn-success" onClick={handleResume}>▶ Resume</button>
                      : <button className="btn btn-ghost" onClick={handlePause}>⏸ Pause</button>
                    }
                    <button className="btn btn-primary" onClick={handleStartFocus}>⏭ Skip Break</button>
                  </>
                )}
                {roomState.mode === 'finished' && (
                  <>
                    <button className="btn btn-ghost" onClick={handleBackToLobby}>🏠 Lobby</button>
                    <button className="btn btn-success" onClick={handleStartBreak}>☕ Break</button>
                    <button className="btn btn-primary" onClick={handleStartFocus}>🔁 New Session</button>
                  </>
                )}
              </div>
            )}
            {!canControl && roomState.mode === 'finished' && (
              <p className="text-gray-500 text-xs mt-3">Waiting for host...</p>
            )}
          </div>

          {/* Participants */}
          <div className="w-full">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">
              the squad · {roomState.members.length}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomState.members.map(member => (
                <ParticipantCard
                  key={member.id}
                  member={member}
                  isSelf={member.id === myId}
                  roomMode={roomState.mode}
                  myChecksRemaining={me?.checksRemaining ?? 0}
                  myCooldownRemaining={myCooldownRemaining}
                  alreadyPending={iHaveActiveSentCheck}
                  onMogCheck={handleMogCheck}
                  onViewPhoto={(src, name) => setViewingPhoto({ src, name })}
                />
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          {roomState.members.length >= 1 && (
            <div className="w-full mt-6 glass rounded-2xl p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">aura standings</div>
              <div className="flex flex-wrap gap-2">
                {[...roomState.members]
                  .sort((a, b) => b.aura - a.aura)
                  .map((m, i) => (
                    <div key={m.id} className={`flex items-center gap-2 glass rounded-xl px-3 py-2 text-sm ${m.id === myId ? 'border border-yellow-500/25' : 'border border-white/5'}`}>
                      <span className="text-gray-600 text-xs">{i === 0 ? '👑' : `#${i + 1}`}</span>
                      <span className="font-semibold truncate max-w-[80px] text-sm">{m.username}</span>
                      <span className={`font-black text-sm ${m.aura >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>{m.aura >= 0 ? '+' : ''}{m.aura}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
