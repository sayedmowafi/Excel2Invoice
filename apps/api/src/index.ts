import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { uploadRouter } from './routes/upload.js';
import { sessionRouter } from './routes/session.js';
import { generateRouter } from './routes/generate.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { setupSocketHandlers } from './services/socket.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/upload', uploadLimiter, uploadRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/generate', generateRouter);

// Error handler (must be last)
app.use(errorHandler);

// Socket.IO handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT ?? 3001;

httpServer.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export { app, io };
