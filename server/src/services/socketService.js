import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

let io = null;
const onlineUsers = new Map(); // userId -> Set of socketIds

export class SocketService {
  static init(httpServer) {
    if (io) return io;

    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // JWT Authentication Middleware for Socket.io
    io.use((socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '') ||
          socket.handshake.query?.token;

        if (!token) {
          // Allow connection as guest if needed, but flag as unauthenticated
          socket.user = null;
          return next();
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        socket.user = decoded;
        return next();
      } catch (err) {
        // Continue without user rather than crashing connection
        socket.user = null;
        return next();
      }
    });

    io.on('connection', (socket) => {
      const user = socket.user;
      if (user && user.id) {
        const userId = String(user.id);
        // Track online status
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Join personal user room for direct notifications
        socket.join(`user_${userId}`);
        console.log(`🔌 [Socket.io] User connected: ${user.fullName || user.name || userId} (${socket.id})`);
      }

      // Join a specific conversation room
      socket.on('join_conversation', (convId) => {
        if (!convId) return;
        const roomId = `conversation_${convId}`;
        socket.join(roomId);
      });

      // Leave a specific conversation room
      socket.on('leave_conversation', (convId) => {
        if (!convId) return;
        const roomId = `conversation_${convId}`;
        socket.leave(roomId);
      });

      // User typing indicator
      socket.on('typing', ({ conversationId, isTyping }) => {
        if (!conversationId || !socket.user) return;
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.user.id,
          userName: socket.user.fullName || socket.user.name || 'مستخدم',
          isTyping: Boolean(isTyping),
        });
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        if (user && user.id) {
          const userId = String(user.id);
          const userSockets = onlineUsers.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              onlineUsers.delete(userId);
            }
          }
        }
      });
    });

    console.log('✅ [Socket.io] Real-time messaging service initialized.');
    return io;
  }

  static getIO() {
    return io;
  }

  static isUserOnline(userId) {
    if (!userId) return false;
    return onlineUsers.has(String(userId)) && onlineUsers.get(String(userId)).size > 0;
  }

  /**
   * Emit new message to all participants in conversation room
   */
  static emitNewMessage(conversationId, message, conversation) {
    if (!io) return;
    io.to(`conversation_${conversationId}`).emit('new_message', {
      conversationId,
      message,
      conversation,
    });
  }

  /**
   * Emit conversation update (e.g. unread count, last message) to specific user
   */
  static emitToUser(userId, event, payload) {
    if (!io || !userId) return;
    io.to(`user_${String(userId)}`).emit(event, payload);
  }

  /**
   * Emit when a conversation was read
   */
  static emitConversationRead(conversationId, readByUserId) {
    if (!io) return;
    io.to(`conversation_${conversationId}`).emit('conversation_read', {
      conversationId,
      readByUserId,
    });
  }
}

