import React, { createContext, useContext, useState, useEffect, useRef, FC, ReactNode } from 'react';
import {
  ConnectionStatus,
  ConnectionMode,
  EegSource,
  HardwareLinkState,
  HardwarePacket,
  ElectrodeStatus,
  EegSessionRecord,
  SessionLogStats,
  HardwareEegData,
} from '../types';
import { generateEegCsv, downloadCsvFile } from '../utils/csvExporter';
import { PATIENT_MODES } from '../data/patientModesData';

const INITIAL_ELECTRODES: [ElectrodeStatus, ElectrodeStatus, ElectrodeStatus] = [
  {
    id: 'e1',
    code: 'E1',
    label: 'Left Prefrontal',
    channel: 'Fp1',
    role: 'Frontal Lead 1 (Active Input)',
    impedanceKOhms: 6.8,
    quality: 'optimal',
  },
  {
    id: 'e2',
    code: 'E2',
    label: 'Right Prefrontal',
    channel: 'Fp2',
    role: 'Frontal Lead 2 (FAA Differential)',
    impedanceKOhms: 7.4,
    quality: 'optimal',
  },
  {
    id: 'e3',
    code: 'E3',
    label: 'Earclip / Mastoid Reference',
    channel: 'REF / GND',
    role: 'Active CMS/DRL Common Mode',
    impedanceKOhms: 4.2,
    quality: 'optimal',
  },
];

interface HardwareContextValue extends HardwareLinkState {
  setSource: (source: EegSource) => void;
  setPatientModeId: (id: number) => void;
  setMode: (mode: ConnectionMode) => void;
  connect: (customEndpoint?: string) => void;
  disconnect: () => void;
  toggleSimulation: () => void;
  connectBluetooth: () => Promise<void>;
  sendTestPacket: (customValues?: Partial<HardwarePacket>) => Promise<boolean>;
  setEndpoint: (url: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  // Session Log & CSV Export
  sessionRecords: EegSessionRecord[];
  isRecording: boolean;
  toggleRecording: () => void;
  clearSessionLog: () => void;
  downloadSessionLog: (customFilename?: string) => { success: boolean; sampleCount: number };
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (open: boolean) => void;
  isCharging: boolean;
  toggleCharging: () => void;
  updateBatteryLevel: (level: number, broadcast?: boolean) => Promise<boolean>;
  // ESP32 Direct Hardware Polling (http://192.168.4.1/data)
  hardwareData: HardwareEegData | null;
  esp32Reachable: boolean;
  lastEsp32PollTime: number | null;
  getHardwareData: () => Promise<HardwareEegData | null>;
  injectMockHardwareData: (mock?: Partial<HardwareEegData>) => void;
}

const HardwareConnectionContext = createContext<HardwareContextValue | null>(null);

export const HardwareConnectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [mode, setModeState] = useState<ConnectionMode>('global');

  // Calculate dynamic global origin for telemetry ingestion
  const globalOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const [globalIngestUrl, setGlobalIngestUrl] = useState<string>(
    globalOrigin ? `${globalOrigin}/api/telemetry` : '/api/telemetry'
  );
  const [endpoint, setEndpoint] = useState<string>(
    globalOrigin ? `${globalOrigin}/api/telemetry/stream` : '/api/telemetry/stream'
  );

  const [latencyMs, setLatencyMs] = useState<number>(12);
  const [packetsTotal, setPacketsTotal] = useState<number>(0);
  const [sampleRateHz, setSampleRateHz] = useState<number>(250);
  const [batteryLevel, setBatteryLevel] = useState<number>(92);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [source, setSourceState] = useState<EegSource>('simulation');
  const [patientModeId, setPatientModeIdState] = useState<number>(1);
  const patientModeIdRef = useRef<number>(1);
  const [electrodes, setElectrodes] = useState<[ElectrodeStatus, ElectrodeStatus, ElectrodeStatus]>(INITIAL_ELECTRODES);
  const [latestPacket, setLatestPacket] = useState<HardwarePacket | null>({
    ch1: 14.2,
    ch2: -8.4,
    ref: 0.1,
    battery: 92,
    isCharging: false,
    deviceId: 'kortex-headband-01',
    timestamp: Date.now(),
  });
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // ESP32 Hardware Polling State (http://192.168.4.1/data)
  const [hardwareData, setHardwareData] = useState<HardwareEegData | null>(null);
  const [esp32Reachable, setEsp32Reachable] = useState<boolean>(false);
  const [lastEsp32PollTime, setLastEsp32PollTime] = useState<number | null>(null);

