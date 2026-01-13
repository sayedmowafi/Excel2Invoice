import type { Server as SocketIOServer } from 'socket.io';

/**
 * Set up Socket.IO event handlers
 */
export function setupSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    // Join session room
    socket.on('join-session', (sessionId: string) => {
      socket.join(sessionId);
    });

    // Leave session room
    socket.on('leave-session', (sessionId: string) => {
      socket.leave(sessionId);
    });

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });
}
