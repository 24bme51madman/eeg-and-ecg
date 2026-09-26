import { FC, useState, useEffect } from 'react';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { ConnectionMode } from '../types';
import {
  Globe,
  Radio,
  Bluetooth,
  Terminal,
  Settings,
  X,
  Play,
  Square,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  Send,
  RefreshCw,
  Cpu,
  Download,
  Database,
  FileText,
  Activity,
} from 'lucide-react';
import { PATIENT_MODES } from '../data/patientModesData';

export const ConnectionStatusIndicator: FC<{ variant?: 'compact' | 'expanded' | 'banner' }> = ({
  variant = 'compact',
}) => {
  const {
    status,
    mode,
    endpoint,
    globalIngestUrl,
    latencyMs,
    packetsTotal,
    sampleRateHz,
    batteryLevel,
    isSimulated,
    electrodes,
    errorMessage,
    setMode,
    connect,
    disconnect,
    toggleSimulation,
    connectBluetooth,
    sendTestPacket,
    isModalOpen,
    setIsModalOpen,
    setIsDownloadModalOpen,
    patientModeId,
  } = useHardwareConnection();

  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cloud' | 'esp32_js' | 'esp32' | 'python' | 'curl' | 'localhost' | 'supabase'>('esp32_js');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    configured: boolean;
    connected: boolean;
    host: string;
    database: string;
    totalLogs: number;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    const fetchDbStatus = async () => {
      try {
        const res = await fetch('/api/db/status');
        if (res.ok) {
          const data = await res.json();
          setDbStatus(data);
        }
      } catch {
        // Ignore network polling error
      }
    };
    fetchDbStatus();
    const timer = setInterval(fetchDbStatus, 4000);
    return () => clearInterval(timer);
  }, [isModalOpen]);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendTestPacket = async () => {
    setSendingTest(true);
    setTestSuccess(false);
    const success = await sendTestPacket({
      ch1: parseFloat((10 + Math.random() * 20).toFixed(2)),
      ch2: parseFloat((-5 - Math.random() * 15).toFixed(2)),
      ref: 0.1,
    });
    setSendingTest(false);
    if (success) {
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 2500);
    }
  };

  // 1. Python Global Cloud Streamer
  const pythonCloudScript = `"""
KORTEX 3-ELECTRODE GLOBAL HOST TELEMETRY STREAMER
Streams biopotentials from your headband (Serial/USB/BLE) to the global web host.
Requirements: pip install requests pyserial
"""
import time
import serial
import requests

GLOBAL_INGEST_URL = "${globalIngestUrl}"
SERIAL_PORT = "/dev/ttyUSB0"  # Or "COM3" on Windows
BAUD_RATE = 115200

def main():
    print(f"Connecting to headband on {SERIAL_PORT}...")
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.1)
    print(f"Streaming biopotentials to Global Host: {GLOBAL_INGEST_URL}")

    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line:
            # Expected format from headband: fp1,fp2,ref (e.g. "14.2,-8.5,0.1")
            parts = line.split(',')
            if len(parts) >= 3:
                payload = {
                    "ch1": float(parts[0]),     # Electrode 1: Fp1
                    "ch2": float(parts[1]),     # Electrode 2: Fp2
                    "ref": float(parts[2]),     # Electrode 3: REF/GND
                    "battery": 92,
                    "deviceId": "headband-kortex-01",
                    "impedance": [6.8, 7.2, 4.2]
                }
                try:
                    requests.post(GLOBAL_INGEST_URL, json=payload, timeout=0.5)
                except Exception as e:
                    print("Network error:", e)
        time.sleep(0.008) # ~125 Hz stream

if __name__ == '__main__':
    main()`;

  // 2. ESP32 Arduino C++ WiFi Streamer
  const esp32Script = `/**
 * ESP32 3-Electrode Headband WiFi -> Global Host Streamer
 * Connects directly to WiFi and streams biopotentials to the Global Host
 */
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* globalIngestUrl = "${globalIngestUrl}";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! Streaming to Global Host.");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(globalIngestUrl);
    http.addHeader("Content-Type", "application/json");

    // Read ADC channels for Fp1, Fp2, and Reference
    float ch1 = (analogRead(34) - 2048) * 0.05; // Fp1 microvolts
    float ch2 = (analogRead(35) - 2048) * 0.05; // Fp2 microvolts
    float ref = (analogRead(32) - 2048) * 0.01; // Reference

    String json = "{\\"ch1\\":" + String(ch1) + 
                  ",\\"ch2\\":" + String(ch2) + 
                  ",\\"ref\\":" + String(ref) + 
                  ",\\"battery\\":89,\\"deviceId\\":\\"esp32-headband\\"}";

    http.POST(json);
    http.end();
  }
  delay(10); // 100 Hz
}`;

  // 3. cURL Command for instant terminal testing
  const curlCommand = `curl -X POST "${globalIngestUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"ch1": 18.5, "ch2": -9.2, "ref": 0.1, "battery": 95, "deviceId": "terminal-test"}'`;

  // 4. Localhost WebSocket Bridge script
  const localhostScript = `"""
Localhost WebSocket Bridge fallback (ws://localhost:8765)
Requirements: pip install websockets pyserial
"""
import asyncio, json, serial, websockets

async def stream_headband(websocket):
    ser = serial.Serial('/dev/ttyUSB0', 115200, timeout=0.1)
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line:
            parts = line.split(',')
            if len(parts) >= 3:
                packet = {"ch1": float(parts[0]), "ch2": float(parts[1]), "ref": float(parts[2]), "battery": 90}
                await websocket.send(json.dumps(packet))
        await asyncio.sleep(0.004)

async def main():
    async with websockets.serve(stream_headband, "localhost", 8765):
        print("Localhost bridge running on ws://localhost:8765")
        await asyncio.Future()

asyncio.run(main())`;

  // 5. ESP32 Direct Hardware Polling JS (Requested user snippet)
  const esp32JsScript = `async function getHardwareData() {
  try {
    const response = await fetch('http://192.168.4.1/data');
    const data = await response.json();
    
    // idhu ungal data — idha vecha UI update pannunga
    console.log(data.delta, data.theta, data.alpha, data.beta, data.raw, data.leadsOff);
    
    // example: ungal website-la oru element irundha
    // document.getElementById('deltaValue').innerText = data.delta;
    
  } catch (error) {
    console.log('Device not reachable:', error);
  }
}

// every 400ms data eduthukanum na:
setInterval(getHardwareData, 400);
getHardwareData(); // page load aana udane once run pannu`;

  // 6. Supabase PostgreSQL Cloud Database Integration
  const supabaseSnippet = `-- 1. Run this SQL in your Supabase SQL Editor:
-- (Project: db.jesbimexuxyhqdssgdvy.supabase.co)

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

-- 2. Set this in your server environment or .env:
-- Replace [YOUR-PASSWORD] with your actual Supabase database password
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.jesbimexuxyhqdssgdvy.supabase.co:5432/postgres`;

  // Compact variant for Header Masthead
  if (variant === 'compact') {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-[#D96514] ${
              status === 'connected'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                : status === 'connecting'
                  ? 'border-[#D96514] bg-amber-50 text-[#D96514]'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
            title="Click to configure Global Host telemetry connection"
          >
            {/* Status dot */}
            <span
              className={`h-2 w-2 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-600 animate-pulse'
                  : status === 'connecting'
                    ? 'bg-[#D96514] animate-ping'
                    : 'bg-neutral-400'
              }`}
            />

            <span className="font-semibold">
              {status === 'connected'
                ? mode === 'global'
                  ? 'GLOBAL HOST: LINKED'
                  : 'HEADBAND: LINKED'
                : status === 'connecting'
                  ? 'CONNECTING CLOUD...'
                  : 'GLOBAL HOST: OFFLINE'}
            </span>

            {status === 'connected' && (
              <span className="hidden sm:inline font-normal text-[11px] opacity-80">
                ({packetsTotal} pkts | {latencyMs}ms)
              </span>
            )}
          </button>
        </div>

        {/* Global Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-neutral-300 bg-[#FAF9F5] p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#D96514]" />
                  <div>
                    <h3 className="font-mono text-sm font-bold text-[#141517]">
                      GLOBAL HOST TELEMETRY ARCHITECTURE
                    </h3>
                    <p className="font-mono text-[11px] text-neutral-600">
                      Cloud Ingestion &amp; Worldwide Real-Time 3-Electrode Stream
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-neutral-500 hover:text-[#141517]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Connection Mode Selector */}
              <div className="mt-4">
                <label className="block font-mono text-xs font-semibold text-[#141517] mb-2">
                  TELEMETRY ACQUISITION MODE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('global')}
                    className={`p-2.5 border text-left flex flex-col justify-between transition-colors ${
                      mode === 'global'
                        ? 'border-[#D96514] bg-white ring-1 ring-[#D96514]'
                        : 'border-neutral-300 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#141517]">Global Cloud</span>
                      <Globe className="h-3.5 w-3.5 text-[#D96514]" />
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">REST API + SSE Stream (Worldwide)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => connectBluetooth()}
                    className={`p-2.5 border text-left flex flex-col justify-between transition-colors ${
                      mode === 'bluetooth'
                        ? 'border-[#D96514] bg-white ring-1 ring-[#D96514]'
                        : 'border-neutral-300 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#141517]">Web Bluetooth</span>
                      <Bluetooth className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">Direct BLE Browser Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('localhost')}
                    className={`p-2.5 border text-left flex flex-col justify-between transition-colors ${
                      mode === 'localhost'
                        ? 'border-[#D96514] bg-white ring-1 ring-[#D96514]'
                        : 'border-neutral-300 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#141517]">Localhost Bridge</span>
                      <Radio className="h-3.5 w-3.5 text-neutral-700" />
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">ws://localhost:8765</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('esp32_ap')}
                    className={`p-2.5 border text-left flex flex-col justify-between transition-colors ${
                      mode === 'esp32_ap'
                        ? 'border-[#D96514] bg-white ring-1 ring-[#D96514]'
                        : 'border-neutral-300 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#141517]">ESP32 SoftAP</span>
                      <Radio className="h-3.5 w-3.5 text-[#D96514]" />
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">192.168.4.1/data (400ms)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('simulator')}
                    className={`p-2.5 border text-left flex flex-col justify-between transition-colors ${
                      mode === 'simulator'
                        ? 'border-[#D96514] bg-white ring-1 ring-[#D96514]'
                        : 'border-neutral-300 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#141517]">Bench Sim</span>
                      <Cpu className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">Synthetic Generator</span>
                  </button>
                </div>
              </div>

              {/* Global Ingestion URL & Live Stream Bar */}
              <div className="mt-4 border border-neutral-300 bg-white p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#141517]">
                      GLOBAL INGESTION ENDPOINT (PUBLIC HTTP POST)
                    </span>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Send continuous JSON packets from any headband anywhere in the world:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendTestPacket}
                      disabled={sendingTest}
                      className="inline-flex items-center gap-1.5 border border-[#141517] bg-[#141517] px-3 py-1.5 font-mono text-xs font-semibold text-white hover:bg-[#D96514] hover:border-[#D96514] disabled:opacity-50"
                    >
                      {sendingTest ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      <span>{testSuccess ? 'PACKET INGESTED!' : 'PUSH TEST PACKET'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={globalIngestUrl}
                    className="flex-1 border border-neutral-300 bg-[#FAF9F5] px-3 py-2 font-mono text-xs text-[#141517] select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyCode(globalIngestUrl, 'url')}
                    className="inline-flex items-center gap-1 border border-neutral-300 bg-white px-3 py-2 font-mono text-xs text-neutral-700 hover:bg-neutral-50"
                  >
                    {copied === 'url' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied === 'url' ? 'COPIED' : 'COPY URL'}</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="mt-3 flex items-start gap-1.5 font-mono text-[11px] text-red-700 border border-red-200 bg-red-50 p-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Stream Telemetry Metrics */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs border-t border-neutral-200 pt-3">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">HOST MODE</span>
                    <strong className="text-[#141517] uppercase">{mode}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">STREAM LATENCY</span>
                    <strong className="text-[#141517]">{latencyMs} ms</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">PACKETS STREAMED</span>
                    <strong className="text-[#141517]">{packetsTotal.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">BATTERY TELEMETRY</span>
                    <strong className="text-[#141517]">{batteryLevel}%</strong>
                  </div>
                </div>
              </div>

              {/* 3-Electrode Impedance Grid */}
              <div className="mt-4 border border-neutral-300 bg-white p-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="font-mono text-xs font-bold text-[#141517]">
                    3-ELECTRODE TRANSDUCER COUPLING (FP1, FP2, REF)
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">REAL-TIME HARDWARE IMPEDANCE</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 font-mono text-xs">
                  {electrodes.map((el) => (
                    <div key={el.id} className="border border-neutral-200 bg-[#FAF9F5] p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#141517]">{el.code} // {el.channel}</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      </div>
                      <div className="mt-1 text-[11px] text-neutral-600">{el.label}</div>
                      <div className="mt-2 text-xs">
                        <span className="text-neutral-500">IMPEDANCE: </span>
                        <strong className="text-[#141517]">
                          {status === 'connected' ? `${el.impedanceKOhms} kΩ` : '--'}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supabase Cloud PostgreSQL Database Status */}
              <div className="mt-4 border border-neutral-300 bg-white p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-600" />
                    <span className="font-mono text-xs font-bold text-[#141517]">
                      SUPABASE POSTGRESQL CLOUD PERSISTENCE
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-semibold border ${
                      dbStatus?.connected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : dbStatus?.configured
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-neutral-300 bg-neutral-100 text-neutral-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        dbStatus?.connected
                          ? 'bg-emerald-600 animate-pulse'
                          : dbStatus?.configured
                            ? 'bg-amber-500'
                            : 'bg-neutral-400'
                      }`} />
                      {dbStatus?.connected
                        ? 'DATABASE CONNECTED & LIVE'
                        : dbStatus?.configured
                          ? 'CONNECTING TO SUPABASE...'
                          : 'DATABASE DISCONNECTED'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">HOST</span>
                    <strong className="text-[#141517] truncate block text-[11px]" title="db.jesbimexuxyhqdssgdvy.supabase.co">
                      db.jesbimexuxyhqdssgdvy
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">DATABASE</span>
                    <strong className="text-[#141517]">postgres (SSL)</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">TELEMETRY LOGS SAVED</span>
                    <strong className="text-emerald-700 font-bold">
                      {dbStatus?.totalLogs ?? 0} records
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">TABLE TARGET</span>
                    <span className="text-neutral-700 text-[11px] block">eeg_telemetry_logs</span>
                  </div>
                </div>
              </div>

              {/* Code Snippets for Global Streaming */}
              <div className="mt-4 border border-neutral-300 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                  <span className="font-mono text-xs font-bold text-[#141517]">
                    GLOBAL STREAMING SNIPPETS (HARDWARE LINK)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('esp32_js')}
                      className={`font-mono text-[11px] px-2 py-0.5 border ${
                        activeTab === 'esp32_js'
                          ? 'border-[#D96514] bg-[#D96514] text-white font-semibold'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      JS Poller (192.168.4.1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cloud')}
                      className={`font-mono text-[11px] px-2 py-0.5 border ${
                        activeTab === 'cloud'
                          ? 'border-[#141517] bg-[#141517] text-white'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      Python Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('esp32')}
                      className={`font-mono text-[11px] px-2 py-0.5 border ${
                        activeTab === 'esp32'
                          ? 'border-[#141517] bg-[#141517] text-white'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      ESP32 WiFi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('curl')}
                      className={`font-mono text-[11px] px-2 py-0.5 border ${
                        activeTab === 'curl'
                          ? 'border-[#141517] bg-[#141517] text-white'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      cURL Test
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('localhost')}
                      className={`font-mono text-[11px] px-2 py-0.5 border ${
                        activeTab === 'localhost'
                          ? 'border-[#141517] bg-[#141517] text-white'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      Localhost WS
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('supabase')}
                      className={`font-mono text-[11px] px-2 py-0.5 border ${
                        activeTab === 'supabase'
                          ? 'border-emerald-600 bg-emerald-600 text-white font-semibold'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      Supabase DB
                    </button>
                  </div>
                </div>

                <div className="relative mt-2">
                  <pre className="max-h-48 overflow-y-auto bg-[#141517] p-3 font-mono text-[10.5px] leading-relaxed text-neutral-200">
                    {activeTab === 'esp32_js' && esp32JsScript}
                    {activeTab === 'cloud' && pythonCloudScript}
                    {activeTab === 'esp32' && esp32Script}
                    {activeTab === 'curl' && curlCommand}
                    {activeTab === 'localhost' && localhostScript}
                    {activeTab === 'supabase' && supabaseSnippet}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      const text =
                        activeTab === 'esp32_js'
                          ? esp32JsScript
                          : activeTab === 'cloud'
                            ? pythonCloudScript
                            : activeTab === 'esp32'
                              ? esp32Script
                              : activeTab === 'curl'
                                ? curlCommand
                                : activeTab === 'supabase'
                                  ? supabaseSnippet
                                  : localhostScript;
                      handleCopyCode(text, 'snippet');
                    }}
                    className="absolute top-2 right-2 flex items-center gap-1 border border-neutral-600 bg-neutral-800 px-2 py-1 font-mono text-[10px] text-white hover:bg-neutral-700"
                  >
                    {copied === 'snippet' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied === 'snippet' ? 'COPIED' : 'COPY CODE'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Expanded banner variant for top of Hero / Oscilloscope panel
  return (
    <div className="w-full border border-neutral-300 bg-[#EFECE5] p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Connection status and live state badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-600 animate-pulse'
                  : status === 'connecting'
                    ? 'bg-[#D96514] animate-ping'
                    : 'bg-neutral-400'
              }`}
            />
            <span className="font-mono text-xs font-bold tracking-tight text-[#141517]">
              GLOBAL HOST LINK:
            </span>
            <span
              className={`font-mono text-xs font-semibold px-2 py-0.5 border ${
                status === 'connected'
                  ? 'border-emerald-600 bg-emerald-100 text-emerald-950'
                  : status === 'connecting'
                    ? 'border-[#D96514] bg-orange-100 text-[#D96514]'
                    : 'border-neutral-300 bg-white text-neutral-700'
              }`}
            >
              {status === 'connected'
                ? mode === 'global'
                  ? 'ONLINE // CLOUD INGESTION ACTIVE'
                  : 'ONLINE // 3-ELECTRODE TRANSDUCER ACTIVE'
                : status === 'connecting'
                  ? 'CONNECTING TO GLOBAL STREAM...'
                  : 'OFFLINE // READY'}
            </span>
          </div>

          <div className="hidden items-center gap-2 font-mono text-[11px] text-neutral-600 sm:flex">
            <span>INGEST: <strong className="text-[#141517]">{globalIngestUrl}</strong></span>
            <span>|</span>
            <span>LATENCY: <strong>{status === 'connected' ? `${latencyMs}ms` : '--'}</strong></span>
            <span>|</span>
            <span>PACKETS: <strong>{packetsTotal.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* 3-Electrode Status Mini Badges */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1 border border-neutral-300 bg-white px-2 py-1">
            <span className="font-bold text-[#141517]">E1 [Fp1]:</span>
            <span className={status === 'connected' ? 'text-emerald-700 font-semibold' : 'text-neutral-500'}>
              {status === 'connected' ? `${electrodes[0].impedanceKOhms}kΩ` : '--'}
            </span>
          </div>

          <div className="flex items-center gap-1 border border-neutral-300 bg-white px-2 py-1">
            <span className="font-bold text-[#141517]">E2 [Fp2]:</span>
            <span className={status === 'connected' ? 'text-emerald-700 font-semibold' : 'text-neutral-500'}>
              {status === 'connected' ? `${electrodes[1].impedanceKOhms}kΩ` : '--'}
            </span>
          </div>

          <div className="flex items-center gap-1 border border-neutral-300 bg-white px-2 py-1">
            <span className="font-bold text-[#141517]">E3 [REF]:</span>
            <span className={status === 'connected' ? 'text-emerald-700 font-semibold' : 'text-neutral-500'}>
              {status === 'connected' ? `${electrodes[2].impedanceKOhms}kΩ` : '--'}
            </span>
          </div>

          {/* Quick Condition Selector Jump */}
          <a
            id="banner-jump-condition-btn"
            href="#standalone-physio-selector"
            className="flex items-center gap-1 border border-[#141517] bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#141517] hover:border-[#D96514] hover:text-[#D96514] transition-colors"
            title="Jump to Standalone Physiological Pattern & Condition Selector"
          >
            <Activity className="h-3.5 w-3.5 text-[#D96514]" />
            <span>MODE #{patientModeId}: {PATIENT_MODES[patientModeId]?.name.split('(')[0].trim() || 'Healthy'} ↓</span>
          </a>

          {/* Quick push test packet */}
          <button
            type="button"
            onClick={handleSendTestPacket}
            disabled={sendingTest}
            className="border border-[#141517] bg-[#141517] px-2.5 py-1 font-mono text-xs font-semibold text-white hover:bg-[#D96514] hover:border-[#D96514] disabled:opacity-50"
            title="Push a test 3-electrode biopotential packet to the Global Ingestion API"
          >
            {sendingTest ? 'SENDING...' : testSuccess ? '✓ RECEIVED' : 'PUSH TEST PKT'}
          </button>

          <button
            id="banner-export-report-btn"
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="border border-[#D96514] bg-white px-2.5 py-1 font-mono text-xs font-semibold text-[#D96514] hover:bg-[#D96514] hover:text-white transition-colors flex items-center gap-1"
            title="Generate Clinical Health Report (Stress, Load, Affect, Condition & One-Liner)"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>CLINICAL REPORT</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="border border-neutral-400 bg-white px-2 py-1 font-mono text-xs font-medium text-neutral-800 hover:bg-neutral-100 flex items-center gap-1"
            title="Configure Global Host, ESP32, Python, or Bluetooth link"
          >
            <Settings className="h-3.5 w-3.5 text-neutral-600" />
            <span>GLOBAL LINK SETUP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
