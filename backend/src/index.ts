import dotenv from "dotenv";
import path from "path";
const envPath = path.resolve(__dirname, "../../.env");
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.warn(
    `⚠️  Could not load .env from ${envPath}:`,
    envResult.error.message,
  );
} else {
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  console.log(
    `✓ .env loaded — key: ${key ? key.slice(0, 14) + "..." + key.slice(-4) + ` (${key.length} chars)` : "NOT FOUND"}`,
  );
}

import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import { rooms, generateRoomCode, serializeRoom } from "./rooms";
import {
  Room,
  Member,
  MogCheck,
  RoomSettings,
  AuraEvent,
  MogScorecard,
} from "./types";

// Lazy — reads the env var at call time so dotenv timing is never an issue
function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
  maxHttpBufferSize: 5e6,
});

const PORT = 3001;

// ── helpers ───────────────────────────────────────────────────────────────────

function broadcast(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit("room-state", serializeRoom(room));
}

function findMemberBySocket(
  socketId: string,
): { room: Room; member: Member } | null {
  for (const room of rooms.values()) {
    for (const member of room.members.values()) {
      if (member.socketId === socketId) return { room, member };
    }
  }
  return null;
}

function addAura(member: Member, delta: number, reason: AuraEvent["reason"]) {
  member.aura += delta;
  member.sessionAura += delta;
  member.auraLog.push({ delta, reason, timestamp: Date.now() });
}

function canControlTimer(room: Room, member: Member): boolean {
  return member.isHost || room.settings.timerControlPermission === "all";
}

function promoteNewHost(room: Room) {
  const candidates = Array.from(room.members.values()).sort(
    (a, b) => a.joinedAt - b.joinedAt,
  );
  if (candidates.length === 0) return;
  const newHost = candidates[0];
  const oldHost = room.members.get(room.hostId);
  if (oldHost) oldHost.isHost = false;
  newHost.isHost = true;
  room.hostId = newHost.id;
  io.to(room.code).emit("host-migrated", {
    newHostId: newHost.id,
    newHostUsername: newHost.username,
  });
}

function clearServerTimer(room: Room) {
  if (room.serverTimerTimeout) {
    clearTimeout(room.serverTimerTimeout);
    room.serverTimerTimeout = null;
  }
}

function startServerTimer(
  room: Room,
  durationMs: number,
  onExpire: () => void,
) {
  clearServerTimer(room);
  room.serverTimerTimeout = setTimeout(onExpire, durationMs);
}

function resetMemberSessionStats(member: Member, checksPerSession: number) {
  member.checksRemaining = checksPerSession;
  member.lastCheckSentAt = null;
  member.sessionAura = 0;
  member.sessionPassedChecks = 0;
  member.sessionFailedChecks = 0;
  member.sessionSentSuccessfully = 0;
  member.status = "locked-in";
}

function failCheck(room: Room, check: MogCheck, reason: string) {
  if (check.status !== "pending") return;
  check.status = "failed";
  if (check.timeout) {
    clearTimeout(check.timeout);
    check.timeout = null;
  }

  const target = room.members.get(check.toMemberId);
  if (target) {
    target.status = "mog-failed";
    target.failedChecks++;
    target.sessionFailedChecks++;
    addAura(target, -30, "mog-check-failed");
  }

  room.activeChecks.delete(check.id);

  io.to(room.code).emit("mog-check-failure", {
    checkId: check.id,
    toMemberId: check.toMemberId,
    toUsername: target?.username ?? "???",
    reason,
  });
  broadcast(room.code);
}

function endFocusSession(room: Room) {
  clearServerTimer(room);
  room.mode = "finished";
  room.timer = { endsAt: null, remainingMs: 0 };

  for (const check of Array.from(room.activeChecks.values())) {
    if (check.status === "pending") failCheck(room, check, "session-ended");
  }

  for (const member of room.members.values()) {
    addAura(member, 50, "session-complete");
  }

  const recap = buildRecap(room);
  io.to(room.code).emit("session-ended", recap);
  broadcast(room.code);
}

