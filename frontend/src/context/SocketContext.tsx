// SocketContext.js
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  // change URL to your backend socket url (same origin works too)
  const socket = useMemo(() => io(import.meta.env.VITE_BACKEND_URL || '', {
    path: '/socket.io',
    // auth: { token: yourAuthTokenIfNeeded } // optional
  }), []);

  useEffect(() => {
    // debug
    socket.on('connect', () => console.log('socket connected', socket.id));
    socket.on('connect_error', (err) => console.warn('socket connect error', err));
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
