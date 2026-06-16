import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket/handlers';
import * as os from 'os';

const app = express();
const httpServer = createServer(app);

// Accept all origins — private friends casino, no real money involved
const io = new Server(httpServer, {
  cors: { origin: true, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSocketHandlers(io);

const PORT = Number(process.env.PORT) || 3002;
const isProduction = process.env.NODE_ENV === 'production';

httpServer.listen(PORT, '0.0.0.0', () => {
  if (isProduction) {
    console.log(`🎰 CHANGOSBET backend online — port ${PORT}`);
    return;
  }

  // Dev: show LAN URL to share with friends
  const nets = os.networkInterfaces();
  let lanIp = 'localhost';
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal &&
          !net.address.startsWith('172.') && !net.address.startsWith('169.')) {
        lanIp = net.address;
        break;
      }
    }
  }
  console.log(`\n🎰 CHANGOSBET Casino ONLINE`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🖥️  Local:   http://localhost:3000`);
  console.log(`📱 WiFi:    http://${lanIp}:3000   ← compartí con tus amigos`);
  console.log(`🔌 Backend: http://${lanIp}:${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
