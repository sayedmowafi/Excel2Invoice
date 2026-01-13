import type { Server as SocketIOServer } from 'socket.io';

/**
 * Set up Socket.IO event handlers
 */
export function setupSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join session room
    socket.on('join-session', (sessionId: string) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });

    // Leave session room
    socket.on('leave-session', (sessionId: string) => {
      socket.leave(sessionId);
      console.log(`Socket ${socket.id} left session ${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
