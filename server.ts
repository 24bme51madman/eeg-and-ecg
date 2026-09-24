import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase, logTelemetryPacket, getRecentTelemetryLogs, getDatabaseStatus } from './src/server/db.js';

interface TelemetryPacket {
  ch1: number;
  ch2: number;
  ref: number;
  battery?: number;
  isCharging?: boolean;
  deviceId?: string;
  impedance?: [number, number, number];
  ecgMv?: number;
  heartRateBpm?: number;
  delta?: number;
  theta?: number;
  alpha?: number;
  beta?: number;
  leadsOff?: boolean;
  timestamp: number;
}

let latestPacket: TelemetryPacket = {
  ch1: 14.2,
  ch2: -8.4,
  ref: 0.1,
  battery: 92,
  isCharging: false,
  deviceId: 'headband-kortex-01',
  impedance: [6.8, 7.2, 4.2],
  timestamp: Date.now(),
};

let packetCounter = 0;
const sseClients = new Set<express.Response>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // CORS headers for global telemetry ingestion from any remote device/headband
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-ID');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health and status API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hostType: 'global',
      activeSubscribers: sseClients.size,
      packetsIngested: packetCounter,
      latestTimestamp: latestPacket.timestamp,
    });
  });

  // Local ESP32 AP Hardware Proxy: GET /api/hardware/proxy
  // Allows web client on HTTPS to query local ESP32 AP at http://192.168.4.1/data
  app.get('/api/hardware/proxy', async (req, res) => {
    const targetUrl = (req.query.url as string) || 'http://192.168.4.1/data';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const upstream = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: `Upstream returned status ${upstream.status}` });
      }
      const data = await upstream.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(503).json({
        error: 'Device not reachable',
        message: err?.message || 'Connection to http://192.168.4.1/data failed',
      });
    }
  });

  // Global Ingestion Endpoint: POST /api/telemetry
  // Headband microcontrollers (ESP32, Raspberry Pi, Python script, or remote clients anywhere in the world)
  // send continuous packets here.
  app.post('/api/telemetry', (req, res) => {
    const body = req.body;
    const now = Date.now();

    let packet: TelemetryPacket;

    if (Array.isArray(body)) {
      // Array format: [ch1, ch2, ref]
      packet = {
        ch1: Number(body[0]) || 0,
        ch2: Number(body[1]) || 0,
        ref: Number(body[2]) || 0,
        battery: latestPacket.battery,
        timestamp: now,
      };
    } else {
      packet = {
        ch1: Number(body.ch1 ?? body.fp1 ?? body[0] ?? 0),
        ch2: Number(body.ch2 ?? body.fp2 ?? body[1] ?? 0),
        ref: Number(body.ref ?? body.ground ?? body[2] ?? 0),
        battery: typeof body.battery === 'number' ? body.battery : latestPacket.battery,
        isCharging: typeof body.isCharging === 'boolean' ? body.isCharging : (body.charging ?? latestPacket.isCharging),
        deviceId: body.deviceId || 'kortex-headband-global',
        impedance: Array.isArray(body.impedance) && body.impedance.length === 3
          ? [Number(body.impedance[0]), Number(body.impedance[1]), Number(body.impedance[2])]
          : latestPacket.impedance,
        ecgMv: typeof body.ecgMv === 'number' ? body.ecgMv : typeof body.ecg === 'number' ? body.ecg : undefined,
        heartRateBpm: typeof body.heartRateBpm === 'number' ? body.heartRateBpm : typeof body.hr === 'number' ? body.hr : undefined,
        delta: typeof body.delta === 'number' ? body.delta : undefined,
        theta: typeof body.theta === 'number' ? body.theta : undefined,
        alpha: typeof body.alpha === 'number' ? body.alpha : undefined,
        beta: typeof body.beta === 'number' ? body.beta : undefined,
        leadsOff: typeof body.leadsOff === 'boolean' ? body.leadsOff : undefined,
        timestamp: now,
      };
    }

    latestPacket = packet;
    packetCounter += 1;

    // Asynchronously log to Supabase PostgreSQL database if connected
    logTelemetryPacket(packet).catch(() => {});

    // Broadcast to all globally connected browser dashboards via Server-Sent Events
    const message = `data: ${JSON.stringify(packet)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(message);
      } catch {
        sseClients.delete(client);
      }
    }

    res.status(200).json({
      success: true,
      packetsIngested: packetCounter,
      subscribersNotified: sseClients.size,
    });
  });

  // Supabase Database Connection Status
  app.get('/api/db/status', async (req, res) => {
    const status = await getDatabaseStatus();
    res.json(status);
  });

  // Supabase Database Historical Telemetry Logs
  app.get('/api/db/history', async (req, res) => {
    const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
    const logs = await getRecentTelemetryLogs(limit);
    res.json({ count: logs.length, logs });
  });

  // Global Ingestion Status / Snapshot: GET /api/telemetry/latest
  app.get('/api/telemetry/latest', (req, res) => {
    res.json({
      latestPacket,
      totalPackets: packetCounter,
      activeSubscribers: sseClients.size,
      serverTime: Date.now(),
    });
  });

  // Global Real-Time SSE Stream: GET /api/telemetry/stream
  // The website dashboard connects to this endpoint from anywhere globally
  app.get('/api/telemetry/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Immediately send current latest packet
    res.write(`data: ${JSON.stringify(latestPacket)}\n\n`);

    // Keepalive heartbeat every 12 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 12000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Mount Vite or static file serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Global Host EEG Telemetry Server running on http://0.0.0.0:${PORT}`);
    await initDatabase();
  });
}

startServer();
