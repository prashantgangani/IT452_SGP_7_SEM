import jwt from "jsonwebtoken";

/**
 * Socket.IO signaling service for WebRTC.
 * Registered on the "/call" namespace.
 *
 * Events relayed: call:offer, call:answer, call:ice-candidate
 * Chat relay:     call:chat-message
 * Lifecycle:      call:join, call:leave
 */

export function registerCallSocket(io) {
  const callNs = io.of("/call");

  // Active room tracking: dealId → { participants: { userId: socketId } }
  const rooms = {};

  callNs.use((socket, next) => {
    const { roomToken, userToken } = socket.handshake.auth;
    if (!roomToken) return next(new Error("Missing room token"));

    try {
      const payload = jwt.verify(roomToken, process.env.JWT_SECRET);
      socket.dealId = payload.dealId;
      socket.lenderId = payload.lenderId;
      socket.msmeId = payload.msmeId;
      socket.role = payload.role;
      socket.userId = payload.userId;
    } catch {
      return next(new Error("Invalid room token"));
    }

    try {
      if (userToken) {
        const u = jwt.verify(userToken, process.env.JWT_SECRET);
        socket.userId = u.id || socket.userId;
        socket.userRole = u.role || socket.role;
        socket.userName = u.name;
      }
    } catch { /* best effort */ }

    next();
  });

  callNs.on("connection", (socket) => {
    const roomId = `call:${socket.dealId}`;

    // Keepalive ping/pong
    socket.on("call:ping", () => {
      socket.emit("call:pong");
    });

    // ─── JOIN ─────────────────────────────────────────────
    socket.on("call:join", () => {
      if (!rooms[roomId]) rooms[roomId] = { participants: {} };
      const room = rooms[roomId];

      // Deterministic participant key by role or userId (prevents duplicate slots on reconnect)
      const participantKey = socket.role === 'ADMIN' ? 'ADMIN' : (socket.userId || socket.id);

      const activeKeys = Object.keys(room.participants);
      
      // Allow up to 3 participants (e.g. Lender, MSME, and Admin)
      if (activeKeys.length >= 3 && !room.participants[participantKey]) {
        socket.emit("call:error", { message: "Room is full (max 3 participants)." });
        return;
      }

      // If this user already has an active socket, replace it smoothly without breaking
      const oldSocketId = room.participants[participantKey];
      if (oldSocketId && oldSocketId !== socket.id) {
        const oldSocket = callNs.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.leave(roomId);
          oldSocket.currentRoom = null;
        }
      }

      room.participants[participantKey] = socket.id;
      socket.join(roomId);
      socket.currentRoom = roomId;
      socket.roomParticipantKey = participantKey;
      socket.roomUserId = socket.userId || socket.id;

      const currentUsersCount = Object.keys(room.participants).length;

      // Broadcast participants count update
      callNs.to(roomId).emit("call:participants-update", {
        count: currentUsersCount,
        participants: Object.keys(room.participants),
      });

      const otherSocketIds = Object.values(room.participants).filter(id => id !== socket.id);

      // Send the newly joined socket info about existing peers
      const existingPeers = otherSocketIds.map(sId => {
        const peerSocket = callNs.sockets.get(sId);
        return {
          peerId: sId,
          userId: peerSocket?.userId,
          role: peerSocket?.userRole || peerSocket?.role,
          name: peerSocket?.userName,
        };
      });

      socket.emit("call:joined", { existingPeers });

      // Notify existing peers that a new peer joined
      otherSocketIds.forEach(peerSocketId => {
        callNs.to(peerSocketId).emit("call:peer-joined", {
          peerId: socket.id,
          userId: socket.userId,
          role: socket.userRole || socket.role,
          name: socket.userName,
        });
      });
    });

    // ─── SDP OFFER ────────────────────────────────────────
    socket.on("call:offer", ({ to, offer }) => {
      const payload = {
        from: socket.id,
        role: socket.userRole || socket.role,
        name: socket.userName,
        offer,
      };
      if (to) {
        callNs.to(to).emit("call:offer", payload);
      } else {
        socket.to(socket.currentRoom).emit("call:offer", payload);
      }
    });

    // ─── SDP ANSWER ───────────────────────────────────────
    socket.on("call:answer", ({ to, answer }) => {
      const payload = { from: socket.id, answer };
      if (to) {
        callNs.to(to).emit("call:answer", payload);
      } else {
        socket.to(socket.currentRoom).emit("call:answer", payload);
      }
    });

    // ─── ICE CANDIDATES ──────────────────────────────────
    socket.on("call:ice-candidate", ({ to, candidate }) => {
      const payload = { from: socket.id, candidate };
      if (to) {
        callNs.to(to).emit("call:ice-candidate", payload);
      } else {
        socket.to(socket.currentRoom).emit("call:ice-candidate", payload);
      }
    });

    // ─── CHAT ─────────────────────────────────────────────
    socket.on("call:chat-message", ({ text, senderName }) => {
      if (!text || typeof text !== "string" || !text.trim()) return;
      const role = socket.userRole || socket.role || "USER";
      const resolvedName = senderName || (role === 'ADMIN' ? 'Admin (Platform)' : (socket.userName || 'Participant'));
      const msg = {
        text: text.trim().slice(0, 1000),
        senderId: socket.userId || socket.id,
        senderName: resolvedName,
        senderRole: role,
        timestamp: new Date().toISOString(),
      };
      // Echo own message back
      socket.emit("call:chat-message", { ...msg, own: true });
      // Send to other peer(s)
      socket.to(socket.currentRoom).emit("call:chat-message", { ...msg, own: false });
    });

    // ─── LEAVE ────────────────────────────────────────────
    socket.on("call:leave", () => cleanup(socket));
    socket.on("disconnect", () => cleanup(socket));

    function cleanup(s) {
      if (s.currentRoom) {
        const room = rooms[s.currentRoom];
        let remainingCount = 0;
        const key = s.roomParticipantKey || s.roomUserId;
        if (room && key) {
          // Only delete if the disconnected socket is still the active one for this user
          if (room.participants[key] === s.id) {
             delete room.participants[key];
             remainingCount = Object.keys(room.participants).length;
             if (remainingCount === 0) {
               delete rooms[s.currentRoom];
             }
          } else {
             // A newer socket already took over this participant's slot
             remainingCount = Object.keys(room.participants).length;
          }
        }
        s.to(s.currentRoom).emit("call:peer-left", {
          peerId: s.id,
          userId: s.roomUserId,
          role: s.userRole || s.role,
          remainingCount,
        });
        s.leave(s.currentRoom);
        s.currentRoom = null;
      }
    }
  });
}
