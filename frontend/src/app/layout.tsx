import type { Metadata, Viewport } from 'next';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoomProvider } from '@/contexts/RoomContext';
import { Toaster } from 'react-hot-toast';

const display = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display' });
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'CHANGOSBET — Casino entre changos',
  description: 'Casino virtual multijugador. Cargá fichas con tu cajero y jugá con amigos.',
};

export const viewport: Viewport = {
  themeColor: '#7f0000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>
        <AuthProvider>
          <RoomProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#ffffff',
                  color: '#9a0000',
                  border: '1.5px solid #ffdfdf',
                  fontWeight: '600',
                  borderRadius: '14px',
                  boxShadow: '0 8px 30px rgba(192,0,10,0.16)',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
                error: { iconTheme: { primary: '#c0000a', secondary: '#fff' } },
              }}
            />
          </RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
