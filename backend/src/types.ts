export type RoomMode = 'waiting' | 'focus' | 'break' | 'finished';
export type MemberStatus = 'locked-in' | 'mog-pending' | 'mog-certified' | 'mog-failed' | 'on-break';
export type CheckStatus = 'pending' | 'passed' | 'failed';

export interface RoomSettings {
  focusDuration: number;   // ms
  breakDuration: number;   // ms
  checksPerSession: number;
  cooldownMs: number;
}

export interface Timer {
  endsAt: number | null;
  remainingMs: number;
}

export interface Member {
  id: string;
  socketId: string;
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
}

export interface MogCheck {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  status: CheckStatus;
  createdAt: number;
  expiresAt: number;
  photoBase64: string | null;
  timeout: ReturnType<typeof setTimeout> | null;
}

export interface Room {
  code: string;
  hostId: string;
  settings: RoomSettings;
  mode: RoomMode;
  timer: Timer;
  members: Map<string, Member>;
  activeChecks: Map<string, MogCheck>;
  emptyRoomTimeout: ReturnType<typeof setTimeout> | null;
  serverTimerTimeout: ReturnType<typeof setTimeout> | null;
  sessionNumber: number;
}
