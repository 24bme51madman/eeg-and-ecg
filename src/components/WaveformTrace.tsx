import { useEffect, useRef, useState, FC } from 'react';
import { Play, Pause, RotateCcw, Activity, ShieldCheck, Zap, Radio, CheckCircle2, Download, BellRing, Cpu, Settings, AlertTriangle } from 'lucide-react';
import { BrainwaveBandId, CognitiveStatePreset } from '../types';
import { BRAINWAVE_BANDS, COGNITIVE_PRESETS } from '../data/specsData';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { useCognitiveAlerts } from '../context/CognitiveAlertContext';
import { PATIENT_MODES, PATIENT_CATEGORIES } from '../data/patientModesData';
import { EcgWaveformTrace } from './EcgWaveformTrace';

interface WaveformTraceProps {
  selectedBand?: BrainwaveBandId | 'all';
  activePreset?: CognitiveStatePreset;
  onSelectPreset?: (preset: CognitiveStatePreset) => void;
}

export const WaveformTrace: FC<WaveformTraceProps> = ({
  selectedBand = 'all',
  activePreset = 'deep_focus',
  onSelectPreset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [activeChannel, setActiveChannel] = useState<string>('Fp1-Fp2');
  const [currentMicrovolts, setCurrentMicrovolts] = useState<number>(14.2);
  const [currentDominantHz, setCurrentDominantHz] = useState<number>(10.2);

  const {
    status: hwStatus,
    latestPacket,
    isSimulated,
    source,
    setSource,
    patientModeId,
    setPatientModeId,
    hardwareData,
    mode,
    setMode,
    endpoint,
    packetsTotal,
    sampleRateHz,
    electrodes,
    setIsModalOpen,
    sessionStats,
    setIsDownloadModalOpen,
    downloadSessionLog,
  } = useHardwareConnection();

  const {
    toggleSidebar,
    unreadAlertCount,
    latestPulse,
    simulateAlert,
  } = useCognitiveAlerts();

  const preset = COGNITIVE_PRESETS.find((p) => p.id === activePreset) || COGNITIVE_PRESETS[1];
  const activePatientMode = PATIENT_MODES[patientModeId] || PATIENT_MODES[1];

  // Synchronous refs for animation loop
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const patientModeIdRef = useRef(patientModeId);
  patientModeIdRef.current = patientModeId;
  const latestPacketRef = useRef(latestPacket);
  latestPacketRef.current = latestPacket;
  const hardwareDataRef = useRef(hardwareData);
  hardwareDataRef.current = hardwareData;
  const activeChannelRef = useRef(activeChannel);
  activeChannelRef.current = activeChannel;
  const selectedBandRef = useRef(selectedBand);
  selectedBandRef.current = selectedBand;
  const hwStatusRef = useRef(hwStatus);
  hwStatusRef.current = hwStatus;
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let lastUvUpdateTime = 0;

    // Buffer for rolling strip-chart
    const width = canvas.parentElement?.clientWidth || 720;
    const height = 240;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const history: number[] = new Array(Math.floor(width)).fill(0);

    const render = () => {
      if (isRunningRef.current) {
        time += 0.035 * speedRef.current;

        let val = 0;
        const curSource = sourceRef.current;
        const curPatientId = patientModeIdRef.current;
        const curMode = PATIENT_MODES[curPatientId] || PATIENT_MODES[1];
        const statusNow = hwStatusRef.current;
        const pkt = latestPacketRef.current;
        const hw = hardwareDataRef.current;
        const ch = activeChannelRef.current;
        const curBand = selectedBandRef.current;

        // Source branch: "Live Device" vs "Simulation"
        if (curSource === 'live') {
          // Live Device: fetch real data from ESP32 as currently implemented
          if (statusNow === 'connected' && pkt) {
            if (ch === 'CH1 (Fp1)') {
              val = pkt.ch1;
            } else if (ch === 'CH2 (Fp2)') {
              val = pkt.ch2;
            } else if (ch === 'REF') {
              val = pkt.ref;
            } else {
              // Bipolar differential Fp1 - Fp2
              val = pkt.ch1 - pkt.ch2;
            }
          } else if (hw) {
            val = hw.raw;
          } else {
            // Baseline noise waiting for hardware packets
            val = (Math.random() - 0.5) * 1.5;
          }
        } else {
          // Simulation: use the Patient Mode dropdown to generate synthetic data
          const { ratios, amplitudeScale } = curMode;
          const noise = (Math.random() - 0.5) * 2.2;

          const deltaVal = (Math.sin(time * 2.1) * 44 + Math.cos(time * 1.1) * 16) * (ratios.delta / 25);
          const thetaVal = (Math.sin(time * 5.8) * 26 + Math.sin(time * 4.6) * 12) * (ratios.theta / 25);
          const alphaEnv = (Math.sin(time * 0.75) + 1.25) * 0.44;
          const alphaVal = (Math.sin(time * 10.2) * 28 * alphaEnv) * (ratios.alpha / 25);
          const betaVal = (Math.sin(time * 22.0) * 14 + Math.sin(time * 17.5) * 8 + noise * 1.8) * (ratios.beta / 25);
          const gammaVal = (Math.sin(time * 38.0) * 6 + Math.sin(time * 45.0) * 4) * (ratios.gamma / 20);

          if (curBand === 'delta') {
            val = deltaVal * amplitudeScale;
          } else if (curBand === 'theta') {
            val = thetaVal * amplitudeScale;
          } else if (curBand === 'alpha') {
            val = alphaVal * amplitudeScale;
          } else if (curBand === 'beta') {
            val = betaVal * amplitudeScale;
          } else if (curBand === 'gamma') {
            val = gammaVal * amplitudeScale;
          } else {
            if (curMode.id === 48) {
              // Brain Death Pattern flatline (<2 uV)
              val = ((Math.random() - 0.5) * 0.8 + Math.sin(time * 0.3) * 0.3);
            } else if (curMode.id === 22) {
              // Absence Seizure: periodic 3 Hz spike-and-wave discharges
              const burstCycle = (time * 1.2) % 6;
              if (burstCycle < 1.8) {
                const phase = (time * 18.84) % (2 * Math.PI);
                const spike = Math.exp(-Math.pow((phase - Math.PI) * 4, 2)) * 75;
                const wave = Math.sin(phase) * 32;
                val = (spike - wave) * amplitudeScale;
              } else {
                val = (deltaVal * 0.5 + alphaVal * 0.8 + noise) * amplitudeScale;
              }
            } else if (curMode.id === 46) {
              // General Anesthesia: burst suppression
              const period = (time * 0.8) % 5;
              if (period > 3.2) {
                val = noise * 0.35;
              } else {
                val = (deltaVal * 1.4 + alphaVal * 1.1 + noise * 0.5) * amplitudeScale;
              }
            } else {
              val = (deltaVal + thetaVal + alphaVal + betaVal + gammaVal + noise) * amplitudeScale;
            }
          }
        }

        history.push(val);
        if (history.length > width) {
          history.shift();
        }

        if (time - lastUvUpdateTime > 0.35) {
          lastUvUpdateTime = time;
          setCurrentMicrovolts(parseFloat(val.toFixed(1)));
          if (curSource === 'simulation') {
            setCurrentDominantHz(curMode.dominantFreqHz);
          } else {
            setCurrentDominantHz(10.2);
          }
        }
      }

      // Draw Paper Strip Chart
      ctx.clearRect(0, 0, width, height);

      // 1. Chart background paper tint
      ctx.fillStyle = '#F4F2EC';
      ctx.fillRect(0, 0, width, height);

      // 2. Ruled millimeter grid lines
      ctx.strokeStyle = 'rgba(20, 21, 23, 0.06)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const centerY = height / 2;
      for (let y = 0; y <= height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center baseline zero voltage reference line
      ctx.strokeStyle = 'rgba(20, 21, 23, 0.16)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // 3. Calibration scale bar (bottom-left)
      ctx.fillStyle = '#141517';
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillText('0.0 µV BASELINE', 12, centerY - 4);
      ctx.fillText('+50 µV', 12, centerY - 50);
      ctx.fillText('-50 µV', 12, centerY + 54);

      // Calibration step marker (standard 50µV pulse box)
      ctx.strokeStyle = '#141517';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(width - 90, centerY);
      ctx.lineTo(width - 75, centerY);
      ctx.lineTo(width - 75, centerY - 30);
      ctx.lineTo(width - 55, centerY - 30);
      ctx.lineTo(width - 55, centerY);
      ctx.lineTo(width - 40, centerY);
      ctx.stroke();
      ctx.fillText('50µV / 1s CAL', width - 88, centerY + 16);

      // 4. Draw actual animated EEG waveform trace in Signal Amber
      ctx.strokeStyle = '#D96514';
      ctx.lineWidth = 1.75;
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

      // 5. Sweep point / stylus needle indicator at head of signal
      const lastX = history.length - 1;
      const lastY = centerY - history[lastX];

      ctx.fillStyle = '#D96514';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(217, 101, 20, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lastX, 0);
      ctx.lineTo(lastX, height);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement.clientWidth;
      const height = 240;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      id="waveform-recorder-panel"
      className="w-full border border-neutral-300 bg-[#FAF9F5] p-3 sm:p-5"
    >
      {/* Channel A header banner */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs border-b border-neutral-300 pb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#D96514] animate-pulse" />
          <span className="font-bold tracking-tight text-[#141517]">
            PHYSIOLOGICAL CHANNEL A // ELECTROENCEPHALOGRAPHY (EEG) &amp; CORTICAL COGNITION
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-600">
          <span className="border border-neutral-300 bg-white px-2 py-0.5">
            LEADS: FP1 (L), FP2 (R), EAR REF
          </span>
          <span className="border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-900 font-semibold">
            24-BIT ADS1299 DELTA-SIGMA
          </span>
        </div>
      </div>

      {/* Persistent Red Banner when Source = Simulation */}
      {source === 'simulation' && (
        <div
          id="simulation-reference-banner"
          role="alert"
          className="mb-3 flex items-center justify-center gap-2.5 border border-red-700 bg-red-600 px-3 py-2 text-center font-mono text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white shadow-xs"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-white animate-pulse" />
          <span>
            SIMULATED REFERENCE PATTERN — illustrative only, not derived from a real patient or diagnostic device.
          </span>
        </div>
      )}

      {/* Primary Dashboard Controls: 1. Source Toggle & 2. Patient Mode Dropdown */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-neutral-300 bg-white p-2.5 sm:p-3 shadow-2xs">
        {/* 1. "Source" Toggle: "Live Device" vs "Simulation" */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase text-neutral-800 tracking-tight">
            SOURCE:
          </span>
          <div className="inline-flex border border-neutral-400 bg-neutral-100 p-0.5 font-mono text-xs shadow-inner">
            <button
              id="source-toggle-live-device"
              type="button"
              onClick={() => setSource('live')}
              className={`flex items-center gap-1.5 px-3 py-1 font-bold transition-all ${
                source === 'live'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-white hover:text-black'
              }`}
              title="Live Device: Fetch real data from ESP32 & AD8232 front-end as currently implemented"
            >
              <Radio className={`h-3.5 w-3.5 ${source === 'live' ? 'text-white' : 'text-neutral-500'}`} />
              <span>Live Device</span>
              {source === 'live' && (
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              )}
            </button>

            <button
              id="source-toggle-simulation"
              type="button"
              onClick={() => setSource('simulation')}
              className={`flex items-center gap-1.5 px-3 py-1 font-bold transition-all ${
                source === 'simulation'
                  ? 'bg-[#141517] text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-white hover:text-black'
              }`}
              title="Simulation: Use the Patient Mode dropdown to generate synthetic data"
            >
              <Cpu className={`h-3.5 w-3.5 ${source === 'simulation' ? 'text-amber-400' : 'text-neutral-500'}`} />
              <span>Simulation</span>
              {source === 'simulation' && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          {source === 'live' && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 border border-neutral-300 bg-neutral-50 px-2 py-1 font-mono text-[11px] text-neutral-700 hover:border-neutral-500 transition-colors"
              title="Configure Hardware Link Endpoint"
            >
              <Settings className="h-3 w-3 text-[#D96514]" />
              <span className="font-semibold uppercase text-[#141517]">{mode}</span>
            </button>
          )}
        </div>

        {/* 2. "Patient Mode" Dropdown (only active/visible when Source = Simulation) */}
        {source === 'simulation' && (
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="patient-mode-dropdown"
              className="font-mono text-xs font-bold uppercase text-neutral-800 tracking-tight"
            >
              PATIENT MODE:
            </label>
            <select
              id="patient-mode-dropdown"
              value={patientModeId}
              onChange={(e) => setPatientModeId(Number(e.target.value))}
              className="cursor-pointer border-2 border-[#141517] bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-[#141517] shadow-xs hover:border-[#D96514] focus:border-[#D96514] focus:outline-none max-w-[280px] sm:max-w-xs md:max-w-md truncate"
              title="Select one of 50 physiological reference patterns"
            >
              {PATIENT_CATEGORIES.map((cat) => (
                <optgroup
                  key={cat.category}
                  label={cat.category}
                  className="font-bold text-neutral-900 bg-neutral-200 py-1"
                >
                  {cat.modeIds.map((id) => {
                    const m = PATIENT_MODES[id];
                    return (
                      <option key={id} value={id} className="font-medium text-neutral-800 bg-white py-1">
                        {m.id}. {m.name}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Patient Mode Synthetic Profile Breakdown Card (Active in Simulation) */}
      {source === 'simulation' && (
        <div className="mb-3 border border-neutral-300 bg-white p-2.5 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-[#141517] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                MODE #{activePatientMode.id} // {activePatientMode.category}
              </span>
              <strong className="text-neutral-900">{activePatientMode.name}</strong>
            </div>
            <div className="text-[11px] text-neutral-600">
              DOMINANT FREQ: <strong className="text-[#141517]">{activePatientMode.dominantFreqHz} Hz</strong>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-neutral-500 font-semibold">FIXED BAND RATIOS:</span>
              <span className="border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-medium text-neutral-800">
                δ Delta: <strong className="text-amber-800">{activePatientMode.ratios.delta}%</strong>
              </span>
              <span className="border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-medium text-neutral-800">
                θ Theta: <strong className="text-blue-800">{activePatientMode.ratios.theta}%</strong>
              </span>
              <span className="border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-medium text-neutral-800">
                α Alpha: <strong className="text-emerald-800">{activePatientMode.ratios.alpha}%</strong>
              </span>
              <span className="border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-medium text-neutral-800">
                β Beta: <strong className="text-purple-800">{activePatientMode.ratios.beta}%</strong>
              </span>
              <span className="border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-medium text-neutral-800">
                γ Gamma: <strong className="text-red-800">{activePatientMode.ratios.gamma}%</strong>
              </span>
            </div>
            <div className="text-[10px] text-neutral-500 italic max-w-md truncate">
              {activePatientMode.description}
            </div>
          </div>
        </div>
      )}

      {/* Top telemetry and status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-neutral-600">
            CH: <strong className="text-[#141517]">{activeChannel}</strong>
          </span>
          <span className="hidden font-mono text-neutral-400 sm:inline">|</span>
          <span className="hidden font-mono text-neutral-600 sm:inline">
            FS: <strong>{source === 'live' && hwStatus === 'connected' ? `${sampleRateHz} S/s` : '250 S/s'}</strong>
          </span>
          <span className="hidden font-mono text-neutral-400 sm:inline">|</span>
          <span className="font-mono text-neutral-600">
            SOURCE:{' '}
            <strong className="uppercase text-[#141517]">
              {source === 'live' ? 'Live ESP32 / AD8232' : `Simulation (Mode ${patientModeId})`}
            </strong>
          </span>
        </div>

        {/* Real-time telemetry stamps & 3-electrode impedance readout */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <div className="border border-neutral-200 bg-white px-2 py-0.5 text-neutral-800">
            POTENTIAL:{' '}
            <span
              className={
                currentMicrovolts >= 0
                  ? 'font-semibold text-[#D96514]'
                  : 'font-semibold text-neutral-900'
              }
            >
              {currentMicrovolts > 0 ? `+${currentMicrovolts}` : currentMicrovolts} µV
            </span>
          </div>

          <div className="border border-neutral-200 bg-white px-2 py-0.5 text-neutral-800">
            PEAK: <span className="font-semibold text-[#141517]">{currentDominantHz} Hz</span>
          </div>

          {/* 3-Electrode contact impedance quick check */}
          <div className="hidden border border-neutral-200 bg-white px-2 py-0.5 text-neutral-800 lg:flex items-center gap-2">
            <span>IMPEDANCES:</span>
            <span className="text-emerald-800 font-semibold">E1:{electrodes[0].impedanceKOhms}k</span>
            <span className="text-emerald-800 font-semibold">E2:{electrodes[1].impedanceKOhms}k</span>
            <span className="text-neutral-700">REF:{electrodes[2].impedanceKOhms}k</span>
          </div>
        </div>
      </div>

      {/* Canvas chart recorder area */}
      <div className="relative mt-3 w-full overflow-hidden border border-neutral-300">
        <canvas
          ref={canvasRef}
          className="block h-[220px] w-full sm:h-[240px]"
          style={{ width: '100%' }}
        />

        {/* Channel indicator badge */}
        <div className="absolute top-2 left-3 rounded-none border border-neutral-300 bg-[#FAF9F5]/90 px-1.5 py-0.5 font-mono text-[10px] text-neutral-700 backdrop-blur-xs">
          FILTER: {selectedBand.toUpperCase()} | 3-ELECTRODE TRANSDUCER
        </div>

        {/* Active state / hardware source overlay */}
        <div className="absolute top-2 right-3 rounded-none border border-[#D96514]/40 bg-white/95 px-2 py-0.5 font-mono text-[10px] text-[#D96514] flex items-center gap-1.5">
          {hwStatus === 'connected' ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>LINK: {isSimulated ? 'BENCH SIM' : endpoint} ({packetsTotal} PKTS)</span>
            </>
          ) : (
            <span>STATE: {preset.label.split('(')[0].trim().toUpperCase()}</span>
          )}
        </div>
      </div>

      {/* Control row & 3-electrode channel montage picker */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
        {/* Playback & speed controls */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-playback-btn"
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 border border-neutral-400 bg-white px-2.5 py-1 font-mono text-xs font-medium text-[#141517] hover:bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#D96514]"
            aria-label={isRunning ? 'Pause signal trace' : 'Resume signal trace'}
          >
            {isRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" /> PAUSE
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> RUN
              </>
            )}
          </button>

          <div className="flex items-center border border-neutral-300 font-mono text-xs">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 ${
                  speed === s
                    ? 'bg-[#141517] text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* 3-Electrode Montage Selector */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-neutral-500">3-ELECTRODE LEAD:</span>
            {['Fp1-Fp2', 'CH1 (Fp1)', 'CH2 (Fp2)', 'REF'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setActiveChannel(ch)}
                className={`border px-1.5 py-0.5 font-mono text-[11px] ${
                  activeChannel === ch
                    ? 'border-[#D96514] bg-[#D96514]/10 font-medium text-[#D96514]'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Cognitive preset selector & Download Log action */}
        <div className="flex flex-wrap items-center gap-2">
          {onSelectPreset && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-neutral-500">STATE:</span>
              {COGNITIVE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectPreset(p.id);
                    if (p.id === 'deep_focus') simulateAlert('deep_focus');
                    else if (p.id === 'high_stress') simulateAlert('acute_stress');
                    else if (p.id === 'deep_rest') simulateAlert('mindful_rest');
                  }}
                  className={`border px-2 py-1 font-mono text-[11px] transition-colors ${
                    activePreset === p.id
                      ? 'border-[#141517] bg-[#141517] text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {p.id === 'baseline'
                    ? 'Baseline'
                    : p.id === 'deep_focus'
                      ? 'High Focus'
                      : p.id === 'high_stress'
                        ? 'Acute Stress'
                        : 'Deep Rest'}
                </button>
              ))}
            </div>
          )}

          {/* Cognitive Sentinel Alert Button */}
          <button
            id="trace-open-alerts-btn"
            type="button"
            onClick={toggleSidebar}
            className={`inline-flex items-center gap-1 border px-2 py-1 font-mono text-xs font-semibold transition-all ${
              latestPulse
                ? 'border-[#D96514] bg-[#D96514] text-white animate-pulse ring-2 ring-[#D96514]/30'
                : 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500'
            }`}
            title="Open Cognitive Alert Monitor Sidebar"
          >
            <BellRing className={`h-3 w-3 ${latestPulse ? 'text-white' : 'text-[#D96514]'}`} />
            <span>ALERTS</span>
            {unreadAlertCount > 0 && (
              <span className={`px-1 py-0.2 text-[9px] rounded-full font-bold ${
                latestPulse ? 'bg-black text-white' : 'bg-[#D96514] text-white'
              }`}>
                {unreadAlertCount}
              </span>
            )}
          </button>

          <button
            id="trace-download-session-btn"
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="inline-flex items-center gap-1.5 border border-[#D96514] bg-[#D96514] px-2.5 py-1 font-mono text-xs font-semibold text-white hover:bg-[#b8520e] transition-colors focus:outline-none"
            title="Export captured session biopotentials as CSV"
          >
            <Download className="h-3 w-3" />
            <span>EXPORT CSV</span>
            <span className="bg-black/30 px-1 py-0.2 text-[10px] text-white/90">
              {sessionStats.samplesRecorded > 0 ? `${sessionStats.samplesRecorded}` : '0'}
            </span>
          </button>
        </div>
      </div>

      {/* Quantified live classification readouts */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-neutral-200 pt-3 sm:grid-cols-4">
        <div className="border border-neutral-200 bg-white p-2">
          <div className="font-mono text-[10px] text-neutral-500">COGNITIVE LOAD (CLI)</div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-base font-semibold text-[#141517]">
              {preset.metrics.cognitiveLoad}
              <span className="text-xs font-normal text-neutral-500">/100</span>
            </span>
            <span
              className={`text-[10px] ${
                preset.metrics.cognitiveLoad > 70 ? 'text-[#D96514]' : 'text-neutral-500'
              }`}
            >
              {preset.metrics.cognitiveLoad > 70 ? 'HIGH WORKLOAD' : 'NOMINAL'}
            </span>
          </div>
        </div>

        <div className="border border-neutral-200 bg-white p-2">
          <div className="font-mono text-[10px] text-neutral-500">STRESS INDEX</div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-base font-semibold text-[#141517]">
              {preset.metrics.stressLevel}
              <span className="text-xs font-normal text-neutral-500">/100</span>
            </span>
            <span
              className={`text-[10px] ${
                preset.metrics.stressLevel > 60 ? 'text-red-700' : 'text-neutral-500'
              }`}
            >
              {preset.metrics.stressLevel > 60 ? 'SYMPATHETIC' : 'EUSTRESS'}
            </span>
          </div>
        </div>

        <div className="border border-neutral-200 bg-white p-2">
          <div className="font-mono text-[10px] text-neutral-500">AFFECTIVE VALENCE (FAA)</div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-base font-semibold text-[#141517]">
              {preset.metrics.valence > 0 ? `+${preset.metrics.valence}` : preset.metrics.valence}
            </span>
            <span className="text-[10px] text-neutral-500">
              {preset.metrics.valence > 0 ? 'APPROACH' : 'AVOIDANCE'}
            </span>
          </div>
        </div>

        <div className="border border-neutral-200 bg-white p-2">
          <div className="font-mono text-[10px] text-neutral-500">SIGNAL PURITY (SNR)</div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-base font-semibold text-[#141517]">
              +{preset.metrics.signalSnr}{' '}
              <span className="text-xs font-normal text-neutral-500">dB</span>
            </span>
            <span className="text-[10px] text-emerald-700">ARTIFACT REJECTED</span>
          </div>
        </div>
      </div>

      {/* ─── SYNCHRONIZED MULTIMODAL PHYSIOLOGICAL CHANNEL B: ECG WAVES & READINGS ─── */}
      <div className="mt-6 border-t-2 border-dashed border-neutral-300 pt-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span className="font-bold tracking-tight text-[#141517]">
              PHYSIOLOGICAL CHANNEL B // ELECTROCARDIOGRAPHY (ECG) &amp; AUTONOMIC TONE
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-600">
            <span className="hidden sm:inline border border-neutral-300 bg-white px-2 py-0.5">
              SYNCHRONIZED TO CORTICAL CLOCK (250 S/s)
            </span>
            <span className="border border-red-200 bg-red-50 px-2 py-0.5 text-red-900 font-semibold">
              ADS1299 AUX CARDIAC TRANSDUCER
            </span>
          </div>
        </div>

        {/* Live ECG Wave Display and Medical Readings */}
        <EcgWaveformTrace
          isRunning={isRunning}
          speed={speed}
          activePreset={activePreset}
          patientModeId={patientModeId}
          isSimulated={source === 'simulation'}
          hwStatus={hwStatus}
          latestPacket={latestPacket}
        />
      </div>
    </div>
  );
};

