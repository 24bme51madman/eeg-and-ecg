import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  FC,
  ReactNode,
} from 'react';
import { CognitiveAlert, CognitiveAlertType, CognitiveMetricsState, AlertSeverity } from '../types';
import { useHardwareConnection } from './HardwareConnectionContext';

interface CognitiveAlertContextValue {
  alerts: CognitiveAlert[];
  unreadAlertCount: number;
  activeMetrics: CognitiveMetricsState;
  latestPulse: {
    type: CognitiveAlertType;
    timestamp: number;
    title: string;
  } | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  sensitivity: 'low' | 'balanced' | 'high';
  setSensitivity: (s: 'low' | 'balanced' | 'high') => void;
  monitoredPatterns: Record<CognitiveAlertType, boolean>;
  togglePatternMonitor: (type: CognitiveAlertType) => void;
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
  simulateAlert: (type: CognitiveAlertType) => void;
}

const CognitiveAlertContext = createContext<CognitiveAlertContextValue | null>(null);

// Optional subtle acoustic feedback via Web Audio API
function playSubtleChime(type: CognitiveAlertType) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);

    if (type === 'deep_focus') {
      // Harmonic ascending soft chime (Focus)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'high_fatigue') {
      // Soft descending warm tone (Fatigue notification)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392.0, now); // G4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.22); // C4
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.46);
    } else {
      // Neutral crisp pip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440.0, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

export const CognitiveAlertProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { latestPacket, status: hwStatus } = useHardwareConnection();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [sensitivity, setSensitivity] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [monitoredPatterns, setMonitoredPatterns] = useState<Record<CognitiveAlertType, boolean>>({
    deep_focus: true,
    high_fatigue: true,
    acute_stress: true,
    high_workload: true,
    mindful_rest: true,
  });

  const [alerts, setAlerts] = useState<CognitiveAlert[]>([
    {
      id: 'init-alert-1',
      type: 'deep_focus',
      title: 'Deep Focus Rhythm Identified',
      description: 'Synchronized frontal beta activity (18.4 Hz) with stable prefrontal alpha baseline.',
      biomarkerDetails: 'Beta/Theta Ratio: 2.85 • Peak Focus Index: 84/100',
      metricValue: 84,
      metricLabel: 'FOCUS SCORE',
      severity: 'info',
      timestamp: Date.now() - 1000 * 60 * 3,
    },
    {
      id: 'init-alert-2',
      type: 'high_fatigue',
      title: 'Prolonged Drowsiness / Fatigue Trend',
      description: 'Slow frontal theta rhythm shift (> 5.2 Hz) detected across Fp1 & Fp2 electrodes.',
      biomarkerDetails: 'Fatigue Index: 76/100 • Micro-break recommended',
      metricValue: 76,
      metricLabel: 'FATIGUE INDEX',
      severity: 'notice',
      timestamp: Date.now() - 1000 * 60 * 12,
    },
  ]);

  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(2);
  const [latestPulse, setLatestPulse] = useState<{
    type: CognitiveAlertType;
    timestamp: number;
    title: string;
  } | null>(null);

  const [activeMetrics, setActiveMetrics] = useState<CognitiveMetricsState>({
    focusScore: 78,
    fatigueIndex: 32,
    stressLevel: 28,
    workloadCLI: 54,
    thetaBetaRatio: 1.4,
    currentDominantHz: 10.4,
    activePatternLabel: 'Attentive Focus (Beta dominant)',
  });

  // Rolling buffer of recent raw microvolts for band power analysis
  const recentVoltagesRef = useRef<number[]>([]);
  const lastAlertTimeRef = useRef<Record<CognitiveAlertType, number>>({
    deep_focus: 0,
    high_fatigue: 0,
    acute_stress: 0,
    high_workload: 0,
    mindful_rest: 0,
  });

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (next) {
        setUnreadAlertCount(0);
      }
      return next;
    });
  };

  const togglePatternMonitor = (type: CognitiveAlertType) => {
    setMonitoredPatterns((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    setUnreadAlertCount(0);
  };

  // Dispatch an alert with subtle UI pulse and sound
  const triggerAlert = (
    type: CognitiveAlertType,
    title: string,
    description: string,
    biomarkerDetails: string,
    metricValue: number,
    metricLabel: string,
    severity: AlertSeverity
  ) => {
    if (!monitoredPatterns[type]) return;

    const now = Date.now();
    // Cooldown check (prevent repeated alerts of same type within 20s)
    const cooldownMs = sensitivity === 'high' ? 12000 : sensitivity === 'low' ? 30000 : 20000;
    if (now - (lastAlertTimeRef.current[type] || 0) < cooldownMs) {
      return;
    }
    lastAlertTimeRef.current[type] = now;

    const newAlert: CognitiveAlert = {
      id: `alert-${now}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      description,
      biomarkerDetails,
      metricValue,
      metricLabel,
      severity,
      timestamp: now,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 24)]);
    setUnreadAlertCount((prev) => prev + 1);

    // Trigger subtle UI pulse
    setLatestPulse({
      type,
      timestamp: now,
      title,
    });

    // Audio chime if enabled
    if (soundEnabled) {
      playSubtleChime(type);
    }
  };

  // Manual simulation trigger for user testing
  const simulateAlert = (type: CognitiveAlertType) => {
    if (type === 'deep_focus') {
      triggerAlert(
        'deep_focus',
        'Deep Focus State Triggered',
        'Prefrontal beta synchronization detected (21.4 Hz). Low theta interference across Fp1 & Fp2.',
        'Engagement Index: 89/100 • Target Alpha Suppression: -3.8 dB',
        89,
        'FOCUS SCORE',
        'info'
      );
    } else if (type === 'high_fatigue') {
      triggerAlert(
        'high_fatigue',
        'High Fatigue Threshold Exceeded',
        'Pronounced slowing of frontal frequencies with theta surge (4.8 Hz) and increased blink artifacts.',
        'Fatigue Index: 82/100 • TBR: 3.82 (High Vigilance Depletion)',
        82,
        'FATIGUE INDEX',
        'warning'
      );
    } else if (type === 'acute_stress') {
      triggerAlert(
        'acute_stress',
        'Acute Cognitive Strain Detected',
        'High-amplitude high-beta oscillations (26.2 Hz) and asymmetric frontal excitation.',
        'Stress Index: 78/100 • Sympathetic Surge Recorded',
        78,
        'STRESS LEVEL',
        'warning'
      );
    } else if (type === 'high_workload') {
      triggerAlert(
        'high_workload',
        'Elevated Cognitive Workload (CLI)',
        'Complex mental processing detected; multi-band frontal coherence exceeding nominal baseline.',
        'Workload Index: 85/100 • Mental Reserve: 15%',
        85,
        'WORKLOAD CLI',
        'notice'
      );
    } else {
      triggerAlert(
        'mindful_rest',
        'Mindful Alpha Coherence',
        'High-amplitude 10.2 Hz synchronized posterior-frontal alpha spindles. Deep restorative state.',
        'Alpha Power: +6.4 dB • Rest Quality: Optimal',
        92,
        'REST DEPTH',
        'info'
      );
    }
  };

  // Synchronous refs to decouple periodic analysis from React render cascade
  const latestPacketRef = useRef(latestPacket);
  latestPacketRef.current = latestPacket;
  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;
  const monitoredPatternsRef = useRef(monitoredPatterns);
  monitoredPatternsRef.current = monitoredPatterns;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Real-time EEG packet cognitive analysis loop run on a steady timer (every 500ms)
  useEffect(() => {
    const analysisTimer = setInterval(() => {
      const curPacket = latestPacketRef.current;
      if (!curPacket) return;

      // Push into rolling buffer (up to 200 samples)
      const val = curPacket.ch1;
      recentVoltagesRef.current.push(val);
      if (recentVoltagesRef.current.length > 200) {
        recentVoltagesRef.current.shift();
      }

      const samples = recentVoltagesRef.current;
      const len = samples.length;
      if (len < 15) return;

      // Estimate zero-crossings to gauge dominant frequency
      let zeroCrossings = 0;
      let mean = 0;
      for (let i = 0; i < len; i++) mean += samples[i];
      mean /= len;

      let variance = 0;
      for (let i = 0; i < len; i++) {
        const diff = samples[i] - mean;
        variance += diff * diff;
        if (i > 0 && (samples[i] - mean) * (samples[i - 1] - mean) < 0) {
          zeroCrossings++;
        }
      }
      variance /= len;
      const stdDev = Math.sqrt(variance);

      // Approximate dominant Hz from zero crossings over the buffer duration (~250 S/s)
      const nominalRate = 250;
      const durationSec = len / nominalRate;
      const estimatedHz = Math.max(1, Math.min(45, (zeroCrossings / 2) / Math.max(0.1, durationSec)));

      // Derive cognitive biomarkers from signal dynamics & frequency
      let focus = 65;
      let fatigue = 25;
      let stress = 20;
      let workload = 40;
      let patternLabel = 'Active Baseline (Alpha-Beta blend)';

      // If dominant Hz is in Beta (14-30 Hz) with moderate-high amplitude
      if (estimatedHz >= 14 && estimatedHz <= 30) {
        if (stdDev < 25) {
          focus = Math.min(96, Math.round(75 + stdDev));
          fatigue = Math.max(10, Math.round(30 - stdDev * 0.4));
          stress = Math.min(65, Math.round(25 + stdDev * 0.8));
          patternLabel = 'Deep Focus & Active Concentration';
        } else {
          // High voltage high frequency indicates stress / muscle tension
          stress = Math.min(95, Math.round(65 + stdDev * 0.7));
          workload = Math.min(92, Math.round(70 + stdDev * 0.5));
          focus = Math.round(55 + stdDev * 0.3);
          fatigue = Math.round(45 + stdDev * 0.4);
          patternLabel = 'Acute Cognitive Strain & High Load';
        }
      } else if (estimatedHz >= 4 && estimatedHz <= 8) {
        // Theta dominant indicates fatigue / drowsiness or deep meditation
        fatigue = Math.min(94, Math.round(65 + (8 - estimatedHz) * 6));
        focus = Math.max(15, Math.round(45 - fatigue * 0.3));
        stress = Math.max(10, Math.round(30 - fatigue * 0.2));
        patternLabel = 'Elevated Drowsiness / Mental Fatigue';
      } else if (estimatedHz >= 8 && estimatedHz <= 13) {
        // Alpha dominant indicates relaxed alertness
        focus = 70;
        fatigue = 28;
        stress = 18;
        workload = 42;
        patternLabel = 'Relaxed Alertness (Alpha Synchrony)';
      } else if (estimatedHz < 4) {
        // Delta
        fatigue = 88;
        focus = 20;
        patternLabel = 'Deep Rest / Soporific Drift';
      }

      const tbr = parseFloat(((fatigue / Math.max(10, focus)) * 2.2).toFixed(2));

      setActiveMetrics({
        focusScore: focus,
        fatigueIndex: fatigue,
        stressLevel: stress,
        workloadCLI: workload,
        thetaBetaRatio: tbr,
        currentDominantHz: parseFloat(estimatedHz.toFixed(1)),
        activePatternLabel: patternLabel,
      });

      // Pattern Threshold Checks
      const curSensitivity = sensitivityRef.current;
      const focusThreshold = curSensitivity === 'high' ? 78 : curSensitivity === 'low' ? 88 : 82;
      const fatigueThreshold = curSensitivity === 'high' ? 70 : curSensitivity === 'low' ? 82 : 75;
      const stressThreshold = curSensitivity === 'high' ? 72 : curSensitivity === 'low' ? 84 : 78;

      if (focus >= focusThreshold) {
        triggerAlert(
          'deep_focus',
          'Deep Focus State Active',
          'Sustained high beta rhythm and attentional stability detected across prefrontal leads.',
          `Engagement Index: ${focus}/100 • Dominant: ${estimatedHz.toFixed(1)} Hz`,
          focus,
          'FOCUS SCORE',
          'info'
        );
      } else if (fatigue >= fatigueThreshold) {
        triggerAlert(
          'high_fatigue',
          'High Cognitive Fatigue Detected',
          'Frontal theta elevation observed. Reaction time and vigilance degraded.',
          `Fatigue Index: ${fatigue}/100 • TBR: ${tbr}x baseline`,
          fatigue,
          'FATIGUE INDEX',
          'warning'
        );
      } else if (stress >= stressThreshold) {
        triggerAlert(
          'acute_stress',
          'Acute Cognitive Stress Detected',
          'Beta power surge (> 24 Hz) and sympathetic arousal recorded.',
          `Stress Index: ${stress}/100 • High autonomic arousal`,
          stress,
          'STRESS LEVEL',
          'warning'
        );
      }
    }, 500);

    return () => clearInterval(analysisTimer);
  }, []);

  // Clear pulse animation state after 4 seconds
  useEffect(() => {
    if (!latestPulse) return;
    const timer = setTimeout(() => {
      setLatestPulse(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [latestPulse]);

  const contextValue = useMemo<CognitiveAlertContextValue>(
    () => ({
      alerts,
      unreadAlertCount,
      activeMetrics,
      latestPulse,
      isSidebarOpen,
      setIsSidebarOpen,
      toggleSidebar,
      soundEnabled,
      setSoundEnabled,
      sensitivity,
      setSensitivity,
      monitoredPatterns,
      togglePatternMonitor,
      dismissAlert,
      clearAllAlerts,
      simulateAlert,
    }),
    [
      alerts,
      unreadAlertCount,
      activeMetrics,
      latestPulse,
      isSidebarOpen,
      soundEnabled,
      sensitivity,
      monitoredPatterns,
    ]
  );

  return (
    <CognitiveAlertContext.Provider value={contextValue}>
      {children}
    </CognitiveAlertContext.Provider>
  );
};

export const useCognitiveAlerts = () => {
  const context = useContext(CognitiveAlertContext);
  if (!context) {
    throw new Error('useCognitiveAlerts must be used within a CognitiveAlertProvider');
  }
  return context;
};
