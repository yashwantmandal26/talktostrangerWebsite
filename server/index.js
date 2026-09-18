// Talk to Strangers India real-time matchmaking & chat server
// Node.js + Express + Socket.io — optimized for free-tier hosting (Render/Fly.io, 512MB RAM)

const http = require('http');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const sanitize = require('sanitize-html');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { createModeration } = require('./moderation');

const PORT = process.env.PORT || 3001;
const CLIENT_URLS = (process.env.CLIENT_URLS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((s) => s.trim());

const app = express();
app.use(helmet());
app.use(cors({ origin: CLIENT_URLS, credentials: false }));
app.use(express.json({ limit: '8kb' }));

const moderation = createModeration();

// ---- Health check (prevents cold start drops on free tiers) ----
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    online: io ? io.engine.clientsCount : 0,
    waiting: waitingQueue.length,
    rooms: rooms.size,
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URLS, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 4 * 1024, // 4KB payloads max
  pingTimeout: 20000,
  pingInterval: 25000,
  serveClient: false,
});

// ===================== In-memory state (RAM-conscious) =====================
/** @type {Array<{ socketId: string, interests: string[], joinedAt: number }>} Queue of users waiting for a match */
let waitingQueue = [];
/** @type {Map<string, string>} roomId -> "socketA|socketB" */
const rooms = new Map();
/** @type {Map<string, string>} socketId -> roomId for O(1) partner lookup */
const socketRoom = new Map();

// Broadcast live online count every 10s
setInterval(() => {
  io.emit('online_count', { count: io.engine.clientsCount });
}, 10000).unref();

function ipHashOf(socket) {
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || '';
  return crypto.createHash('sha256').update(String(ip).split(',')[0] + (process.env.IP_SALT || 'talktostrangersindia')).digest('hex');
}

function sanct(text, maxLen = 500) {
  return sanitize(String(text || '').slice(0, maxLen), { allowedTags: [], allowedAttributes: {} });
}

function disconnectFromRoom(socket, reason) {
  const roomId = socketRoom.get(socket.id);
  if (!roomId) return null;
  socketRoom.delete(socket.id);
  const pair = rooms.get(roomId);
  rooms.delete(roomId);
  socket.leave(roomId);
  if (pair) {
    const [a, b] = pair.split('|');
    const partnerId = a === socket.id ? b : a;
    socketRoom.delete(partnerId);
    const partner = io.sockets.sockets.get(partnerId);
    if (partner) {
      partner.leave(roomId);
      partner.emit('game_close', { reason: 'partner_left' });
      partner.emit('stranger_disconnected', { reason });
    }
    return partnerId;
  }
  return null;
}

function removeFromQueue(socketId) {
  waitingQueue = waitingQueue.filter((item) => item.socketId !== socketId);
}

function pairSockets(aEntry, bEntry, commonInterests = []) {
  const a = io.sockets.sockets.get(aEntry.socketId);
  const b = io.sockets.sockets.get(bEntry.socketId);
  if (!a || !b) {
    if (a) waitingQueue.push(aEntry);
    if (b) waitingQueue.push(bEntry);
    return false;
  }
  const roomId = uuidv4();
  rooms.set(roomId, `${aEntry.socketId}|${bEntry.socketId}`);
  socketRoom.set(aEntry.socketId, roomId);
  socketRoom.set(bEntry.socketId, roomId);
  a.join(roomId);
  b.join(roomId);

  const interestNotice = commonInterests.length > 0
    ? `You both like: ${commonInterests.join(', ')}! Say Hi!`
    : "You're now chatting with a random Indian stranger. Say Hi!";

  const payload = {
    role: 'stranger',
    system: interestNotice,
    commonInterests,
  };
  a.emit('chat_started', payload);
  b.emit('chat_started', payload);
  console.log(`[match] ${aEntry.socketId} <-> ${bEntry.socketId} in ${roomId} (interests: ${commonInterests.join(',') || 'none'})`);
  return true;
}

function tryMatch() {
  if (waitingQueue.length < 2) return;

  const now = Date.now();
  let matched = true;

  while (matched && waitingQueue.length >= 2) {
    matched = false;

    // 1. Try to find a pair with common interests
    for (let i = 0; i < waitingQueue.length; i++) {
      const a = waitingQueue[i];
      if (a.interests.length > 0) {
        for (let j = i + 1; j < waitingQueue.length; j++) {
          const b = waitingQueue[j];
          const common = a.interests.filter((tag) => b.interests.includes(tag));
          if (common.length > 0) {
            waitingQueue.splice(j, 1);
            waitingQueue.splice(i, 1);
            pairSockets(a, b, common);
            matched = true;
            break;
          }
        }
      }
      if (matched) break;
    }

    if (matched) continue;

    // 2. Fallback: If either oldest user has waited >= 2.5s, or either user has no specific interests
    const first = waitingQueue[0];
    const second = waitingQueue[1];
    const isOldEnough = (now - first.joinedAt) > 2500 || first.interests.length === 0 || second.interests.length === 0;

    if (isOldEnough) {
      waitingQueue.splice(1, 1);
      waitingQueue.splice(0, 1);
      pairSockets(first, second, []);
      matched = true;
    } else {
      break;
    }
  }
}

