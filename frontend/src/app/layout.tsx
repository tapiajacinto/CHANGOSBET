import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoomProvider } from '@/contexts/RoomContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'CHANGOSBET',
  description: 'Casino virtual multijugador con fichas ilimitadas — 100% gratuito',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <RoomProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#ffffff',
                  color: '#9a0000',
                  border: '1.5px solid #fecaca',
                  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                  fontWeight: '600',
                  borderRadius: '14px',
                  boxShadow: '0 4px 20px rgba(192,0,10,0.12)',
                },
                success: {
                  iconTheme: { primary: '#c0000a', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
