var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/server/db.ts
var import_pg = __toESM(require("pg"), 1);
var { Pool } = import_pg.default;
var pool = null;
var isInitialized = false;
var dbConnected = false;
var lastDbError = null;
var lastLoggedTime = 0;
function getDatabaseUrl() {
  let url = process.env.DATABASE_URL || "postgresql://postgres:3AiwLsz-%25*nZXWc@db.jesbimexuxyhqdssgdvy.supabase.co:5432/postgres";
  if (url.includes("[") && url.includes("]")) {
    url = url.replace(/\[(.*?)\]/, (_, pw) => encodeURIComponent(pw));
  } else if (url.includes("3AiwLsz-%*nZXWc")) {
    url = url.replace("3AiwLsz-%*nZXWc", "3AiwLsz-%25*nZXWc");
  }
  return url;
}
async function initDatabase() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl || dbUrl.includes("[YOUR-PASSWORD]")) {
    console.log("[Supabase DB] DATABASE_URL is not yet configured with a valid password. Running in in-memory mode.");
    dbConnected = false;
    lastDbError = !dbUrl ? "DATABASE_URL not set in environment" : "Password placeholder [YOUR-PASSWORD] needs to be replaced";
    return false;
  }
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
        // Required for Supabase cloud PostgreSQL
      },
      max: 5,
      connectionTimeoutMillis: 5e3,
      idleTimeoutMillis: 3e4
    });
    const client = await pool.connect();
    const result = await client.query("SELECT current_database(), current_user, version()");
    console.log(`[Supabase DB] Successfully connected to Supabase PostgreSQL: ${result.rows[0]?.current_database} as ${result.rows[0]?.current_user}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS eeg_telemetry_logs (
        id BIGSERIAL PRIMARY KEY,
        device_id VARCHAR(100) DEFAULT 'esp32-headband',
        ch1 DOUBLE PRECISION,
        ch2 DOUBLE PRECISION,
        ref DOUBLE PRECISION,
        ecg_mv DOUBLE PRECISION,
        heart_rate_bpm INTEGER,
        delta DOUBLE PRECISION,
        theta DOUBLE PRECISION,
        alpha DOUBLE PRECISION,
        beta DOUBLE PRECISION,
        battery INTEGER,
        leads_off BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON eeg_telemetry_logs (created_at DESC);

      CREATE TABLE IF NOT EXISTS eeg_recording_sessions (
        id BIGSERIAL PRIMARY KEY,
        session_name VARCHAR(200) NOT NULL,
        patient_mode_id INTEGER DEFAULT 1,
        duration_seconds INTEGER DEFAULT 0,
        sample_count INTEGER DEFAULT 0,
        average_heart_rate INTEGER,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    client.release();
    dbConnected = true;
    isInitialized = true;
    lastDbError = null;
    return true;
  } catch (err) {
    dbConnected = false;
    lastDbError = err.message || "Failed to connect to Supabase PostgreSQL";
    console.warn("[Supabase DB] Connection warning:", lastDbError);
    return false;
  }
}
async function logTelemetryPacket(packet) {
  if (!dbConnected || !pool) return;
  const now = Date.now();
  if (now - lastLoggedTime < 1e3) {
    return;
  }
  lastLoggedTime = now;
  try {
    await pool.query(
      `INSERT INTO eeg_telemetry_logs 
      (device_id, ch1, ch2, ref, ecg_mv, heart_rate_bpm, delta, theta, alpha, beta, battery, leads_off)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        packet.deviceId || "esp32-headband",
        packet.ch1,
        packet.ch2,
        packet.ref,
        packet.ecgMv ?? null,
        packet.heartRateBpm ?? null,
        packet.delta ?? null,
        packet.theta ?? null,
        packet.alpha ?? null,
        packet.beta ?? null,
        packet.battery ?? null,
        packet.leadsOff ?? false
      ]
    );
  } catch (err) {
    console.warn("[Supabase DB] Error inserting telemetry log:", err.message);
  }
}
async function getRecentTelemetryLogs(limit = 50) {
  if (!dbConnected || !pool) return [];
  try {
    const res = await pool.query(
      `SELECT * FROM eeg_telemetry_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  } catch (err) {
    console.warn("[Supabase DB] Error fetching telemetry logs:", err.message);
    return [];
  }
}
async function getDatabaseStatus() {
  const dbUrl = getDatabaseUrl();
  const isConfigured = Boolean(dbUrl && !dbUrl.includes("[YOUR-PASSWORD]"));
  if (!dbConnected && isConfigured) {
    await initDatabase();
  }
  let totalLogs = 0;
  if (dbConnected && pool) {
    try {
      const res = await pool.query("SELECT COUNT(*) as count FROM eeg_telemetry_logs");
      totalLogs = parseInt(res.rows[0]?.count || "0", 10);
    } catch {
    }
  }
  return {
    configured: isConfigured,
    connected: dbConnected,
    host: "db.jesbimexuxyhqdssgdvy.supabase.co",
    port: 5432,
    database: "postgres",
    totalLogs,
    error: lastDbError
  };
}

// server.ts
var latestPacket = {
  ch1: 14.2,
  ch2: -8.4,
  ref: 0.1,
  battery: 92,
  isCharging: false,
  deviceId: "headband-kortex-01",
  impedance: [6.8, 7.2, 4.2],
  timestamp: Date.now()
};
var packetCounter = 0;
var sseClients = /* @__PURE__ */ new Set();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(import_express.default.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Device-ID");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hostType: "global",
      activeSubscribers: sseClients.size,
      packetsIngested: packetCounter,
      latestTimestamp: latestPacket.timestamp
    });
  });
  app.get("/api/hardware/proxy", async (req, res) => {
    const targetUrl = req.query.url || "http://192.168.4.1/data";
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
    } catch (err) {
      return res.status(503).json({
        error: "Device not reachable",
        message: err?.message || "Connection to http://192.168.4.1/data failed"
      });
    }
  });
  app.post("/api/telemetry", (req, res) => {
    const body = req.body;
    const now = Date.now();
    let packet;
    if (Array.isArray(body)) {
      packet = {
        ch1: Number(body[0]) || 0,
        ch2: Number(body[1]) || 0,
        ref: Number(body[2]) || 0,
        battery: latestPacket.battery,
        timestamp: now
      };
    } else {
      packet = {
        ch1: Number(body.ch1 ?? body.fp1 ?? body[0] ?? 0),
        ch2: Number(body.ch2 ?? body.fp2 ?? body[1] ?? 0),
        ref: Number(body.ref ?? body.ground ?? body[2] ?? 0),
        battery: typeof body.battery === "number" ? body.battery : latestPacket.battery,
        isCharging: typeof body.isCharging === "boolean" ? body.isCharging : body.charging ?? latestPacket.isCharging,
        deviceId: body.deviceId || "kortex-headband-global",
        impedance: Array.isArray(body.impedance) && body.impedance.length === 3 ? [Number(body.impedance[0]), Number(body.impedance[1]), Number(body.impedance[2])] : latestPacket.impedance,
        ecgMv: typeof body.ecgMv === "number" ? body.ecgMv : typeof body.ecg === "number" ? body.ecg : void 0,
        heartRateBpm: typeof body.heartRateBpm === "number" ? body.heartRateBpm : typeof body.hr === "number" ? body.hr : void 0,
        delta: typeof body.delta === "number" ? body.delta : void 0,
        theta: typeof body.theta === "number" ? body.theta : void 0,
        alpha: typeof body.alpha === "number" ? body.alpha : void 0,
        beta: typeof body.beta === "number" ? body.beta : void 0,
        leadsOff: typeof body.leadsOff === "boolean" ? body.leadsOff : void 0,
        timestamp: now
      };
    }
    latestPacket = packet;
    packetCounter += 1;
    logTelemetryPacket(packet).catch(() => {
    });
    const message = `data: ${JSON.stringify(packet)}

`;
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
      subscribersNotified: sseClients.size
    });
  });
  app.get("/api/db/status", async (req, res) => {
    const status = await getDatabaseStatus();
    res.json(status);
  });
  app.get("/api/db/history", async (req, res) => {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const logs = await getRecentTelemetryLogs(limit);
    res.json({ count: logs.length, logs });
  });
  app.get("/api/telemetry/latest", (req, res) => {
    res.json({
      latestPacket,
      totalPackets: packetCounter,
      activeSubscribers: sseClients.size,
      serverTime: Date.now()
    });
  });
  app.get("/api/telemetry/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    sseClients.add(res);
    res.write(`data: ${JSON.stringify(latestPacket)}

`);
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}

`);
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 12e3);
    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Global Host EEG Telemetry Server running on http://0.0.0.0:${PORT}`);
    await initDatabase();
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