function buildRecap(room: Room) {
  const members = Array.from(room.members.values());
  const sorted = [...members].sort((a, b) => {
    if (b.sessionAura !== a.sessionAura) return b.sessionAura - a.sessionAura;
    if (b.sessionPassedChecks !== a.sessionPassedChecks)
      return b.sessionPassedChecks - a.sessionPassedChecks;
    if (b.sessionSentSuccessfully !== a.sessionSentSuccessfully)
      return b.sessionSentSuccessfully - a.sessionSentSuccessfully;
    return a.joinedAt - b.joinedAt;
  });
  const mvp = sorted[0] ?? null;
  return {
    members: members.map((m) => ({
      id: m.id,
      username: m.username,
      sessionAura: m.sessionAura,
      sessionPassedChecks: m.sessionPassedChecks,
      sessionFailedChecks: m.sessionFailedChecks,
      sessionSentSuccessfully: m.sessionSentSuccessfully,
      totalAura: m.aura,
      auraLog: m.auraLog,
    })),
    mvp: mvp
      ? { id: mvp.id, username: mvp.username, sessionAura: mvp.sessionAura }
      : null,
    focusDurationMs: room.settings.focusDuration,
    photos: room.photos,
  };
}

function removeMember(room: Room, member: Member) {
  // fail any pending check targeting this member
  for (const check of Array.from(room.activeChecks.values())) {
    if (check.toMemberId === member.id && check.status === "pending") {
      failCheck(room, check, "disconnect");
    }
  }
  const wasHost = member.isHost;
  room.members.delete(member.id);

  if (room.members.size === 0) {
    room.emptyRoomTimeout = setTimeout(() => {
      clearServerTimer(room);
      rooms.delete(room.code);
      console.log(`Room ${room.code} deleted after grace period`);
    }, 60_000);
    return;
  }

  if (wasHost) promoteNewHost(room);
  broadcast(room.code);
}

// ── mog scorecard ─────────────────────────────────────────────────────────────

async function analyzeMogPhoto(
  photoBase64: string,
): Promise<MogScorecard | null> {
  try {
    const [, base64Data] = photoBase64.split(",");
    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `You are a Mog Score judge. Rate this person's photo on 10 criteria. Respond ONLY with valid JSON, no markdown or extra text.

Criteria (1=poor, 10=elite):
- jawline: strong jaw definition
- hair: clean, styled, well-maintained
- symmetry: facial symmetry
- expression: confident, focused expression
- posture: upright, confident posture
- lighting: flattering lighting quality
- aura: overall energy/vibe they project
- confidence: how confident they appear
- focus: do they look like they're actually studying
- overall: holistic mog score (1-10)

Also write a single sentence (summary) explaining the overall score.

JSON format (no other text):
{"jawline":X,"hair":X,"symmetry":X,"expression":X,"posture":X,"lighting":X,"aura":X,"confidence":X,"focus":X,"overall":X,"summary":"..."}`,
            },
          ],
        },
      ],
    });

    const raw =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "";
    const text = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(text);
    const overall = Math.min(10, Math.max(1, Number(parsed.overall)));
    return {
      jawline: Math.min(10, Math.max(1, Number(parsed.jawline))),
      hair: Math.min(10, Math.max(1, Number(parsed.hair))),
      symmetry: Math.min(10, Math.max(1, Number(parsed.symmetry))),
      expression: Math.min(10, Math.max(1, Number(parsed.expression))),
      posture: Math.min(10, Math.max(1, Number(parsed.posture))),
      lighting: Math.min(10, Math.max(1, Number(parsed.lighting))),
      aura: Math.min(10, Math.max(1, Number(parsed.aura))),
      confidence: Math.min(10, Math.max(1, Number(parsed.confidence))),
      focus: Math.min(10, Math.max(1, Number(parsed.focus))),
      overall,
      summary: String(parsed.summary ?? ""),
      mogBonus: Math.round(overall * 2.5),
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`❌ Mog analysis failed: ${err.message}`);
    } else {
      console.error("❌ Mog analysis failed:", err);
    }
    return null;
  }
}

// ── socket handlers ───────────────────────────────────────────────────────────

