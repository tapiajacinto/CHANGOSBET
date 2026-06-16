'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

let sharedSocket: Socket | null = null;

function getSocketUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3002';

  // Production (Vercel): use the explicit env var pointing to Railway backend
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (envUrl) return envUrl;

  // Development: derive from browser hostname — works for localhost AND LAN (misma WiFi)
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3002`;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sharedSocket) {
      sharedSocket = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
      });
    }

    const s = sharedSocket;
    setSocket(s);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
