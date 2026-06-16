import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoomProvider } from '@/contexts/RoomContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'CHANGOSBET Casino',
  description: 'Casino virtual multijugador con dinero ficticio',
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
                  background: '#1a1a3a',
                  color: '#ffd700',
                  border: '1px solid #ffd700',
                  fontFamily: 'Georgia, serif',
                },
              }}
            />
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
