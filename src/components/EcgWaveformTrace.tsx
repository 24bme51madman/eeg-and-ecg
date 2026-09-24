import { useEffect, useRef, useState, useMemo, FC } from 'react';
import { Heart, Activity, Volume2, VolumeX, Sliders, Waves, Zap, CheckCircle2 } from 'lucide-react';
import { CognitiveStatePreset, HardwarePacket } from '../types';
import { PATIENT_MODES } from '../data/patientModesData';

interface EcgWaveformTraceProps {
  isRunning: boolean;
  speed: number;
  activePreset?: CognitiveStatePreset;
  patientModeId?: number;
  isSimulated?: boolean;
  hwStatus?: string;
  latestPacket?: HardwarePacket | null;
}

export type EcgLead = 'Lead II (Standard)' | 'Lead I (Bipolar)' | 'Precordial V1';
export type EcgGain = 0.5 | 1.0 | 2.0;
export type EcgFilter = 'diag' | 'monitor';

export const EcgWaveformTrace: FC<EcgWaveformTraceProps> = ({
  isRunning,
  speed,
  activePreset = 'deep_focus',
  patientModeId,
  isSimulated = false,
  hwStatus = 'disconnected',
  latestPacket,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [lead, setLead] = useState<EcgLead>('Lead II (Standard)');
  const [gain, setGain] = useState<EcgGain>(1.0);
  const [filterMode, setFilterMode] = useState<EcgFilter>('monitor');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isBeating, setIsBeating] = useState(false);
  const [forceCardiacSimulation, setForceCardiacSimulation] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detect whether real physical hardware is actively connected and streaming ECG telemetry
  const hasLiveEcgSignal = Boolean(
    hwStatus === 'connected' &&
    latestPacket &&
    ((typeof latestPacket.ecgMv === 'number' && latestPacket.ecgMv !== 0) ||
     (typeof latestPacket.heartRateBpm === 'number' && latestPacket.heartRateBpm > 0))
  );

  // When not connected to physical hardware: strictly show NO readings and NO waveforms
  // unless user manually turns on the optional bench simulation test
  const isEcgActive = hasLiveEcgSignal || forceCardiacSimulation;
  const isEcgActiveRef = useRef(isEcgActive);
  isEcgActiveRef.current = isEcgActive;

  // Live readings state (initialized to zero / empty until real hardware signal arrives)
  const [currentMv, setCurrentMv] = useState<number>(0.00);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [rrIntervalMs, setRrIntervalMs] = useState<number | null>(null);
  const [hrvRmssdMs, setHrvRmssdMs] = useState<number | null>(null);
  const [qrsDurationMs, setQrsDurationMs] = useState<number | null>(null);
  const [prIntervalMs, setPrIntervalMs] = useState<number | null>(null);
  const [qtcIntervalMs, setQtcIntervalMs] = useState<number | null>(null);
  const [stDeviationMv, setStDeviationMv] = useState<number | null>(null);
  const [coherenceScore, setCoherenceScore] = useState<number | null>(null);

  // Cardiac state presets parameters memoized to prevent infinite re-renders
  const cardiacSpecs = useMemo(() => {
    if (!isEcgActive) {
      return {
        baseBpm: 0,
        rr: 0,
        rmssd: 0,
        qrs: 0,
        pr: 0,
        qtc: 0,
        st: 0.0,
        coherence: 0,
        rhythm: 'NO HARDWARE DETECTED // ECG TRANSDUCER OFFLINE',
        autonomicTone: 'Hardware Not Connected — No ECG Readings Or Waveforms',
      };
    }

    if (isSimulated && patientModeId && PATIENT_MODES[patientModeId]) {
      const pm = PATIENT_MODES[patientModeId];
      const bpm = pm.cardiacBpm;
      const rr = Math.round(60000 / bpm);
      return {
        baseBpm: bpm,
        rr,
        rmssd: bpm > 90 ? 22.4 : bpm < 60 ? 78.5 : 52.0,
        qrs: 86,
        pr: 152,
        qtc: Math.round(390 * Math.sqrt(rr / 1000)),
        st: bpm > 100 ? 0.05 : 0.01,
        coherence: bpm > 90 ? 0.42 : bpm < 65 ? 0.94 : 0.78,
        rhythm: pm.cardiacRhythm,
        autonomicTone: bpm > 90 ? 'Sympathetic Dominance' : bpm < 60 ? 'Parasympathetic / Vagal Tone' : 'Balanced Autonomic Tone',
      };
    }

    switch (activePreset) {
      case 'deep_focus':
        return {
          baseBpm: 62,
          rr: 968,
          rmssd: 68.2,
          qrs: 84,
          pr: 156,
          qtc: 402,
          st: 0.01,
          coherence: 0.92,
          rhythm: 'Vagal Attentional Deceleration (Optimal ANS Balance)',
          autonomicTone: 'High Parasympathetic / Vagal Reserve',
        };
      case 'high_stress':
        return {
          baseBpm: 104,
          rr: 577,
          rmssd: 18.5,
          qrs: 92,
          pr: 136,
          qtc: 442,
          st: 0.06,
          coherence: 0.36,
          rhythm: 'Sinus Tachycardia (Acute Sympathetic Arousal)',
          autonomicTone: 'Sympathetic Dominance / Blunted Vagal Brake',
        };
      case 'deep_rest':
        return {
          baseBpm: 54,
          rr: 1111,
          rmssd: 84.1,
          qrs: 82,
          pr: 168,
          qtc: 394,
          st: 0.00,
          coherence: 0.89,
          rhythm: 'Sinus Bradycardia (Physiological Rest Recovery)',
          autonomicTone: 'High Vagal Tone / Somatic Quiescence',
        };
      case 'baseline':
      default:
        return {
          baseBpm: 74,
          rr: 811,
          rmssd: 46.5,
          qrs: 86,
          pr: 150,
          qtc: 412,
          st: 0.02,
          coherence: 0.76,
          rhythm: 'Normal Sinus Rhythm (NSR)',
          autonomicTone: 'Balanced Autonomic Equilibrium',
        };
    }
  }, [isEcgActive, isSimulated, patientModeId, activePreset]);

  // Synchronous refs for continuous animation loop
  const cardiacSpecsRef = useRef(cardiacSpecs);
  cardiacSpecsRef.current = cardiacSpecs;
  const leadRef = useRef(lead);
  leadRef.current = lead;
  const gainRef = useRef(gain);
  gainRef.current = gain;
  const filterModeRef = useRef(filterMode);
  filterModeRef.current = filterMode;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const latestPacketRef = useRef(latestPacket);
  latestPacketRef.current = latestPacket;
  const hwStatusRef = useRef(hwStatus);
  hwStatusRef.current = hwStatus;
  const isBeatingRef = useRef(false);

  // Clear all readings immediately when hardware is disconnected and simulation not forced
  useEffect(() => {
    if (!isEcgActive) {
      setCurrentMv(0.00);
      setHeartRate(null);
      setRrIntervalMs(null);
      setHrvRmssdMs(null);
      setQrsDurationMs(null);
      setPrIntervalMs(null);
      setQtcIntervalMs(null);
      setStDeviationMv(null);
      setCoherenceScore(null);
      setIsBeating(false);
    }
  }, [isEcgActive]);

  // Play subtle medical beep on R-peak
  const triggerAudioBeep = () => {
    if (!soundEnabledRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz standard medical pitch
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);

      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.055);
    } catch {
      // AudioContext unavailable or blocked by autoplay
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let lastMvUpdateTime = 0;
    let beatTimeoutId: NodeJS.Timeout | null = null;
    let lastRPeakTrigger = 0;

    const width = canvas.parentElement?.clientWidth || 720;
    const height = 180;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const history: number[] = new Array(Math.floor(width)).fill(0);

    const render = () => {
      const curGain = gainRef.current;
      if (isRunningRef.current) {
        time += 0.016 * speedRef.current; // 60 FPS simulation time step

        if (!isEcgActiveRef.current) {
          // Strictly flatline isoelectric zero (0.00 mV) - NO waveforms and NO readings
          history.push(0);
          if (history.length > width) {
            history.shift();
          }
          if (time - lastMvUpdateTime > 0.35) {
            lastMvUpdateTime = time;
            setCurrentMv(0.00);
          }
          // Do not trigger heart beats or audio
        } else {
          const curSpecs = cardiacSpecsRef.current;
          const curPacket = latestPacketRef.current;
          const curStatus = hwStatusRef.current;
          const curLead = leadRef.current;
          const curFilter = filterModeRef.current;

          // Target BPM with subtle Respiratory Sinus Arrhythmia (RSA, ~0.25 Hz breath modulation)
          const targetBpm =
            curStatus === 'connected' && curPacket?.heartRateBpm
              ? curPacket.heartRateBpm
              : curSpecs.baseBpm;

          const rsaModulation = Math.sin(time * 1.5) * 3.2; // +/- 3 BPM natural respiratory oscillation
          const instantBpm = targetBpm + rsaModulation;
          const cycleDurationSec = 60 / instantBpm;

          // Cardiac phase: 0.0 to 1.0 within current heart beat
          const phase = (time % cycleDurationSec) / cycleDurationSec;

          // Physiological P-Q-R-S-T waveform calculation
          // 1. Baseline drift / respiration wander
          const baselineDrift = curFilter === 'diag' ? Math.sin(time * 0.8) * 0.04 : 0;
          // 2. High-frequency bio-noise (cleaner in monitor mode)
          const noise = (Math.random() - 0.5) * (curFilter === 'diag' ? 0.025 : 0.008);

          let ecgSignal = baselineDrift + noise;

          // Lead specific coefficients
          let leadRScale = 1.0;
          let leadSScale = 1.0;
          let leadPScale = 1.0;

          if (curLead === 'Lead I (Bipolar)') {
            leadRScale = 0.75;
            leadSScale = 0.7;
            leadPScale = 1.1;
          } else if (curLead === 'Precordial V1') {
            leadRScale = 0.45;
            leadSScale = 1.6; // Deep S wave in V1
            leadPScale = -0.5; // Biphasic/inverted P in V1
          }

          // P-WAVE: Atrial depolarization (phase ~ 0.16)
          const pPhase = phase - 0.16;
          if (Math.abs(pPhase) < 0.08) {
            ecgSignal += Math.exp(-Math.pow(pPhase / 0.028, 2)) * 0.18 * leadPScale;
          }

          // Q-WAVE: Septal depolarization (phase ~ 0.28)
          const qPhase = phase - 0.28;
          if (Math.abs(qPhase) < 0.03) {
            ecgSignal -= Math.exp(-Math.pow(qPhase / 0.009, 2)) * 0.14;
          }

          // R-PEAK: Ventricular depolarization (phase ~ 0.315)
          const rPhase = phase - 0.315;
          if (Math.abs(rPhase) < 0.04) {
            const rHeight = 1.35 * leadRScale;
            ecgSignal += Math.exp(-Math.pow(rPhase / 0.010, 2)) * rHeight;

            // Detect R-peak transition to trigger beat indicator & audio blip
            if (rPhase > -0.005 && rPhase < 0.015 && time - lastRPeakTrigger > 0.4) {
              lastRPeakTrigger = time;
              isBeatingRef.current = true;
              setIsBeating(true);
              triggerAudioBeep();
              if (beatTimeoutId) clearTimeout(beatTimeoutId);
              beatTimeoutId = setTimeout(() => {
                isBeatingRef.current = false;
                setIsBeating(false);
              }, 120);

              // Update live readouts
              setHeartRate(Math.round(instantBpm));
              const calculatedRr = Math.round((60 / instantBpm) * 1000);
              setRrIntervalMs(calculatedRr);
              setHrvRmssdMs(
                parseFloat((curSpecs.rmssd + (Math.random() - 0.5) * 2.5).toFixed(1))
              );
              setStDeviationMv(parseFloat((curSpecs.st + (Math.random() - 0.5) * 0.01).toFixed(2)));
              setCoherenceScore(
                parseFloat((curSpecs.coherence + (Math.random() - 0.5) * 0.02).toFixed(2))
              );
            }
          }

          // S-WAVE: Late ventricular depolarization (phase ~ 0.345)
          const sPhase = phase - 0.345;
          if (Math.abs(sPhase) < 0.035) {
            ecgSignal -= Math.exp(-Math.pow(sPhase / 0.012, 2)) * 0.32 * leadSScale;
          }

          // ST-SEGMENT: Plateau (phase ~ 0.38 - 0.44)
          if (phase >= 0.36 && phase <= 0.44) {
            ecgSignal += curSpecs.st;
          }

          // T-WAVE: Ventricular repolarization (phase ~ 0.52)
          const tPhase = phase - 0.52;
          if (Math.abs(tPhase) < 0.12) {
            ecgSignal += Math.exp(-Math.pow(tPhase / 0.055, 2)) * 0.32;
          }

          // U-WAVE: subtle Purkinje repolarization (phase ~ 0.68)
          const uPhase = phase - 0.68;
          if (Math.abs(uPhase) < 0.06) {
            ecgSignal += Math.exp(-Math.pow(uPhase / 0.03, 2)) * 0.035;
          }

          // Scale by selected gain (standard 1.0 mV maps to ~45 pixels at 1.0x gain)
          const pixelVoltage = ecgSignal * 45 * curGain;
          history.push(pixelVoltage);
          if (history.length > width) {
            history.shift();
          }

          // Throttle amplitude updates to prevent frame-by-frame React state thrashing
          if (time - lastMvUpdateTime > 0.35) {
            lastMvUpdateTime = time;
            setCurrentMv(parseFloat(ecgSignal.toFixed(3)));
          }
        }
      }

      // DRAW CALIBRATED ECG STRIP CHART
      ctx.clearRect(0, 0, width, height);

      // 1. Classical pink/coral medical chart paper tint
      ctx.fillStyle = '#FFF8F6';
      ctx.fillRect(0, 0, width, height);

      // 2. Minor 1mm grid (classic medical ECG paper)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.09)'; // subtle red/coral grid
      ctx.lineWidth = 0.75;
      for (let x = 0; x <= width; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Major 5mm grid (representing 0.20s and 0.5mV standard)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.24)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      const centerY = height / 2 + 10;
      for (let y = 0; y <= height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Isoelectric Center Zero-Line
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Standby notification watermark on ECG paper when hardware is not connected
      if (!isEcgActiveRef.current) {
        ctx.save();
        ctx.fillStyle = 'rgba(185, 28, 28, 0.85)';
        ctx.font = 'bold 12px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO HARDWARE DETECTED // NO ECG READINGS OR WAVEFORMS', width / 2, centerY - 28);
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(107, 114, 128, 0.95)';
        ctx.fillText('CONNECT PHYSICAL TRANSDUCER TO STREAM LIVE CARDIAC TELEMETRY', width / 2, centerY - 12);
        ctx.restore();
      }

      // 4. Standard 1.0 mV Calibration Box (10mm high, 0.2s wide standard)
      const calBoxX = width - 85;
      const calHeightPx = 45 * curGain; // 1mV standard height
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(calBoxX, centerY);
      ctx.lineTo(calBoxX + 10, centerY);
      ctx.lineTo(calBoxX + 10, centerY - calHeightPx);
      ctx.lineTo(calBoxX + 32, centerY - calHeightPx);
      ctx.lineTo(calBoxX + 32, centerY);
      ctx.lineTo(calBoxX + 44, centerY);
      ctx.stroke();

      ctx.fillStyle = '#7F1D1D';
      ctx.font = '8px "IBM Plex Mono", monospace';
      ctx.fillText(`1.0 mV CAL (${curGain}x)`, calBoxX - 2, centerY + 14);

      // Scale annotations (left margin)
      ctx.fillText('+1.0 mV', 8, centerY - 45 * curGain + 3);
      ctx.fillText(' 0.0 mV', 8, centerY + 3);
      ctx.fillText('-0.5 mV', 8, centerY + 22.5 * curGain + 3);

      // 5. Draw ECG trace in sharp Medical Crimson when active, or neutral gray when disconnected
      ctx.strokeStyle = isEcgActiveRef.current ? '#DC2626' : '#9CA3AF';
      ctx.lineWidth = isEcgActiveRef.current ? 1.8 : 1.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = i;
        const y = centerY - history[i];
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 6. Sweep Stylus Needle with Pulse Blip
      const lastX = history.length - 1;
      const lastY = centerY - history[lastX];

      // Vertical sweep line
      ctx.strokeStyle = isEcgActiveRef.current ? 'rgba(220, 38, 38, 0.35)' : 'rgba(156, 163, 175, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lastX, 0);
      ctx.lineTo(lastX, height);
      ctx.stroke();

      // Stylus tip
      ctx.fillStyle = isEcgActiveRef.current ? '#DC2626' : '#9CA3AF';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Active pulse ring only when beating and ECG is active
      if (isBeatingRef.current && isEcgActiveRef.current) {
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (beatTimeoutId) clearTimeout(beatTimeoutId);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Informative Status Banner when physical ECG hardware is not connected */}
      {!hasLiveEcgSignal && (
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border border-neutral-300 bg-neutral-50 px-3 py-1.5 font-mono text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                forceCardiacSimulation ? 'bg-amber-500 animate-pulse' : 'bg-neutral-400'
              }`}
            />
            <span className="text-neutral-700">
              CH-B ECG TRANSDUCER:{' '}
              <strong className="text-[#141517]">
                {forceCardiacSimulation
                  ? 'BENCH SIMULATION OVERRIDE (TESTING)'
                  : 'HARDWARE DISCONNECTED // NO READINGS & NO WAVEFORMS'}
              </strong>
            </span>
            <span className="hidden md:inline text-[11px] text-neutral-500">
              {forceCardiacSimulation
                ? '• Generating simulated cardiac test stream'
                : '• Physical headband transmits EEG (FP1, FP2, REF). Awaiting ECG transducer link.'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setForceCardiacSimulation((prev) => !prev)}
              className={`border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                forceCardiacSimulation
                  ? 'border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-100'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
              title={
                forceCardiacSimulation
                  ? 'Return to disconnected zero state'
                  : 'Enable simulated cardiac waveform for bench testing'
              }
            >
              {forceCardiacSimulation ? 'DISABLE TEST' : 'ENABLE BENCH TEST'}
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="border border-neutral-300 bg-white px-2 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              {isCollapsed ? 'EXPAND CH-B' : 'MINIMIZE CH-B'}
            </button>
          </div>
        </div>
      )}

      {/* Collapsed State View */}
      {isCollapsed ? (
        <div className="border border-neutral-200 bg-white p-2.5 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isEcgActive ? 'bg-red-600 animate-pulse' : 'bg-neutral-400'}`} />
            <span className="text-neutral-600">
              PHYSIOLOGICAL CHANNEL B: <strong className="text-[#141517]">{isEcgActive && heartRate !== null ? `${heartRate} BPM (ACTIVE)` : 'HARDWARE DISCONNECTED (NO READINGS / NO WAVEFORMS)'}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="border border-neutral-300 bg-neutral-50 px-2.5 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-100 font-semibold"
          >
            EXPAND CH-B
          </button>
        </div>
      ) : (
        <>
          {/* ECG Header & Telemetry Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200/80 pb-2.5 text-xs">
            <div className="flex items-center gap-2">
              {/* Animated Heart Pulsing Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] font-semibold border transition-all ${
                  !isEcgActive
                    ? 'border-neutral-300 bg-neutral-100 text-neutral-500'
                    : isBeating
                    ? 'border-red-600 bg-red-600 text-white shadow-xs'
                    : 'border-red-200 bg-red-50 text-red-900'
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 fill-current transition-transform duration-100 ${
                    !isEcgActive
                      ? 'text-neutral-400 scale-95'
                      : isBeating
                      ? 'scale-125 text-white'
                      : 'text-red-600'
                  }`}
                />
                <span>{isEcgActive && heartRate !== null ? `${heartRate} BPM` : '-- BPM'}</span>
              </div>

              <span className="font-mono text-neutral-400">|</span>

              <span className="font-mono text-neutral-600">
                LEAD: <strong className="text-[#141517]">{lead.split(' ')[0]} {lead.split(' ')[1]}</strong>
              </span>

              <span className="hidden font-mono text-neutral-400 sm:inline">|</span>

              <span className="hidden font-mono text-neutral-600 sm:inline">
                PAPER: <strong>25 mm/s (10 mm/mV)</strong>
              </span>
            </div>

            {/* Real-time potential & rhythm telemetry */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <div className="border border-red-200 bg-white px-2 py-0.5 text-neutral-800">
                POTENTIAL:{' '}
                <span
                  className={
                    !isEcgActive
                      ? 'font-semibold text-neutral-500'
                      : currentMv >= 0
                      ? 'font-semibold text-red-700'
                      : 'font-semibold text-neutral-800'
                  }
                >
                  {isEcgActive ? (currentMv >= 0 ? `+${currentMv.toFixed(2)}` : currentMv.toFixed(2)) : '0.00'} mV
                </span>
              </div>

              <div className="border border-red-200 bg-white px-2 py-0.5 text-neutral-800">
                R-R: <span className="font-semibold text-[#141517]">{isEcgActive && rrIntervalMs !== null ? `${rrIntervalMs} ms` : '-- ms'}</span>
              </div>

              <div className="border border-red-200 bg-white px-2 py-0.5 text-neutral-800">
                HRV (RMSSD):{' '}
                <span className="font-semibold text-red-800">{isEcgActive && hrvRmssdMs !== null ? `${hrvRmssdMs} ms` : '-- ms'}</span>
              </div>

              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                disabled={!isEcgActive}
                className={`border px-2 py-0.5 font-mono text-[11px] flex items-center gap-1 transition-colors ${
                  !isEcgActive
                    ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed'
                    : soundEnabled
                    ? 'border-red-600 bg-red-600 text-white font-semibold'
                    : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
                title={soundEnabled ? 'Mute cardiac tone' : 'Enable 880Hz clinical cardiac tone'}
              >
                {soundEnabled && isEcgActive ? (
                  <>
                    <Volume2 className="h-3 w-3" /> BEEP ON
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3 w-3" /> BEEP OFF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ECG Canvas Strip-Chart Display */}
          <div className="relative mt-2.5 w-full overflow-hidden border border-red-300 shadow-2xs">
            <canvas
              ref={canvasRef}
              className="block h-[160px] w-full sm:h-[180px]"
              style={{ width: '100%' }}
            />

            {/* Lead & Filter Overlay Tag */}
            <div className="absolute top-2 left-3 rounded-none border border-red-200 bg-white/95 px-2 py-0.5 font-mono text-[10px] text-red-950 backdrop-blur-xs flex items-center gap-1.5 shadow-2xs">
              <Activity className="h-3 w-3 text-red-600" />
              <span>ECG // {lead.toUpperCase()}</span>
              <span className="text-neutral-400">|</span>
              <span>{filterMode === 'monitor' ? '0.5–40 Hz (MONITOR)' : '0.05–150 Hz (DIAG)'}</span>
            </div>

            {/* Rhythm Classification Badge Overlay */}
            <div className="absolute top-2 right-3 rounded-none border border-red-300/80 bg-white/95 px-2 py-0.5 font-mono text-[10px] text-red-900 flex items-center gap-1.5 shadow-2xs">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  !isEcgActive
                    ? 'bg-neutral-400'
                    : isBeating
                    ? 'bg-red-600 scale-125'
                    : 'bg-emerald-600'
                } transition-all`}
              />
              <span className="font-semibold">
                {isEcgActive
                  ? cardiacSpecs.rhythm.split('(')[0].trim().toUpperCase()
                  : 'CH-B STANDBY // LEAD OFF'}
              </span>
            </div>
          </div>

          {/* ECG Controls (Leads, Gain, Filter) */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
            {/* Lead Selector */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-mono text-[11px] text-neutral-500">LEAD:</span>
              {(['Lead II (Standard)', 'Lead I (Bipolar)', 'Precordial V1'] as EcgLead[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLead(l)}
                  className={`border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                    lead === l
                      ? 'border-red-600 bg-red-50 font-semibold text-red-800'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {l.replace(' (Standard)', '').replace(' (Bipolar)', '')}
                </button>
              ))}
            </div>

            {/* Amplitude Gain Selector */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-[11px] text-neutral-500">GAIN:</span>
              {([0.5, 1.0, 2.0] as EcgGain[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGain(g)}
                  className={`border px-1.5 py-0.5 font-mono text-[11px] ${
                    gain === g
                      ? 'border-[#141517] bg-[#141517] text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {g}x
                </button>
              ))}
            </div>

            {/* Bandpass Filter Mode Selector */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-[11px] text-neutral-500">FILTER:</span>
              <button
                type="button"
                onClick={() => setFilterMode('monitor')}
                className={`border px-1.5 py-0.5 font-mono text-[11px] ${
                  filterMode === 'monitor'
                    ? 'border-red-600 bg-red-50 text-red-900 font-medium'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Monitor (0.5–40Hz)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('diag')}
                className={`border px-1.5 py-0.5 font-mono text-[11px] ${
                  filterMode === 'diag'
                    ? 'border-red-600 bg-red-50 text-red-900 font-medium'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Diag (0.05–150Hz)
              </button>
            </div>
          </div>

          {/* ─── COMPREHENSIVE ECG READINGS GRID ─── */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-red-200/70 pt-3 sm:grid-cols-4 lg:grid-cols-4">
            {/* 1. Heart Rate (HR) */}
            <div className="border border-red-200/90 bg-white p-2.5 shadow-2xs">
              <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500">
                <span>HEART RATE (HR)</span>
                <Heart
                  className={`h-2.5 w-2.5 ${
                    !isEcgActive
                      ? 'text-neutral-300'
                      : isBeating
                      ? 'text-red-600 fill-current'
                      : 'text-neutral-400'
                  }`}
                />
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-lg font-bold text-red-900">
                  {isEcgActive && heartRate !== null ? `${heartRate} ` : '-- '}
                  <span className="text-xs font-normal text-neutral-500">BPM</span>
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    !isEcgActive || heartRate === null
                      ? 'text-neutral-500'
                      : heartRate > 100
                      ? 'text-red-700'
                      : heartRate < 60
                      ? 'text-blue-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {!isEcgActive || heartRate === null ? 'NO SIGNAL' : heartRate > 100 ? 'TACHY' : heartRate < 60 ? 'BRADY' : 'EUCARDIA'}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-neutral-500">
                {isEcgActive ? 'REF: 60–100 BPM' : 'HARDWARE DISCONNECTED'}
              </div>
            </div>

            {/* 2. R-R Interval */}
            <div className="border border-red-200/90 bg-white p-2.5 shadow-2xs">
              <div className="font-mono text-[10px] text-neutral-500">R-R INTERVAL</div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-lg font-bold text-[#141517]">
                  {isEcgActive && rrIntervalMs !== null ? `${rrIntervalMs} ` : '-- '}
                  <span className="text-xs font-normal text-neutral-500">ms</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {isEcgActive ? 'BEAT-TO-BEAT' : 'NO SIGNAL'}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-neutral-500">
                {isEcgActive ? 'REF: 600–1200 ms' : 'NO CARDIAC BEATS'}
              </div>
            </div>

            {/* 3. HRV (RMSSD) */}
            <div className="border border-red-200/90 bg-white p-2.5 shadow-2xs">
              <div className="font-mono text-[10px] text-neutral-500">HRV (RMSSD)</div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-lg font-bold text-red-900">
                  {isEcgActive && hrvRmssdMs !== null ? `${hrvRmssdMs} ` : '-- '}
                  <span className="text-xs font-normal text-neutral-500">ms</span>
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    !isEcgActive || hrvRmssdMs === null ? 'text-neutral-500' : hrvRmssdMs > 50 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {!isEcgActive || hrvRmssdMs === null ? 'NO SIGNAL' : hrvRmssdMs > 50 ? 'HIGH VAGAL' : 'SYMPATHETIC'}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-neutral-500">
                {isEcgActive ? 'VAGAL AUTONOMIC TONE' : 'HARDWARE DISCONNECTED'}
              </div>
            </div>

            {/* 4. QRS Complex Duration */}
            <div className="border border-red-200/90 bg-white p-2.5 shadow-2xs">
              <div className="font-mono text-[10px] text-neutral-500">QRS DURATION</div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-lg font-bold text-[#141517]">
                  {isEcgActive && qrsDurationMs !== null ? `${qrsDurationMs} ` : '-- '}
                  <span className="text-xs font-normal text-neutral-500">ms</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-semibold">
                  {isEcgActive ? 'NARROW (<100)' : 'NO SIGNAL'}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-neutral-500">
                {isEcgActive ? 'VENTRICULAR CONDUCTION' : 'HARDWARE DISCONNECTED'}
              </div>
            </div>

            {/* 5. PR Interval */}
            <div className="border border-red-200/90 bg-white p-2.5 shadow-2xs">
              <div className="font-mono text-[10px] text-neutral-500">PR INTERVAL</div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-base font-semibold text-[#141517]">
                  {isEcgActive && prIntervalMs !== null ? `${prIntervalMs} ` : '-- '}
                  <span className="text-xs font-normal text-neutral-500">ms</span>
                </span>
                <span className="text-[10px] text-neutral-600">
                  {isEcgActive ? 'AV CONDUCTION' : 'NO SIGNAL'}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-neutral-500">
                {isEcgActive ? 'REF: 120–200 ms' : 'HARDWARE DISCONNECTED'}
              </div>
            </div>

            {/* 6. QTc Interval (Bazett) */}
            <div className="border border-red-200/90 bg-white p-2.5 shadow-2xs">
              <div className="font-mono text-[10px] text-neutral-500">QTc (BAZETT)</div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-base font-semibold text-[#141517]">
                  {isEcgActive && qtcIntervalMs !== null ? `${qtcIntervalMs} ` : '-- '}
                  <span className="text-xs font-normal text-neutral-500">ms</span>
                </span>
                <span className="text-[10px] text-neutral-500">
                  {isEcgActive ? 'NORMAL (<440)' : 'NO SIGNAL'}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-neutral-500">
                {isEcgActive ? 'REPOLARIZATION' : 'HARDWARE DISCONNECTED'}
              </div>
            </div>

            {/* 7. ST Segment Deviation */}
            <div className="border border-red-200/90 bg-white p-2.5 shadow-2xs">
              <div className="font-mono text-[10px] text-neutral-500">ST DEVIATION</div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-base font-semibold text-[#141517]">
                  {isEcgActive && stDeviationMv !== null
                    ? `${stDeviationMv >= 0 ? `+${stDeviationMv.toFixed(2)}` : stDeviationMv.toFixed(2)} `
                    : '0.00 '}
                  <span className="text-xs font-normal text-neutral-500">mV</span>
                </span>
                <span className="text-[10px] text-neutral-500">
                  {isEcgActive ? 'ISOELECTRIC' : 'FLATLINE'}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-neutral-500">
                {isEcgActive ? 'REF: ±0.05 mV' : 'HARDWARE DISCONNECTED'}
              </div>
            </div>

            {/* 8. Cortico-Cardiac Coherence (Phase Synchrony between EEG & ECG) */}
            <div className="border border-red-200/90 bg-white p-2.5 shadow-2xs">
              <div className="font-mono text-[10px] text-red-950 font-semibold flex items-center justify-between">
                <span>CORTICO-CARDIAC COHERENCE</span>
                <Zap className={`h-3 w-3 ${isEcgActive ? 'text-red-600' : 'text-neutral-400'}`} />
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-base font-bold text-red-900">
                  {isEcgActive && coherenceScore !== null ? `${coherenceScore.toFixed(2)}` : '--'}
                  <span className="text-xs font-normal text-neutral-500"> /1.0</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-semibold">
                  {isEcgActive ? (coherenceScore && coherenceScore > 0.8 ? 'SYNCHRONIZED' : 'DECOUPLED') : 'DISCONNECTED'}
                </span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-neutral-500">
                {isEcgActive ? 'THETA ↔ R-R COUPLING' : 'HARDWARE DISCONNECTED'}
              </div>
            </div>
          </div>

          {/* Clinical Rhythm Interpretation Banner */}
          <div className="mt-2.5 border border-red-200 bg-red-50/60 p-2.5 font-mono text-xs text-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${isEcgActive ? 'text-emerald-700' : 'text-neutral-500'}`} />
              <div>
                <span className="font-semibold text-red-950">RHYTHM DIAGNOSIS:</span>{' '}
                <span className="text-neutral-800">
                  {isEcgActive
                    ? cardiacSpecs.rhythm
                    : 'HARDWARE DISCONNECTED // NO ECG READINGS OR WAVEFORMS'}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-neutral-600 sm:text-right">
              <span className="font-medium text-neutral-800">AUTONOMIC PROFILE:</span>{' '}
              {isEcgActive ? cardiacSpecs.autonomicTone : 'NO TRANSDUCER DETECTED (STANDBY)'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
