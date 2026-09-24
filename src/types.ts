export type BrainwaveBandId = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface BrainwaveBand {
  id: BrainwaveBandId;
  name: string;
  symbol: string;
  rangeHz: string;
  freqMin: number;
  freqMax: number;
  amplitudeMicrovolts: string;
  corticalState: string;
  classificationRole: string;
  description: string;
  signalPattern: string;
}

export type CognitiveStatePreset = 'baseline' | 'deep_focus' | 'high_stress' | 'deep_rest';

export interface CognitiveStateConfig {
  id: CognitiveStatePreset;
  label: string;
  description: string;
  dominantBands: string[];
  metrics: {
    cognitiveLoad: number; // 0 - 100
    stressLevel: number; // 0 - 100
    valence: number; // -1.0 to +1.0
    signalSnr: number; // dB
  };
}

export interface SpecCategory {
  title: string;
  specs: {
    label: string;
    value: string;
    note?: string;
  }[];
}

export interface PipelineStep {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  technicalDetails: string[];
}

export interface UseCase {
  tag: string;
  title: string;
  audience: string;
  challenge: string;
  solution: string;
  metrics: string[];
}

export interface WaitlistSubmission {
  email: string;
  role: string;
  organization?: string;
  hardwareKit: boolean;
  lslStreamAccess: boolean;
  notes?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'simulated' | 'error';
export type ConnectionMode = 'global' | 'bluetooth' | 'localhost' | 'simulator' | 'esp32_ap';
export type EegSource = 'live' | 'simulation';

export interface HardwareEegData {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  raw: number;
  leadsOff: boolean;
  battery?: number;
  timestamp?: number;
}

export interface ElectrodeStatus {
  id: string;
  code: string;
  label: string;
  channel: string;
  role: string;
  impedanceKOhms: number;
  quality: 'optimal' | 'acceptable' | 'poor' | 'open';
}

export interface HardwarePacket {
  ch1: number; // Fp1 microvolts
  ch2: number; // Fp2 microvolts
  ref: number; // Earclip reference
  timestamp: number;
  battery?: number;
  isCharging?: boolean;
  deviceId?: string;
  impedance?: [number, number, number];
  ecgMv?: number; // Electrocardiogram lead potential in millivolts
  heartRateBpm?: number; // Realtime heart rate
  hrvRmssd?: number; // HRV RMSSD in milliseconds
}

export interface EegSessionRecord {
  sampleIndex: number;
  timestampIso: string;
  unixMs: number;
  elapsedSec: number;
  fp1_uV: number;
  fp2_uV: number;
  ref_uV: number;
  diff_uV: number;
  impedanceE1: number;
  impedanceE2: number;
  impedanceRef: number;
  batteryPct: number;
  cognitiveState: string;
  ecg_mV?: number;
  heartRate_bpm?: number;
}

export interface SessionLogStats {
  samplesRecorded: number;
  durationSec: number;
  startTime: number | null;
  isRecording: boolean;
  minFp1: number;
  maxFp1: number;
  meanFp1: number;
  minFp2: number;
  maxFp2: number;
  meanFp2: number;
}

export interface HardwareLinkState {
  status: ConnectionStatus;
  mode: ConnectionMode;
  endpoint: string;
  globalIngestUrl: string;
  latencyMs: number;
  packetsTotal: number;
  sampleRateHz: number;
  batteryLevel: number;
  isCharging?: boolean;
  isSimulated: boolean;
  source: EegSource;
  patientModeId: number;
  electrodes: [ElectrodeStatus, ElectrodeStatus, ElectrodeStatus];
  latestPacket: HardwarePacket | null;
  hardwareData?: HardwareEegData | null;
  errorMessage?: string;
  sessionStats: SessionLogStats;
}

export type CognitiveAlertType =
  | 'deep_focus'
  | 'high_fatigue'
  | 'acute_stress'
  | 'high_workload'
  | 'mindful_rest';

export type AlertSeverity = 'info' | 'notice' | 'warning';

export interface CognitiveAlert {
  id: string;
  type: CognitiveAlertType;
  title: string;
  description: string;
  biomarkerDetails: string;
  metricValue: number;
  metricLabel: string;
  severity: AlertSeverity;
  timestamp: number;
  dismissed?: boolean;
}

export interface CognitiveMetricsState {
  focusScore: number;
  fatigueIndex: number;
  stressLevel: number;
  workloadCLI: number;
  thetaBetaRatio: number;
  currentDominantHz: number;
  activePatternLabel: string;
}

