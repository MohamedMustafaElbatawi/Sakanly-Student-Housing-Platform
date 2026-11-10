import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../config/apiConfig.js';

let socketInstance = null;

export const getSocket = (token) => {
  const activeToken = token || localStorage.getItem('sakanly_token');

  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      auth: { token: activeToken },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('🟢 [Socket.io Client] Connected to real-time server with id:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.io Client] Connection notice:', err.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 [Socket.io Client] Disconnected:', reason);
    });
  } else if (activeToken && socketInstance.auth?.token !== activeToken) {
    // If token refreshed, update auth
    socketInstance.auth = { token: activeToken };
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