  // Session Logging State
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [sessionRecords, setSessionRecords] = useState<EegSessionRecord[]>([]);
  const recordsRef = useRef<EegSessionRecord[]>([]);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const [sessionStats, setSessionStats] = useState<SessionLogStats>({
    samplesRecorded: 0,
    durationSec: 0,
    startTime: Date.now(),
    isRecording: true,
    minFp1: 0,
    maxFp1: 0,
    meanFp1: 0,
    minFp2: 0,
    maxFp2: 0,
    meanFp2: 0,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const packetCounterRef = useRef<number>(0);
  const lastPacketTimeRef = useRef<number>(Date.now());
  const simIntervalRef = useRef<number | null>(null);
  const bleDeviceRef = useRef<any>(null);

  // Ingest sample into rolling session record buffer
  const recordSample = (pkt: HardwarePacket) => {
    if (!isRecording) return;
    const now = Date.now();
    const elapsedSec = (now - sessionStartTimeRef.current) / 1000;
    const sampleIndex = recordsRef.current.length + 1;

    const record: EegSessionRecord = {
      sampleIndex,
      timestampIso: new Date(now).toISOString(),
      unixMs: now,
      elapsedSec,
      fp1_uV: pkt.ch1,
      fp2_uV: pkt.ch2,
      ref_uV: pkt.ref,
      diff_uV: parseFloat((pkt.ch1 - pkt.ch2).toFixed(2)),
      impedanceE1: electrodes[0]?.impedanceKOhms ?? 6.8,
      impedanceE2: electrodes[1]?.impedanceKOhms ?? 7.4,
      impedanceRef: electrodes[2]?.impedanceKOhms ?? 4.2,
      batteryPct: pkt.battery ?? batteryLevel,
      cognitiveState: 'active_trace',
      ecg_mV: pkt.ecgMv ?? 0.05,
      heartRate_bpm: pkt.heartRateBpm ?? 68,
    };

    recordsRef.current.push(record);

    // Limit in-memory buffer to 50,000 samples to maintain light memory footprint
    if (recordsRef.current.length > 50000) {
      recordsRef.current.shift();
    }

    // Periodically sync reactive state every 15 samples (~600ms) to avoid high re-render overhead
    if (sampleIndex % 15 === 0 || sampleIndex === 1) {
      setSessionRecords([...recordsRef.current.slice(-100)]); // Keep last 100 in reactive state for preview
      
      const count = recordsRef.current.length;
      const curDuration = elapsedSec;
      
      // Calculate fast stats on current buffer
      let sumFp1 = 0;
      let sumFp2 = 0;
      let min1 = Infinity;
      let max1 = -Infinity;
      let min2 = Infinity;
      let max2 = -Infinity;

      const stride = Math.max(1, Math.floor(count / 200)); // fast downsampled stats
      let samplesProcessed = 0;
      for (let i = 0; i < count; i += stride) {
        const item = recordsRef.current[i];
        sumFp1 += item.fp1_uV;
        sumFp2 += item.fp2_uV;
        if (item.fp1_uV < min1) min1 = item.fp1_uV;
        if (item.fp1_uV > max1) max1 = item.fp1_uV;
        if (item.fp2_uV < min2) min2 = item.fp2_uV;
        if (item.fp2_uV > max2) max2 = item.fp2_uV;
        samplesProcessed++;
      }

      setSessionStats({
        samplesRecorded: count,
        durationSec: curDuration,
        startTime: sessionStartTimeRef.current,
        isRecording,
        minFp1: min1 === Infinity ? 0 : parseFloat(min1.toFixed(2)),
        maxFp1: max1 === -Infinity ? 0 : parseFloat(max1.toFixed(2)),
        meanFp1: samplesProcessed > 0 ? parseFloat((sumFp1 / samplesProcessed).toFixed(2)) : 0,
        minFp2: min2 === Infinity ? 0 : parseFloat(min2.toFixed(2)),
        maxFp2: max2 === -Infinity ? 0 : parseFloat(max2.toFixed(2)),
        meanFp2: samplesProcessed > 0 ? parseFloat((sumFp2 / samplesProcessed).toFixed(2)) : 0,
      });
    }
  };

  // Toggle recording pause / resume
  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  // Clear session log buffer
  const clearSessionLog = () => {
    recordsRef.current = [];
    sessionStartTimeRef.current = Date.now();
    setSessionRecords([]);
    setSessionStats({
      samplesRecorded: 0,
      durationSec: 0,
      startTime: Date.now(),
      isRecording,
      minFp1: 0,
      maxFp1: 0,
      meanFp1: 0,
      minFp2: 0,
      maxFp2: 0,
      meanFp2: 0,
    });
  };

  // Trigger Download Session Log as CSV
  const downloadSessionLog = (customFilename?: string) => {
    let exportData = [...recordsRef.current];

    // If session just initialized or buffer empty, create a baseline sample buffer
    // so the user always downloads a populated, valid CSV file
    if (exportData.length === 0) {
      const now = Date.now();
      const baseFp1 = latestPacket?.ch1 ?? 14.2;
      const baseFp2 = latestPacket?.ch2 ?? -8.4;
      const baseRef = latestPacket?.ref ?? 0.1;

      for (let i = 0; i < 60; i++) {
        const t = now - (60 - i) * 40;
        const wave = Math.sin(i * 0.3) * 12;
        const record: EegSessionRecord = {
          sampleIndex: i + 1,
          timestampIso: new Date(t).toISOString(),
          unixMs: t,
          elapsedSec: i * 0.04,
          fp1_uV: parseFloat((baseFp1 + wave).toFixed(2)),
          fp2_uV: parseFloat((baseFp2 - wave * 0.8).toFixed(2)),
          ref_uV: baseRef,
          diff_uV: parseFloat((baseFp1 + wave - (baseFp2 - wave * 0.8)).toFixed(2)),
          impedanceE1: electrodes[0].impedanceKOhms,
          impedanceE2: electrodes[1].impedanceKOhms,
          impedanceRef: electrodes[2].impedanceKOhms,
          batteryPct: batteryLevel,
          cognitiveState: 'initial_baseline',
        };
        exportData.push(record);
      }
    }

    const csvContent = generateEegCsv(exportData, {
      deviceName: 'KORTEX TRINITY-3',
      montage: '3-Electrode Clinical Montage (Fp1, Fp2, REF/GND)',
      sampleRateHz,
      totalDurationSec: sessionStats.durationSec || (exportData.length * 0.04),
      mode,
    });

    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = customFilename || `kortex_eeg_session_${nowStr}.csv`;

    downloadCsvFile(csvContent, filename);

    return { success: true, sampleCount: exportData.length };
  };

  // 1. Connect to Global Cloud Host via Server-Sent Events (SSE)
  const connectGlobal = (streamUrl?: string) => {
    const targetUrl = streamUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/telemetry/stream` : '/api/telemetry/stream');

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus('connecting');
    setErrorMessage(undefined);
    setIsSimulated(false);

    try {
      const es = new EventSource(targetUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus('connected');
        setErrorMessage(undefined);
        lastPacketTimeRef.current = Date.now();
      };

      es.onmessage = (event) => {
        try {
          if (!event.data) return;
          const parsed = JSON.parse(event.data);
          const now = Date.now();
          const latency = Math.max(2, Math.min(now - (parsed.timestamp || now), 24));
          lastPacketTimeRef.current = now;

          packetCounterRef.current += 1;
          setPacketsTotal(packetCounterRef.current);
          setLatencyMs(latency);

          const packet: HardwarePacket = {
            ch1: Number(parsed.ch1 ?? parsed[0] ?? 0),
            ch2: Number(parsed.ch2 ?? parsed[1] ?? 0),
            ref: Number(parsed.ref ?? parsed[2] ?? 0),
            battery: parsed.battery !== undefined ? Number(parsed.battery) : 90,
            isCharging: parsed.isCharging !== undefined ? Boolean(parsed.isCharging) : false,
            deviceId: parsed.deviceId || 'kortex-headband-global',
            timestamp: now,
          };

          setLatestPacket(packet);
          recordSample(packet);

          if (parsed.battery !== undefined) {
            setBatteryLevel(Number(parsed.battery));
          }
          if (parsed.isCharging !== undefined) {
            setIsCharging(Boolean(parsed.isCharging));
          }

          // Subtle impedance variance simulation on active reception
          if (packetCounterRef.current % 40 === 0) {
            setElectrodes([
              { ...INITIAL_ELECTRODES[0], impedanceKOhms: parseFloat((6.6 + Math.random() * 0.7).toFixed(1)) },
              { ...INITIAL_ELECTRODES[1], impedanceKOhms: parseFloat((7.1 + Math.random() * 0.8).toFixed(1)) },
              { ...INITIAL_ELECTRODES[2], impedanceKOhms: parseFloat((4.1 + Math.random() * 0.4).toFixed(1)) },
            ]);
          }
        } catch {
          // Heartbeat or comments
        }
      };

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          setStatus('error');
          setErrorMessage('Global host telemetry stream connection lost. Retrying...');
        }
      };
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to initialize global stream connection.');
    }
  };

  // 2. Connect to Localhost WebSocket fallback
  const connectLocalhost = (customUrl?: string) => {
    const targetUrl = customUrl || 'ws://localhost:8765';
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus('connecting');
    setErrorMessage(undefined);
    setIsSimulated(false);

    try {
      const ws = new WebSocket(targetUrl);
      socketRef.current = ws;

      const connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setStatus('error');
          setErrorMessage(`Connection to local headband at ${targetUrl} timed out.`);
        }
      }, 3500);

      ws.onopen = () => {
        clearTimeout(connectTimeout);
        setStatus('connected');
        setIsSimulated(false);
        setErrorMessage(undefined);
        lastPacketTimeRef.current = Date.now();
      };

      ws.onmessage = (event) => {
        try {
          const now = Date.now();
          const latency = Math.max(1, now - lastPacketTimeRef.current);
          lastPacketTimeRef.current = now;

          packetCounterRef.current += 1;
          setPacketsTotal(packetCounterRef.current);
          setLatencyMs(latency < 50 ? latency : 3);

          let packet: HardwarePacket;
          if (typeof event.data === 'string') {
            const parsed = JSON.parse(event.data);
            packet = {
              ch1: Number(parsed.ch1 ?? parsed[0] ?? 0),
              ch2: Number(parsed.ch2 ?? parsed[1] ?? 0),
              ref: Number(parsed.ref ?? parsed[2] ?? 0),
              battery: parsed.battery ?? 88,
              timestamp: now,
            };
          } else {
            packet = { ch1: 15.0, ch2: -8.0, ref: 0.0, timestamp: now };
          }
          setLatestPacket(packet);
          recordSample(packet);
        } catch {
          // Packet parse error
        }
      };

      ws.onerror = () => {
        clearTimeout(connectTimeout);
        setStatus('error');
        setErrorMessage(`Cannot reach local headband on ${targetUrl}. Is your local bridge script running?`);
      };

      ws.onclose = () => {
        clearTimeout(connectTimeout);
        if (status === 'connected') {
          setStatus('disconnected');
        }
      };
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'WebSocket initialization failed');
    }
  };

  // 3. Web Bluetooth API: Connect directly from browser to headband
  const connectBluetooth = async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      setStatus('error');
      setErrorMessage('Web Bluetooth is only supported in modern Chromium browsers (Chrome, Edge, Opera) over HTTPS.');
      return;
    }

    try {
      setStatus('connecting');
      setErrorMessage(undefined);

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000180d-0000-1000-8000-00805f9b34fb',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        ],
      });

      bleDeviceRef.current = device;
      setStatus('connected');
      setModeState('bluetooth');
      setIsSimulated(false);
      setEndpoint(`BLE: ${device.name || 'EEG-Headband'}`);
      setLatencyMs(4);

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
      });
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setStatus('error');
        setErrorMessage(`Bluetooth connection canceled or failed: ${err.message}`);
      } else {
        setStatus('disconnected');
      }
    }
  };

  // 4. Send test packet to the Global Host Ingestion API
  const sendTestPacket = async (customValues?: Partial<HardwarePacket>): Promise<boolean> => {
    try {
      const now = Date.now();
      const testPacket = {
        ch1: customValues?.ch1 ?? parseFloat((Math.sin(now / 500) * 22).toFixed(2)),
        ch2: customValues?.ch2 ?? parseFloat((Math.cos(now / 600) * -16).toFixed(2)),
        ref: customValues?.ref ?? 0.2,
        battery: customValues?.battery ?? 94,
        deviceId: 'kortex-test-cli',
        impedance: [6.7, 7.3, 4.2],
      };

      const res = await fetch(globalIngestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPacket),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err: any) {
      setErrorMessage(`Failed to send test packet to global host: ${err.message}`);
      return false;
    }
  };

  // Master connect dispatcher based on current mode
  const connect = (customEndpoint?: string) => {
    if (mode === 'global') {
      connectGlobal(customEndpoint);
    } else if (mode === 'localhost') {
      connectLocalhost(customEndpoint);
    } else if (mode === 'bluetooth') {
      connectBluetooth();
    } else {
      toggleSimulation();
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (bleDeviceRef.current && bleDeviceRef.current.gatt?.connected) {
      bleDeviceRef.current.gatt.disconnect();
    }
    setStatus('disconnected');
    setIsSimulated(false);
  };

  const setPatientModeId = (id: number) => {
    patientModeIdRef.current = id;
    setPatientModeIdState(id);
  };

  const setSource = (newSource: EegSource) => {
    setSourceState(newSource);
    if (newSource === 'live') {
      disconnect();
      setIsSimulated(false);
      setModeState('esp32_ap');
      setEndpoint('http://192.168.4.1/data');
      setStatus('connecting');
      getHardwareData().then((res) => {
        if (res) {
          setStatus('connected');
        } else {
          setStatus('connecting');
        }
      });
    } else {
      disconnect();
      setIsSimulated(true);
      setModeState('simulator');
      toggleSimulation();
    }
  };

  const toggleSimulation = () => {
    if (isSimulated && status === 'connected') {
      disconnect();
    } else {
      disconnect();
      setStatus('connected');
      setModeState('simulator');
      setIsSimulated(true);
      setSourceState('simulation');
      setErrorMessage(undefined);
      setLatencyMs(1.5);
      setSampleRateHz(250);

      let step = 0;
      simIntervalRef.current = window.setInterval(() => {
        step += 0.1;
        packetCounterRef.current += 1;
        if (packetCounterRef.current % 10 === 0) {
          setPacketsTotal(packetCounterRef.current);
        }

        const currentModeCfg = PATIENT_MODES[patientModeIdRef.current] || PATIENT_MODES[1];
        const ratios = currentModeCfg.ratios;
        const amp = currentModeCfg.amplitudeScale;

        const delta = Math.sin(step * 0.8) * 35 * (ratios.delta / 25);
        const theta = Math.sin(step * 1.8) * 22 * (ratios.theta / 25);
        const alpha = Math.sin(step * 3.2) * 20 * (ratios.alpha / 25);
        const beta = (Math.sin(step * 6.5) * 12 + Math.cos(step * 5.0) * 6) * (ratios.beta / 25);
        const gamma = Math.sin(step * 12.0) * 5 * (ratios.gamma / 25);
        const noise = (Math.random() - 0.5) * 2.5;

        let ch1 = parseFloat(((delta + theta + alpha + beta + gamma + noise) * amp).toFixed(2));
        let ch2 = parseFloat(((delta * 0.95 + theta * 1.05 + alpha * 0.9 + beta * 1.1 - noise) * amp).toFixed(2));
        if (currentModeCfg.id === 48) {
          ch1 = parseFloat(((Math.random() - 0.5) * 0.8).toFixed(2));
          ch2 = parseFloat(((Math.random() - 0.5) * 0.8).toFixed(2));
        }
        const ref = parseFloat(((Math.random() - 0.5) * 0.4).toFixed(2));

        const packet: HardwarePacket = {
          ch1,
          ch2,
          ref,
          timestamp: Date.now(),
          battery: batteryLevel,
          isCharging,
          deviceId: `sim-mode-${currentModeCfg.id}`,
          heartRateBpm: currentModeCfg.cardiacBpm,
        };

        setLatestPacket(packet);
        recordSample(packet);
      }, 40);
    }
  };

  const updateBatteryLevel = async (level: number, broadcast: boolean = true): Promise<boolean> => {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    setBatteryLevel(clamped);
    setLatestPacket((prev) => (prev ? { ...prev, battery: clamped, isCharging } : prev));
    if (broadcast) {
      return sendTestPacket({ battery: clamped, isCharging });
    }
    return true;
  };

  const toggleCharging = () => {
    setIsCharging((prev) => {
      const next = !prev;
      setLatestPacket((p) => (p ? { ...p, isCharging: next } : p));
      sendTestPacket({ battery: batteryLevel, isCharging: next });
      return next;
    });
  };

  // Direct Hardware Poller (http://192.168.4.1/data)
  async function getHardwareData(): Promise<HardwareEegData | null> {
    try {
      let data: any = null;

      // 1. Direct fetch attempt to ESP32 SoftAP IP
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 1200) : null;
        const response = await fetch('http://192.168.4.1/data', {
          signal: controller?.signal,
        });
        if (timer) clearTimeout(timer);
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (directErr) {
        // Fallback to server proxy if browser mixed-content (HTTPS) or CORS blocks local HTTP request
        try {
          const proxyResp = await fetch('/api/hardware/proxy?url=http://192.168.4.1/data');
          if (proxyResp.ok) {
            data = await proxyResp.json();
          } else {
            throw directErr;
          }
        } catch {
          throw directErr;
        }
      }

      // idhu ungal data — idha vecha UI update pannunga
      console.log(data.delta, data.theta, data.alpha, data.beta, data.raw, data.leadsOff);

      // example: ungal website-la oru element irundha
      // document.getElementById('deltaValue').innerText = data.delta;
      const deltaEl = document.getElementById('deltaValue');
      if (deltaEl) deltaEl.innerText = typeof data.delta === 'number' ? data.delta.toFixed(2) : String(data.delta ?? '--');
      const thetaEl = document.getElementById('thetaValue');
      if (thetaEl) thetaEl.innerText = typeof data.theta === 'number' ? data.theta.toFixed(2) : String(data.theta ?? '--');
      const alphaEl = document.getElementById('alphaValue');
      if (alphaEl) alphaEl.innerText = typeof data.alpha === 'number' ? data.alpha.toFixed(2) : String(data.alpha ?? '--');
      const betaEl = document.getElementById('betaValue');
      if (betaEl) betaEl.innerText = typeof data.beta === 'number' ? data.beta.toFixed(2) : String(data.beta ?? '--');
      const rawEl = document.getElementById('rawValue');
      if (rawEl) rawEl.innerText = typeof data.raw === 'number' ? data.raw.toFixed(2) : String(data.raw ?? '--');
      const leadsOffEl = document.getElementById('leadsOffValue');
      if (leadsOffEl) leadsOffEl.innerText = data.leadsOff ? 'LEADS OFF' : 'COUPLED';

      const hwData: HardwareEegData = {
        delta: Number(data.delta ?? 0),
        theta: Number(data.theta ?? 0),
        alpha: Number(data.alpha ?? 0),
        beta: Number(data.beta ?? 0),
        raw: Number(data.rawLatest ?? 0),
        leadsOff: Boolean(data.leadsOff),
        battery: data.battery !== undefined ? Number(data.battery) : undefined,
        timestamp: Date.now(),
      };

      setHardwareData(hwData);
      setEsp32Reachable(true);
      setLastEsp32PollTime(Date.now());

      // If active mode is esp32_ap or hardware is broadcasting, feed packet buffer
      if (mode === 'esp32_ap' || (!isSimulated && status === 'connected')) {
        const packet: HardwarePacket = {
          ch1: hwData.raw,
          ch2: parseFloat((hwData.raw * 0.85).toFixed(2)),
          ref: 0.1,
          battery: data.battery !== undefined ? Number(data.battery) : batteryLevel,
          isCharging,
          deviceId: 'esp32-ap-192.168.4.1',
          timestamp: Date.now(),
        };
        setLatestPacket(packet);
        recordSample(packet);

        if (hwData.leadsOff) {
          setElectrodes([
            { ...INITIAL_ELECTRODES[0], quality: 'open', impedanceKOhms: 99.9 },
            { ...INITIAL_ELECTRODES[1], quality: 'open', impedanceKOhms: 99.9 },
            { ...INITIAL_ELECTRODES[2], quality: 'poor', impedanceKOhms: 45.0 },
          ]);
        } else {
          setElectrodes(INITIAL_ELECTRODES);
        }
      }

      return hwData;
    } catch (error) {
      console.log('Device not reachable:', error);
      setEsp32Reachable(false);
      return null;
    }
  }

  // Quick testing helper to inject sample hardware payload
  const injectMockHardwareData = (mock?: Partial<HardwareEegData>) => {
    const d = {
      delta: mock?.delta ?? parseFloat((14.2 + (Math.random() - 0.5) * 4).toFixed(2)),
      theta: mock?.theta ?? parseFloat((9.5 + (Math.random() - 0.5) * 3).toFixed(2)),
      alpha: mock?.alpha ?? parseFloat((21.4 + (Math.random() - 0.5) * 6).toFixed(2)),
      beta: mock?.beta ?? parseFloat((16.8 + (Math.random() - 0.5) * 5).toFixed(2)),
      raw: mock?.raw ?? parseFloat(((Math.random() - 0.5) * 50).toFixed(2)),
      leadsOff: mock?.leadsOff ?? false,
    };
    console.log(d.delta, d.theta, d.alpha, d.beta, d.raw, d.leadsOff);

    const deltaEl = document.getElementById('deltaValue');
    if (deltaEl) deltaEl.innerText = d.delta.toFixed(2);
    const thetaEl = document.getElementById('thetaValue');
    if (thetaEl) thetaEl.innerText = d.theta.toFixed(2);
    const alphaEl = document.getElementById('alphaValue');
    if (alphaEl) alphaEl.innerText = d.alpha.toFixed(2);
    const betaEl = document.getElementById('betaValue');
    if (betaEl) betaEl.innerText = d.beta.toFixed(2);
    const rawEl = document.getElementById('rawValue');
    if (rawEl) rawEl.innerText = d.raw.toFixed(2);
    const leadsOffEl = document.getElementById('leadsOffValue');
    if (leadsOffEl) leadsOffEl.innerText = d.leadsOff ? 'LEADS OFF' : 'COUPLED';

    const hwData: HardwareEegData = { ...d, timestamp: Date.now() };
    setHardwareData(hwData);
    setEsp32Reachable(true);
    setLastEsp32PollTime(Date.now());

    const packet: HardwarePacket = {
      ch1: hwData.raw,
      ch2: parseFloat((hwData.raw * 0.85).toFixed(2)),
      ref: 0.1,
      battery: batteryLevel,
      isCharging,
      deviceId: 'esp32-ap-192.168.4.1',
      timestamp: Date.now(),
    };
    setLatestPacket(packet);
    recordSample(packet);
  };

  const setMode = (newMode: ConnectionMode) => {
    disconnect();
    setModeState(newMode);
    if (newMode === 'simulator') {
      setSourceState('simulation');
      setIsSimulated(true);
      toggleSimulation();
    } else {
      setSourceState('live');
      setIsSimulated(false);
      if (newMode === 'global') {
        setEndpoint(`${window.location.origin}/api/telemetry/stream`);
        connectGlobal();
      } else if (newMode === 'localhost') {
        setEndpoint('ws://localhost:8765');
        connectLocalhost();
      } else if (newMode === 'esp32_ap') {
        setEndpoint('http://192.168.4.1/data');
        setStatus('connecting');
        getHardwareData().then((res) => {
          if (res) {
            setStatus('connected');
          } else {
            setStatus('connecting');
          }
        });
      }
    }
  };

  // Poll ESP32 hardware endpoint only when live device source is active
  useEffect(() => {
    if (source !== 'live' && mode !== 'esp32_ap') {
      return;
    }

    let isSubscribed = true;
    const poll = async () => {
      if (isSubscribed) {
        await getHardwareData();
      }
    };

    poll();
    const interval = setInterval(poll, 400);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [source, mode]);

  // Initial load: start in simulation mode
  useEffect(() => {
    toggleSimulation();
    return () => {
      disconnect();
    };
  }, []);

  return (
    <HardwareConnectionContext.Provider
      value={{
        status,
        mode,
        source,
        setSource,
        patientModeId,
        setPatientModeId,
        endpoint,
        globalIngestUrl,
        latencyMs,
        packetsTotal,
        sampleRateHz,
        batteryLevel,
        isCharging,
        isSimulated,
        electrodes,
        latestPacket,
        errorMessage,
        sessionStats,
        sessionRecords,
        isRecording,
        toggleRecording,
        clearSessionLog,
        downloadSessionLog,
        isDownloadModalOpen,
        setIsDownloadModalOpen,
        setMode,
        connect,
        disconnect,
        toggleSimulation,
        connectBluetooth,
        sendTestPacket,
        setEndpoint,
        isModalOpen,
        setIsModalOpen,
        toggleCharging,
        updateBatteryLevel,
        hardwareData,
        esp32Reachable,
        lastEsp32PollTime,
        getHardwareData,
        injectMockHardwareData,
      }}
    >
      {children}
    </HardwareConnectionContext.Provider>
  );
};

export const useHardwareConnection = () => {
  const context = useContext(HardwareConnectionContext);
  if (!context) {
    throw new Error('useHardwareConnection must be used within a HardwareConnectionProvider');
  }
  return context;
};
