export type RoomMode = 'waiting' | 'focus' | 'break' | 'finished';
export type MemberStatus = 'locked-in' | 'mog-pending' | 'mog-certified' | 'mog-failed' | 'on-break';
export type TimerControlPermission = 'host-only' | 'all';

export interface AuraEvent {
  delta: number;
  reason: 'session-complete' | 'mog-check-passed' | 'mog-check-failed' | 'mog-check-sent-success';
  timestamp: number;
}

export interface RoomSettings {
  focusDuration: number;
  breakDuration: number;
  checksPerSession: number;
  cooldownMs: number;
  timerControlPermission: TimerControlPermission;
}

export interface Timer {
  endsAt: number | null;
  remainingMs: number;
}

export interface MemberData {
  id: string;
  username: string;
  isHost: boolean;
  aura: number;
  status: MemberStatus;
  checksRemaining: number;
  lastCheckSentAt: number | null;
  passedChecks: number;
  failedChecks: number;
  sentSuccessfully: number;
  joinedAt: number;
  latestPhotoBase64: string | null;
  sessionAura: number;
  sessionPassedChecks: number;
  sessionFailedChecks: number;
  sessionSentSuccessfully: number;
  auraLog: AuraEvent[];
}

export interface ActiveCheck {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  status: 'pending' | 'passed' | 'failed';
  createdAt: number;
  expiresAt: number;
}

export interface RoomPhoto {
  memberId: string;
  username: string;
  fromUsername: string;
  photoBase64: string;
  timestamp: number;
}

export interface RoomState {
  code: string;
  hostId: string;
  settings: RoomSettings;
  mode: RoomMode;
  timer: Timer;
  members: MemberData[];
  activeChecks: ActiveCheck[];
  photos: RoomPhoto[];
  sessionNumber: number;
}

export interface RecapData {
  members: {
    id: string;
    username: string;
    sessionAura: number;
    sessionPassedChecks: number;
    sessionFailedChecks: number;
    sessionSentSuccessfully: number;
    totalAura: number;
    auraLog: AuraEvent[];
  }[];
  mvp: { id: string; username: string; sessionAura: number } | null;
  focusDurationMs: number;
  photos: RoomPhoto[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}
