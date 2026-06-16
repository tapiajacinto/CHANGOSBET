import type { Metadata, Viewport } from 'next';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
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
  themeColor: '#121016',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Aplica el tema antes del primer paint (evita el flash de tema incorrecto).
const noFlash = `(function(){try{var t=localStorage.getItem('changosbet_theme')||'dark';if(t!=='light')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
        <ThemeProvider>
          <AuthProvider>
            <RoomProvider>
              {children}
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: 'rgb(var(--surface))',
                    color: 'rgb(var(--fg))',
                    border: '1px solid rgb(var(--line))',
                    fontWeight: '600',
                    borderRadius: '14px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                    fontSize: '14px',
                  },
                  success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
                  error: { iconTheme: { primary: '#c0000a', secondary: '#fff' } },
                }}
              />
            </RoomProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
