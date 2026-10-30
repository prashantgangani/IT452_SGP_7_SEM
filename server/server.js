import 'dotenv/config';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { registerCallSocket } from './services/callSignalingService.js';

const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://finsite-pi.vercel.app',
  ...(process.env.CLIENT_URL || '').split(',').map(origin => origin.trim()).filter(Boolean),
];

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 30000,
});

// Register global notifications namespace
import { initGlobalSocket } from './services/socketManager.js';
initGlobalSocket(io);

// Expose io object to all routes (app.locals)
app.locals.io = io;

// Register WebRTC signaling namespace
registerCallSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (HTTP + Socket.IO)`);
});
