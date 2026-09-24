import pg from 'pg';
const { Pool } = pg;

// Supabase PostgreSQL Pool Manager
let pool: pg.Pool | null = null;
let isInitialized = false;
let dbConnected = false;
let lastDbError: string | null = null;

// Throttling for high-frequency telemetry writes (save at most once every 1 second)
let lastLoggedTime = 0;

export function getDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL || 'postgresql://postgres:3AiwLsz-%25*nZXWc@db.jesbimexuxyhqdssgdvy.supabase.co:5432/postgres';
  
  // If the user provided URL with brackets around the password, e.g. [3AiwLsz-%*nZXWc]
  if (url.includes('[') && url.includes(']')) {
    url = url.replace(/\[(.*?)\]/, (_, pw) => encodeURIComponent(pw));
  } else if (url.includes('3AiwLsz-%*nZXWc')) {
    url = url.replace('3AiwLsz-%*nZXWc', '3AiwLsz-%25*nZXWc');
  }

  return url;
}

export async function initDatabase(): Promise<boolean> {
  const dbUrl = getDatabaseUrl();

  if (!dbUrl || dbUrl.includes('[YOUR-PASSWORD]')) {
    console.log('[Supabase DB] DATABASE_URL is not yet configured with a valid password. Running in in-memory mode.');
    dbConnected = false;
    lastDbError = !dbUrl ? 'DATABASE_URL not set in environment' : 'Password placeholder [YOUR-PASSWORD] needs to be replaced';
    return false;
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false, // Required for Supabase cloud PostgreSQL
      },
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log(`[Supabase DB] Successfully connected to Supabase PostgreSQL: ${result.rows[0]?.current_database} as ${result.rows[0]?.current_user}`);

    // Create tables if they do not exist
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
  } catch (err: any) {
    dbConnected = false;
    lastDbError = err.message || 'Failed to connect to Supabase PostgreSQL';
    console.warn('[Supabase DB] Connection warning:', lastDbError);
    return false;
  }
}

export async function logTelemetryPacket(packet: {
  ch1: number;
  ch2: number;
  ref: number;
  ecgMv?: number;
  heartRateBpm?: number;
  delta?: number;
  theta?: number;
  alpha?: number;
  beta?: number;
  battery?: number;
  leadsOff?: boolean;
  deviceId?: string;
}) {
  if (!dbConnected || !pool) return;

  const now = Date.now();
  // Sample every 1000ms to preserve Supabase storage & connection pool
  if (now - lastLoggedTime < 1000) {
    return;
  }
  lastLoggedTime = now;

  try {
    await pool.query(
      `INSERT INTO eeg_telemetry_logs 
      (device_id, ch1, ch2, ref, ecg_mv, heart_rate_bpm, delta, theta, alpha, beta, battery, leads_off)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        packet.deviceId || 'esp32-headband',
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
        packet.leadsOff ?? false,
      ]
    );
  } catch (err: any) {
    console.warn('[Supabase DB] Error inserting telemetry log:', err.message);
  }
}

export async function getRecentTelemetryLogs(limit = 50) {
  if (!dbConnected || !pool) return [];
  try {
    const res = await pool.query(
      `SELECT * FROM eeg_telemetry_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  } catch (err: any) {
    console.warn('[Supabase DB] Error fetching telemetry logs:', err.message);
    return [];
  }
}

export async function getDatabaseStatus() {
  const dbUrl = getDatabaseUrl();
  const isConfigured = Boolean(dbUrl && !dbUrl.includes('[YOUR-PASSWORD]'));

  if (!dbConnected && isConfigured) {
    await initDatabase();
  }

  let totalLogs = 0;
  if (dbConnected && pool) {
    try {
      const res = await pool.query('SELECT COUNT(*) as count FROM eeg_telemetry_logs');
      totalLogs = parseInt(res.rows[0]?.count || '0', 10);
    } catch {
      // Ignore count error
    }
  }

  return {
    configured: isConfigured,
    connected: dbConnected,
    host: 'db.jesbimexuxyhqdssgdvy.supabase.co',
    port: 5432,
    database: 'postgres',
    totalLogs,
    error: lastDbError,
  };
}
