// server/src/socket/socketHandler.js
import jwt from 'jsonwebtoken';

/**
 * Register all Socket.IO event handlers
 * @param {import('socket.io').Server} io
 */
export const initSocket = (io) => {

  // ── Auth Middleware ───────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket;

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    socket.on('join:property', (propertyId) => {
      socket.join(`property:${propertyId}`);
    });

    socket.on('leave:property', (propertyId) => {
      socket.leave(`property:${propertyId}`);
    });

    socket.on('maintenance:comment', ({ ticketId, comment }) => {
      // Broadcast to all users watching this ticket
      socket.to(`ticket:${ticketId}`).emit('maintenance:comment:new', { ticketId, comment });
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });
};