io.on("connection", (socket: Socket) => {
  console.log("+ socket connected:", socket.id);

  socket.on(
    "create-room",
    (data: {
      username: string;
      focusDuration?: number;
      breakDuration?: number;
      checksPerSession?: number;
      cooldownMs?: number;
      timerControlPermission?: "host-only" | "all";
    }) => {
      const code = generateRoomCode();
      const memberId = uuidv4();

      const settings: RoomSettings = {
        focusDuration: data.focusDuration ?? 25 * 60 * 1000,
        breakDuration: data.breakDuration ?? 5 * 60 * 1000,
        checksPerSession: data.checksPerSession ?? 2,
        cooldownMs: data.cooldownMs ?? 2 * 60 * 1000,
        timerControlPermission: data.timerControlPermission ?? "host-only",
      };

      const member: Member = {
        id: memberId,
        socketId: socket.id,
        username: data.username,
        isHost: true,
        aura: 0,
        status: "locked-in",
        checksRemaining: settings.checksPerSession,
        lastCheckSentAt: null,
        passedChecks: 0,
        failedChecks: 0,
        sentSuccessfully: 0,
        joinedAt: Date.now(),
        latestPhotoBase64: null,
        sessionAura: 0,
        sessionPassedChecks: 0,
        sessionFailedChecks: 0,
        sessionSentSuccessfully: 0,
        auraLog: [],
      };

      const room: Room = {
        code,
        hostId: memberId,
        settings,
        mode: "waiting",
        timer: { endsAt: null, remainingMs: settings.focusDuration },
        members: new Map([[memberId, member]]),
        activeChecks: new Map(),
        photos: [],
        emptyRoomTimeout: null,
        serverTimerTimeout: null,
        sessionNumber: 0,
      };

      rooms.set(code, room);
      socket.join(code);
      socket.emit("room-created", { code, memberId });
      broadcast(code);
    },
  );

  socket.on("join-room", (data: { code: string; username: string }) => {
    const room = rooms.get(data.code.toUpperCase());
    if (!room) {
      socket.emit("join-error", {
        message: "Room not found. Double-check the code!",
      });
      return;
    }

    const memberId = uuidv4();
    const member: Member = {
      id: memberId,
      socketId: socket.id,
      username: data.username,
      isHost: false,
      aura: 0,
      status: room.mode === "break" ? "on-break" : "locked-in",
      checksRemaining: room.settings.checksPerSession,
      lastCheckSentAt: null,
      passedChecks: 0,
      failedChecks: 0,
      sentSuccessfully: 0,
      joinedAt: Date.now(),
      latestPhotoBase64: null,
      sessionAura: 0,
      sessionPassedChecks: 0,
      sessionFailedChecks: 0,
      sessionSentSuccessfully: 0,
      auraLog: [],
    };

    if (room.emptyRoomTimeout) {
      clearTimeout(room.emptyRoomTimeout);
      room.emptyRoomTimeout = null;
    }

    room.members.set(memberId, member);
    socket.join(room.code);
    socket.emit("room-joined", { code: room.code, memberId });
    broadcast(room.code);
  });

  socket.on("leave-room", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    socket.leave(room.code);
    removeMember(room, member);
  });

  socket.on("end-room", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    if (!member.isHost) return;

    clearServerTimer(room);
    for (const check of Array.from(room.activeChecks.values())) {
      if (check.timeout) clearTimeout(check.timeout);
    }

    io.to(room.code).emit("room-ended", { reason: "host-ended" });
    rooms.delete(room.code);
    console.log(`Room ${room.code} ended by host`);
  });

  socket.on("back-to-lobby", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    if (!member.isHost) return;

    clearServerTimer(room);
    room.mode = "waiting";
    room.timer = { endsAt: null, remainingMs: room.settings.focusDuration };
    for (const m of room.members.values()) {
      m.status = "locked-in";
      m.sessionAura = 0;
      m.sessionPassedChecks = 0;
      m.sessionFailedChecks = 0;
      m.sessionSentSuccessfully = 0;
    }
    broadcast(room.code);
  });

  socket.on("update-settings", (data: Partial<RoomSettings>) => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    if (!member.isHost) return;

    const prev = room.settings;
    room.settings = {
      focusDuration: data.focusDuration ?? prev.focusDuration,
      breakDuration: data.breakDuration ?? prev.breakDuration,
      checksPerSession: data.checksPerSession ?? prev.checksPerSession,
      cooldownMs: data.cooldownMs ?? prev.cooldownMs,
      timerControlPermission:
        data.timerControlPermission ?? prev.timerControlPermission,
    };

    // If not running a focus session, update the timer display too
    if (room.mode === "waiting" || room.mode === "finished") {
      room.timer.remainingMs = room.settings.focusDuration;
    }

    broadcast(room.code);
  });

  socket.on("start-focus", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    if (!canControlTimer(room, member)) return;
    if (room.mode === "focus") return;

    room.mode = "focus";
    room.sessionNumber++;
    const actualDuration = room.settings.focusDuration;
    room.timer = {
      endsAt: Date.now() + actualDuration,
      remainingMs: actualDuration,
    };

    for (const m of room.members.values()) {
      resetMemberSessionStats(m, room.settings.checksPerSession);
    }

    startServerTimer(room, actualDuration, () => endFocusSession(room));
    broadcast(room.code);
  });

  socket.on("start-break", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    if (!canControlTimer(room, member)) return;

    room.mode = "break";
    room.timer = {
      endsAt: Date.now() + room.settings.breakDuration,
      remainingMs: room.settings.breakDuration,
    };
    for (const m of room.members.values()) m.status = "on-break";

    startServerTimer(room, room.settings.breakDuration, () => {
      room.mode = "waiting";
      room.timer = { endsAt: null, remainingMs: room.settings.focusDuration };
      for (const m of room.members.values()) m.status = "locked-in";
      broadcast(room.code);
    });

    broadcast(room.code);
  });

  socket.on("pause-timer", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    if (!canControlTimer(room, member)) return;
    if (!room.timer.endsAt) return;

    clearServerTimer(room);
    room.timer.remainingMs = Math.max(0, room.timer.endsAt - Date.now());
    room.timer.endsAt = null;
    broadcast(room.code);
  });

  socket.on("resume-timer", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    if (!canControlTimer(room, member)) return;
    if (room.timer.endsAt) return;
    if (room.timer.remainingMs <= 0) return;

    room.timer.endsAt = Date.now() + room.timer.remainingMs;

    if (room.mode === "focus") {
      startServerTimer(room, room.timer.remainingMs, () =>
        endFocusSession(room),
      );
    } else if (room.mode === "break") {
      startServerTimer(room, room.timer.remainingMs, () => {
        room.mode = "waiting";
        room.timer = { endsAt: null, remainingMs: room.settings.focusDuration };
        broadcast(room.code);
      });
    }

    broadcast(room.code);
  });

  socket.on("reset-timer", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;
    if (!canControlTimer(room, member)) return;

    clearServerTimer(room);
    room.mode = "waiting";
    room.timer = { endsAt: null, remainingMs: room.settings.focusDuration };
    broadcast(room.code);
  });

  socket.on("send-mog-check", (data: { toMemberId: string }) => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member: sender } = res;

    if (room.mode !== "focus") {
      socket.emit("mog-check-rejected", { reason: "not-in-focus" });
      return;
    }
    if (data.toMemberId === sender.id) {
      socket.emit("mog-check-rejected", { reason: "cant-mog-yourself" });
      return;
    }
    if (sender.checksRemaining <= 0) {
      socket.emit("mog-check-rejected", { reason: "no-checks-remaining" });
      return;
    }
    if (
      sender.lastCheckSentAt &&
      Date.now() - sender.lastCheckSentAt < room.settings.cooldownMs
    ) {
      socket.emit("mog-check-rejected", {
        reason: "cooldown-active",
        remainingMs:
          room.settings.cooldownMs - (Date.now() - sender.lastCheckSentAt),
      });
      return;
    }

    const target = room.members.get(data.toMemberId);
    if (!target) {
      socket.emit("mog-check-rejected", { reason: "target-not-found" });
      return;
    }

    const alreadyPending = Array.from(room.activeChecks.values()).some(
      (c) => c.toMemberId === data.toMemberId && c.status === "pending",
    );
    if (alreadyPending) {
      socket.emit("mog-check-rejected", { reason: "already-pending" });
      return;
    }

    sender.checksRemaining--;
    sender.lastCheckSentAt = Date.now();
    target.status = "mog-pending";

    const checkId = uuidv4();
    const check: MogCheck = {
      id: checkId,
      fromMemberId: sender.id,
      toMemberId: target.id,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      photoBase64: null,
      timeout: setTimeout(() => failCheck(room, check, "timeout"), 60_000),
    };

    room.activeChecks.set(checkId, check);

    const targetSocket = [...io.sockets.sockets.values()].find(
      (s) => s.id === target.socketId,
    );
    if (targetSocket) {
      targetSocket.emit("receive-mog-check", {
        checkId,
        fromUsername: sender.username,
        expiresAt: check.expiresAt,
      });
    }

    broadcast(room.code);
  });

  socket.on(
    "submit-mog-photo",
    (data: { checkId: string; photoBase64: string }) => {
      const res = findMemberBySocket(socket.id);
      if (!res) return;
      const { room, member } = res;

      const check = room.activeChecks.get(data.checkId);
      if (!check || check.status !== "pending") return;
      if (check.toMemberId !== member.id) return;

      if (check.timeout) {
        clearTimeout(check.timeout);
        check.timeout = null;
      }
      check.status = "passed";
      check.photoBase64 = data.photoBase64;

      member.status = "mog-certified";
      member.passedChecks++;
      member.sessionPassedChecks++;
      member.latestPhotoBase64 = data.photoBase64;
      addAura(member, 25, "mog-check-passed");

      const sender = room.members.get(check.fromMemberId);
      if (sender) {
        sender.sentSuccessfully++;
        sender.sessionSentSuccessfully++;
        addAura(sender, 10, "mog-check-sent-success");
      }

      room.photos.push({
        memberId: member.id,
        username: member.username,
        fromUsername: sender?.username ?? "???",
        photoBase64: data.photoBase64,
        timestamp: Date.now(),
      });
      const photoIndex = room.photos.length - 1;
      const roomCode = room.code;
      const memberId = member.id;
      const memberUsername = member.username;

      room.activeChecks.delete(check.id);

      io.to(room.code).emit("mog-check-success", {
        checkId: check.id,
        toMemberId: member.id,
        toUsername: member.username,
        photoBase64: data.photoBase64,
      });
      broadcast(room.code);

      // Async mog analysis — does not block the response
      analyzeMogPhoto(data.photoBase64).then((scorecard) => {
        if (!scorecard) return;
        const r = rooms.get(roomCode);
        if (!r) return;
        const photo = r.photos[photoIndex];
        if (!photo || photo.memberId !== memberId) return;

        photo.scorecard = scorecard;

        if (scorecard.mogBonus > 0) {
          const m = r.members.get(memberId);
          if (m) addAura(m, scorecard.mogBonus, "mog-quality-bonus");
        }

        io.to(roomCode).emit("mog-scorecard", {
          memberId,
          username: memberUsername,
          scorecard,
        });
        broadcast(roomCode);
      });
    },
  );

  socket.on("cancel-mog-check", (data: { checkId: string }) => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    const { room, member } = res;

    const check = room.activeChecks.get(data.checkId);
    if (!check || check.status !== "pending") return;
    if (check.toMemberId !== member.id) return;

    failCheck(room, check, "cancel");
  });

  // Client emits this on mount to catch up if the initial room-state broadcast was missed
  socket.on("request-state", () => {
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    socket.emit("room-state", serializeRoom(res.room));
  });

  socket.on("disconnect", () => {
    console.log("- socket disconnected:", socket.id);
    const res = findMemberBySocket(socket.id);
    if (!res) return;
    removeMember(res.room, res.member);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Study Mog backend running on http://localhost:${PORT}`);
});
