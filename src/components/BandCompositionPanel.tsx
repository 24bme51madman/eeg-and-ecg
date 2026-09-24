import { FC, useState, useEffect, useMemo } from 'react';
import { Activity, BarChart2 } from 'lucide-react';
import { EegSource, HardwareEegData, ConnectionStatus } from '../types';
import { PatientModeConfig, PATIENT_MODES } from '../data/patientModesData';

interface BandCompositionPanelProps {
  source: EegSource;
  patientModeId: number;
  hardwareData: HardwareEegData | null;
  hwStatus: ConnectionStatus;
  leadsOff?: boolean;
}

interface BandMetric {
  id: 'delta' | 'theta' | 'alpha' | 'beta';
  name: string;
  greek: string;
  rangeHz: string;
  percent: number; // 0 to 100
  rawPower: number; // raw magnitude in µV² / relative power
  colorBg: string;
  colorFill: string;
  colorBorder: string;
  colorText: string;
  colorBadgeBg: string;
  colorLightBg: string;
  description: string;
}

export const BandCompositionPanel: FC<BandCompositionPanelProps> = ({
  source,
  patientModeId,
  hardwareData,
  hwStatus,
  leadsOff,
}) => {
  // Current patient mode configuration
  const activePatientMode: PatientModeConfig = useMemo(() => {
    return PATIENT_MODES[patientModeId] || PATIENT_MODES[1];
  }, [patientModeId]);

  // Reactive state for the computed 4-band values
  const [bandValues, setBandValues] = useState<{
    delta: { pct: number; raw: number };
    theta: { pct: number; raw: number };
    alpha: { pct: number; raw: number };
    beta: { pct: number; raw: number };
  }>({
    delta: { pct: 0, raw: 0 },
    theta: { pct: 0, raw: 0 },
    alpha: { pct: 0, raw: 0 },
    beta: { pct: 0, raw: 0 },
  });

  const [tick, setTick] = useState<number>(0);

  // Check if leads are off or if disconnected in live mode
  const isLeadsDisconnected = useMemo(() => {
    if (source === 'live') {
      if (leadsOff !== undefined) return leadsOff;
      if (!hardwareData) return true;
      if (hardwareData.leadsOff) return true;
      return false;
    }
    return false;
  }, [source, leadsOff, hardwareData]);

  // Refresh cycle (every ~350ms, matching 200-500ms requirement and ESP32 polling cycle)
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 10000);
    }, 350);

    return () => clearInterval(timer);
  }, []);

  // Update band composition whenever tick, source, patientMode, or hardwareData changes
  useEffect(() => {
    // ─── CASE A: LIVE DEVICE ───
    if (source === 'live') {
      // If hardware is not connected, data is absent, or leadsOff is true -> 0% placeholders
      if (!hardwareData || hardwareData.leadsOff || isLeadsDisconnected) {
        setBandValues({
          delta: { pct: 0, raw: 0 },
          theta: { pct: 0, raw: 0 },
          alpha: { pct: 0, raw: 0 },
          beta: { pct: 0, raw: 0 },
        });
        return;
      }

      // Compute from the real FFT band-power output returned by the ESP32 at /data
      const rawDelta = Math.max(0, Number(hardwareData.delta ?? 0));
      const rawTheta = Math.max(0, Number(hardwareData.theta ?? 0));
      const rawAlpha = Math.max(0, Number(hardwareData.alpha ?? 0));
      const rawBeta = Math.max(0, Number(hardwareData.beta ?? 0));
      const rawSum = rawDelta + rawTheta + rawAlpha + rawBeta;

      if (rawSum <= 0.0001) {
        setBandValues({
          delta: { pct: 0, raw: rawDelta },
          theta: { pct: 0, raw: rawTheta },
          alpha: { pct: 0, raw: rawAlpha },
          beta: { pct: 0, raw: rawBeta },
        });
        return;
      }

      // Normalize to sum exactly 100.0%
      const pDelta = parseFloat(((rawDelta / rawSum) * 100).toFixed(1));
      const pTheta = parseFloat(((rawTheta / rawSum) * 100).toFixed(1));
      const pAlpha = parseFloat(((rawAlpha / rawSum) * 100).toFixed(1));
      // Anchor remaining to beta to guarantee exact 100.0% sum
      const pBeta = parseFloat(Math.max(0, 100 - pDelta - pTheta - pAlpha).toFixed(1));

      setBandValues({
        delta: { pct: pDelta, raw: rawDelta },
        theta: { pct: pTheta, raw: rawTheta },
        alpha: { pct: pAlpha, raw: rawAlpha },
        beta: { pct: pBeta, raw: rawBeta },
      });
      return;
    }

    // ─── CASE B: SIMULATION ───
    // Computed from selected Patient Mode's band weights + organic physiological jitter
    const ratios = activePatientMode.ratios;
    const amp = activePatientMode.amplitudeScale || 1.0;

    // Organic small jitter centered around 0 (±4%)
    const jitterD = (Math.sin(tick * 0.45) * 1.8 + (Math.random() - 0.5) * 2.2);
    const jitterT = (Math.cos(tick * 0.6) * 1.5 + (Math.random() - 0.5) * 1.8);
    const jitterA = (Math.sin(tick * 0.85) * 2.4 + (Math.random() - 0.5) * 2.0);
    const jitterB = (Math.cos(tick * 1.1) * 1.6 + (Math.random() - 0.5) * 1.9);

    // Apply jitter to the 4 band weights (clamped to positive)
    const weightD = Math.max(0.5, (ratios.delta || 10) + jitterD);
    const weightT = Math.max(0.5, (ratios.theta || 15) + jitterT);
    const weightA = Math.max(0.5, (ratios.alpha || 50) + jitterA);
    const weightB = Math.max(0.5, (ratios.beta || 20) + jitterB);

    const totalWeight = weightD + weightT + weightA + weightB;

    // Normalize so the 4 values sum to exactly 100.0%
    const pctD = parseFloat(((weightD / totalWeight) * 100).toFixed(1));
    const pctT = parseFloat(((weightT / totalWeight) * 100).toFixed(1));
    const pctA = parseFloat(((weightA / totalWeight) * 100).toFixed(1));
    const pctB = parseFloat(Math.max(0, 100 - pctD - pctT - pctA).toFixed(1));

    // Calculate realistic relative power magnitude (µV²) based on mode amplitude
    const rawPowerD = parseFloat(((weightD / 25) * 24.5 * amp + (Math.random() - 0.5) * 1.2).toFixed(2));
    const rawPowerT = parseFloat(((weightT / 25) * 16.8 * amp + (Math.random() - 0.5) * 0.9).toFixed(2));
    const rawPowerA = parseFloat(((weightA / 25) * 28.4 * amp + (Math.random() - 0.5) * 1.5).toFixed(2));
    const rawPowerB = parseFloat(((weightB / 25) * 14.2 * amp + (Math.random() - 0.5) * 1.1).toFixed(2));

    setBandValues({
      delta: { pct: pctD, raw: Math.max(0, rawPowerD) },
      theta: { pct: pctT, raw: Math.max(0, rawPowerT) },
      alpha: { pct: pctA, raw: Math.max(0, rawPowerA) },
      beta: { pct: pctB, raw: Math.max(0, rawPowerB) },
    });
  }, [tick, source, activePatientMode, hardwareData, isLeadsDisconnected]);

  // 4 Standard clinical bands with consistent color palette:
  // Delta = deep blue, Theta = purple, Alpha = green, Beta = orange
  const bands: BandMetric[] = [
    {
      id: 'delta',
      name: 'Delta',
      greek: 'δ',
      rangeHz: '0.5 – 4.0 Hz',
      percent: bandValues.delta.pct,
      rawPower: bandValues.delta.raw,
      colorBg: 'bg-blue-600',
      colorFill: 'bg-blue-600',
      colorBorder: 'border-blue-600',
      colorText: 'text-blue-700',
      colorBadgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      colorLightBg: 'bg-blue-50/50',
      description: 'Slow-wave sleep & autonomic reset',
    },
    {
      id: 'theta',
      name: 'Theta',
      greek: 'θ',
      rangeHz: '4.0 – 8.0 Hz',
      percent: bandValues.theta.pct,
      rawPower: bandValues.theta.raw,
      colorBg: 'bg-purple-600',
      colorFill: 'bg-purple-600',
      colorBorder: 'border-purple-600',
      colorText: 'text-purple-700',
      colorBadgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      colorLightBg: 'bg-purple-50/50',
      description: 'Working memory & hippocampal gating',
    },
    {
      id: 'alpha',
      name: 'Alpha',
      greek: 'α',
      rangeHz: '8.0 – 13.0 Hz',
      percent: bandValues.alpha.pct,
      rawPower: bandValues.alpha.raw,
      colorBg: 'bg-emerald-600',
      colorFill: 'bg-emerald-600',
      colorBorder: 'border-emerald-600',
      colorText: 'text-emerald-700',
      colorBadgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      colorLightBg: 'bg-emerald-50/50',
      description: 'Alert relaxation & idle sensory gating',
    },
    {
      id: 'beta',
      name: 'Beta',
      greek: 'β',
      rangeHz: '13.0 – 30.0 Hz',
      percent: bandValues.beta.pct,
      rawPower: bandValues.beta.raw,
      colorBg: 'bg-[#E06915]',
      colorFill: 'bg-[#E06915]',
      colorBorder: 'border-[#E06915]',
      colorText: 'text-[#E06915]',
      colorBadgeBg: 'bg-orange-50 text-orange-900 border-orange-200',
      colorLightBg: 'bg-orange-50/50',
      description: 'Active cognition, vigilance & motor control',
    },
  ];

  // Calculate live sum to verify ~100% normalization
  const sumPercent = useMemo(() => {
    const total = bands.reduce((acc, b) => acc + b.percent, 0);
    return Math.round(total * 10) / 10;
  }, [bands]);

  // Find dominant band
  const dominantBand = useMemo(() => {
    if (isLeadsDisconnected || sumPercent === 0) return null;
    return [...bands].sort((a, b) => b.percent - a.percent)[0];
  }, [bands, isLeadsDisconnected, sumPercent]);

  return (
    <div
      id="band-composition-panel"
      className="border border-neutral-300 bg-white p-3.5 sm:p-4 shadow-2xs font-sans transition-all"
    >
      {/* ─── PANEL HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[#D96514]" />
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-tight text-[#141517]">
              <span>REAL-TIME BAND COMPOSITION</span>
              <span className="text-neutral-400 font-normal">|</span>
              <span className="text-neutral-600 font-medium">FFT SPECTRAL POWER</span>
            </div>
          </div>
        </div>

        {/* Source Badge & Refresh Indicator */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {isLeadsDisconnected ? (
            <div className="flex items-center gap-1.5 border border-rose-300 bg-rose-50 px-2 py-0.5 text-rose-800 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
              <span>LEADS OFF // 0% PLACEHOLDER</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                {source === 'live' ? 'LIVE ESP32 /DATA' : `SIM: MODE ${patientModeId}`}
              </span>
            </div>
          )}

          {/* Normalization indicator badge */}
          <div
            className={`border px-2 py-0.5 font-semibold ${
              isLeadsDisconnected
                ? 'border-neutral-200 bg-neutral-100 text-neutral-500'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            SUM: {sumPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* ─── STACKED CONTINUOUS 100% SPECTRUM DISTRIBUTION BAR ─── */}
      <div className="mt-3">
        <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500 mb-1">
          <span>NORMALIZED POWER DISTRIBUTION (100% SPECTRUM)</span>
          {dominantBand && !isLeadsDisconnected && (
            <span className="font-semibold text-neutral-800">
              DOMINANT:{' '}
              <span className={dominantBand.colorText}>
                {dominantBand.name.toUpperCase()} ({dominantBand.percent}%)
              </span>
            </span>
          )}
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-xs bg-neutral-200 shadow-inner">
          {isLeadsDisconnected ? (
            <div className="h-full w-full bg-neutral-300/80" />
          ) : (
            bands.map((band) => (
              <div
                key={band.id}
                className={`${band.colorBg} transition-all duration-300 ease-out`}
                style={{ width: `${Math.max(0, band.percent)}%` }}
                title={`${band.name} (${band.rangeHz}): ${band.percent}%`}
              />
            ))
          )}
        </div>
      </div>

      {/* ─── 4 LIVE HORIZONTAL PROGRESS BARS ─── */}
      <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {bands.map((band) => {
          return (
            <div
              key={band.id}
              className={`border border-neutral-200 ${band.colorLightBg} p-2.5 transition-all hover:border-neutral-300 shadow-2xs`}
            >
              {/* Top Row: Name, Greek Symbol, and Range */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-[#141517]">
                    {band.name}
                  </span>
                  <span
                    className={`border px-1 py-0.2 font-mono text-[10px] font-semibold ${band.colorBadgeBg}`}
                  >
                    {band.greek}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500">
                  {band.rangeHz}
                </span>
              </div>

              {/* Middle Row: Large Percentage Value */}
              <div className="mt-1.5 flex items-baseline justify-between font-mono">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-bold tracking-tight ${
                      isLeadsDisconnected ? 'text-neutral-400' : band.colorText
                    } transition-colors duration-200`}
                  >
                    {band.percent.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">%</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {isLeadsDisconnected ? 'LEAD OFF' : 'NORMALIZED'}
                </span>
              </div>

              {/* Horizontal Progress Bar */}
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-xs bg-neutral-200/90 shadow-inner">
                <div
                  className={`h-full ${band.colorFill} transition-all duration-300 ease-out`}
                  style={{
                    width: `${isLeadsDisconnected ? 0 : Math.min(100, Math.max(0, band.percent))}%`,
                  }}
                />
              </div>

              {/* Bottom Row: Raw Relative Power Readout */}
              <div className="mt-2 flex items-center justify-between border-t border-neutral-200/70 pt-1.5 font-mono text-[10px]">
                <span className="text-neutral-500">RAW POWER:</span>
                <span className="font-semibold text-neutral-800">
                  {isLeadsDisconnected ? (
                    <span className="text-neutral-400">0.00 µV²</span>
                  ) : (
                    <span>
                      {band.rawPower.toFixed(2)}{' '}
                      <span className="font-normal text-neutral-500">µV²</span>
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── FOOTER SUB-TELEMETRY ─── */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/80 pt-2 font-mono text-[10px] text-neutral-500">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-neutral-400" />
          <span>
            {source === 'live'
              ? 'ESP32 ON-CHIP FFT POWER SPECTRAL DENSITY // HTTP REFRESH'
              : `PATIENT PROFILE #${patientModeId}: ${activePatientMode.name.toUpperCase()}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>DELTA (0.5-4Hz) • THETA (4-8Hz) • ALPHA (8-13Hz) • BETA (13-30Hz)</span>
          <span className="hidden sm:inline text-neutral-400">|</span>
          <span className="hidden sm:inline text-neutral-600">
            REFRESH: ~350ms
          </span>
        </div>
      </div>
    </div>
  );
};