// Periodic queue sweep so users waiting with interests fall back without freezing
setInterval(tryMatch, 1500).unref();

io.on('connection', (socket) => {
  const ipHash = ipHashOf(socket);
  socket.emit('online_count', { count: io.engine.clientsCount });

  // ---- Matchmaking ----
  socket.on('find_stranger', (data = {}) => {
    if (moderation.isBlocked(ipHash)) {
      socket.emit('blocked', { reason: 'You were reported and are temporarily blocked.' });
      return;
    }
    if (socketRoom.has(socket.id)) return; // already chatting
    if (waitingQueue.some((item) => item.socketId === socket.id)) return; // already waiting

    const rawInterests = Array.isArray(data?.interests) ? data.interests : [];
    const cleanInterests = rawInterests
      .slice(0, 6)
      .map((tag) => sanct(tag, 30).toLowerCase())
      .filter((tag) => tag.length > 1);

    waitingQueue.push({
      socketId: socket.id,
      interests: cleanInterests,
      joinedAt: Date.now(),
    });

    socket.emit('searching');
    tryMatch();
  });

  socket.on('cancel_search', () => {
    removeFromQueue(socket.id);
    socket.emit('search_cancelled');
  });

  socket.on('skip_interest_filter', () => {
    const entry = waitingQueue.find((item) => item.socketId === socket.id);
    if (entry) {
      entry.interests = [];
      entry.joinedAt = Date.now() - 3000;
      tryMatch();
    }
  });

  // ---- Messaging (Phase 3 moderation enforced server-side) ----
  socket.on('send_message', (payload = {}) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    const result = moderation.moderateMessage(socket.id, payload.text);
    if (!result.ok) {
      socket.emit('message_blocked', { reason: result.reason });
      return;
    }
    const clean = sanct(result.clean);
    const ts = Date.now();
    const type = payload.type === 'icebreaker' ? 'icebreaker' : payload.type === 'reaction' ? 'reaction' : 'text';

    socket.emit('message', { text: clean, from: 'you', type, at: ts }); // echo to sender
    socket.to(roomId).emit('message', { text: clean, from: 'stranger', type, at: ts });
  });

  socket.on('typing', ({ isTyping } = {}) => {
    const roomId = socketRoom.get(socket.id);
    if (roomId) socket.to(roomId).emit('typing', { isTyping: !!isTyping });
  });

  // ---- Multiplayer In-Chat Games Signaling ----
  socket.on('game_invite', ({ gameType } = {}) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('game_invite', { gameType, from: 'stranger', hostId: socket.id });
  });

  socket.on('game_response', ({ gameType, accept } = {}) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    const pair = rooms.get(roomId);
    if (!pair) return;
    const [a, b] = pair.split('|');
    const partnerId = a === socket.id ? b : a;

    if (accept) {
      // Game accepted! Partner who invited is host (X / Player 1), socket who accepted is guest (O / Player 2)
      io.to(roomId).emit('game_start', {
        gameType,
        hostId: partnerId,
        guestId: socket.id,
      });
    } else {
      socket.to(roomId).emit('game_rejected', { gameType, from: 'stranger' });
    }
  });

  socket.on('game_move', ({ gameType, moveData } = {}) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('game_move', { gameType, moveData, from: 'stranger', senderId: socket.id });
  });

  socket.on('game_reset', ({ gameType } = {}) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('game_reset', { gameType });
  });

  socket.on('game_close', ({ gameType } = {}) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    socket.to(roomId).emit('game_close', { gameType, reason: 'partner_closed' });
  });

  // ---- Skip / leave ----
  socket.on('skip_chat', () => {
    disconnectFromRoom(socket, 'skip');
    socket.emit('stranger_disconnected', { reason: 'skipped' });
  });

  // ---- Report & leave (Phase 3) ----
  socket.on('report_partner', ({ reason } = {}) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    const pair = rooms.get(roomId);
    if (pair) {
      const [a, b] = pair.split('|');
      const partnerId = a === socket.id ? b : a;
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        moderation.block(ipHashOf(partnerSocket)); // 24h block
        console.log(`[report] ${socket.id} reported ${partnerId} :: ${sanct(reason || '', 120)}`);
      }
    }
    disconnectFromRoom(socket, 'reported');
    socket.emit('stranger_disconnected', { reason: 'reported' });
  });

  // ---- Strict cleanup to prevent memory leaks ----
  socket.on('disconnect', (reason) => {
    moderation.rateLimiter.purge(socket.id);
    removeFromQueue(socket.id);
    disconnectFromRoom(socket, 'disconnect');
    console.log(`[disconnect] ${socket.id} (${reason})`);
  });
});

server.listen(PORT, () => {
  console.log(`Talk to Strangers India server listening on :${PORT}`);
  console.log(`Allowed origins: ${CLIENT_URLS.join(', ')}`);
});
