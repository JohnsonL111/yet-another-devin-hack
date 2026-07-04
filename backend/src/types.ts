export type RoomMode = 'waiting' | 'focus' | 'break' | 'finished';
export type MemberStatus = 'locked-in' | 'mog-pending' | 'mog-certified' | 'mog-failed' | 'on-break';
export type CheckStatus = 'pending' | 'passed' | 'failed';
export type TimerControlPermission = 'host-only' | 'all';

export interface AuraEvent {
  delta: number;
  reason: 'session-complete' | 'mog-check-passed' | 'mog-check-failed' | 'mog-check-sent-success' | 'mog-quality-bonus';
  timestamp: number;
}

export interface MogScorecard {
  jawline: number;
  hair: number;
  symmetry: number;
  expression: number;
  posture: number;
  lighting: number;
  aura: number;
  confidence: number;
  focus: number;
  overall: number;
  summary: string;
  mogBonus: number;
}

export interface RoomSettings {
  focusDuration: number;   // ms
  breakDuration: number;   // ms
  checksPerSession: number;
  cooldownMs: number;
  timerControlPermission: TimerControlPermission;
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
  auraLog: AuraEvent[];
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

export interface RoomPhoto {
  memberId: string;
  username: string;
  fromUsername: string;
  photoBase64: string;
  timestamp: number;
  scorecard?: MogScorecard;
}

export interface Room {
  code: string;
  hostId: string;
  settings: RoomSettings;
  mode: RoomMode;
  timer: Timer;
  members: Map<string, Member>;
  activeChecks: Map<string, MogCheck>;
  photos: RoomPhoto[];
  emptyRoomTimeout: ReturnType<typeof setTimeout> | null;
  serverTimerTimeout: ReturnType<typeof setTimeout> | null;
  sessionNumber: number;
}
