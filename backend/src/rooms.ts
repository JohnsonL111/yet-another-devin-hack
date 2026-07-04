import { Room } from './types';

export const rooms = new Map<string, Room>();

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

export function serializeRoom(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    settings: room.settings,
    mode: room.mode,
    timer: room.timer,
    members: Array.from(room.members.values()).map(m => ({
      id: m.id,
      username: m.username,
      isHost: m.isHost,
      aura: m.aura,
      status: m.status,
      checksRemaining: m.checksRemaining,
      lastCheckSentAt: m.lastCheckSentAt,
      passedChecks: m.passedChecks,
      failedChecks: m.failedChecks,
      sentSuccessfully: m.sentSuccessfully,
      joinedAt: m.joinedAt,
      latestPhotoBase64: m.latestPhotoBase64,
      sessionAura: m.sessionAura,
      sessionPassedChecks: m.sessionPassedChecks,
      sessionFailedChecks: m.sessionFailedChecks,
      sessionSentSuccessfully: m.sessionSentSuccessfully,
      auraLog: m.auraLog,
    })),
    activeChecks: Array.from(room.activeChecks.values()).map(c => ({
      id: c.id,
      fromMemberId: c.fromMemberId,
      toMemberId: c.toMemberId,
      status: c.status,
      createdAt: c.createdAt,
      expiresAt: c.expiresAt,
    })),
    photos: room.photos,
    sessionNumber: room.sessionNumber,
  };
}
