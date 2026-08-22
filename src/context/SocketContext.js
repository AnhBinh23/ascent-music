import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    let socket = null;
    let cancelled = false;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');

        if (cancelled) return;

        socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
          console.log('🔌 Socket connected:', socket.id);
          setConnected(true);
        });

        socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          setConnected(false);
        });

        socket.on('connect_error', (err) => {
          console.warn('🔌 Socket error:', err.message);
        });

        socket.on('notification:new', (data) => {
          toast.info(`🔔 ${data.title}`, { autoClose: 5000 });
        });

        socketRef.current = socket;

        // Attach any listeners that were registered before connection
        const currentListeners = listenersRef.current;
        for (const [event, callbacks] of currentListeners.entries()) {
          for (const cb of callbacks) {
            socket.on(event, cb);
          }
        }
      } catch (err) {
        console.warn('🔌 Socket.IO not available:', err.message);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, [user, token]);

  const subscribe = useCallback((event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);

    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }

    return () => {
      const set = listenersRef.current.get(event);
      if (set) set.delete(callback);
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ connected, subscribe, socket: socketRef }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket phải dùng trong SocketProvider');
  return context;
};

export default SocketContext;