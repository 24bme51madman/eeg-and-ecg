import { FC, useState, useEffect, useMemo } from 'react';
import { Zap, Info } from 'lucide-react';
import { EegSource, HardwareEegData, ConnectionStatus } from '../types';
import { PatientModeConfig, PATIENT_MODES } from '../data/patientModesData';

interface FocusIndicatorPanelProps {
  source: EegSource;
  patientModeId: number;
  hardwareData: HardwareEegData | null;
  hwStatus: ConnectionStatus;
  leadsOff?: boolean;
}

export const FocusIndicatorPanel: FC<FocusIndicatorPanelProps> = ({
  source,
  patientModeId,
  hardwareData,
  hwStatus,
  leadsOff,
}) => {
  const activePatientMode: PatientModeConfig = useMemo(() => {
    return PATIENT_MODES[patientModeId] || PATIENT_MODES[1];
  }, [patientModeId]);

  const [tick, setTick] = useState<number>(0);

  // Synchronized refresh cycle matching Band Composition panel (~350ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 10000);
    }, 350);
    return () => clearInterval(timer);
  }, []);

  // Check if leads are off in live mode
  const isLeadsDisconnected = useMemo(() => {
    if (source === 'live') {
      if (leadsOff !== undefined) return leadsOff;
      if (!hardwareData) return true;
      if (hardwareData.leadsOff) return true;
      return false;
    }
    return false;
  }, [source, leadsOff, hardwareData]);

  // Compute live Beta and Alpha band percentages
  const { alphaPct, betaPct } = useMemo(() => {
    if (source === 'live') {
      if (!hardwareData || hardwareData.leadsOff || isLeadsDisconnected) {
        return { alphaPct: 0, betaPct: 0 };
      }
      const rawDelta = Math.max(0, Number(hardwareData.delta ?? 0));
      const rawTheta = Math.max(0, Number(hardwareData.theta ?? 0));
      const rawAlpha = Math.max(0, Number(hardwareData.alpha ?? 0));
      const rawBeta = Math.max(0, Number(hardwareData.beta ?? 0));
      const rawSum = rawDelta + rawTheta + rawAlpha + rawBeta;

      if (rawSum <= 0.0001) {
        return { alphaPct: 0, betaPct: 0 };
      }
      return {
        alphaPct: (rawAlpha / rawSum) * 100,
        betaPct: (rawBeta / rawSum) * 100,
      };
    }

    // Simulation Mode
    const ratios = activePatientMode.ratios;
    const jitterD = Math.sin(tick * 0.45) * 1.8 + (Math.random() - 0.5) * 2.2;
    const jitterT = Math.cos(tick * 0.6) * 1.5 + (Math.random() - 0.5) * 1.8;
    const jitterA = Math.sin(tick * 0.85) * 2.4 + (Math.random() - 0.5) * 2.0;
    const jitterB = Math.cos(tick * 1.1) * 1.6 + (Math.random() - 0.5) * 1.9;

    const weightD = Math.max(0.5, (ratios.delta || 10) + jitterD);
    const weightT = Math.max(0.5, (ratios.theta || 15) + jitterT);
    const weightA = Math.max(0.5, (ratios.alpha || 50) + jitterA);
    const weightB = Math.max(0.5, (ratios.beta || 20) + jitterB);

    const totalWeight = weightD + weightT + weightA + weightB;
    return {
      alphaPct: (weightA / totalWeight) * 100,
      betaPct: (weightB / totalWeight) * 100,
    };
  }, [tick, source, activePatientMode, hardwareData, isLeadsDisconnected]);

  // Beta/Alpha Ratio calculation
  // Guard against division by zero: if alpha is 0 or near-zero (<= 0.05) or leads disconnected, show "—" instead of infinity
  const isAlphaValid = !isLeadsDisconnected && alphaPct > 0.05;
  const betaAlphaRatio = isAlphaValid ? parseFloat((betaPct / alphaPct).toFixed(2)) : null;

  // Interpretation label based on the ratio:
  // - Ratio < 0.8: "Relaxed / Low engagement"
  // - Ratio 0.8 - 1.5: "Balanced / Normal"
  // - Ratio > 1.5: "Focused / High cognitive engagement"
  const interpretation = useMemo(() => {
    if (isLeadsDisconnected || !isAlphaValid || betaAlphaRatio === null) {
      return 'Not available';
    }
    if (betaAlphaRatio < 0.8) {
      return 'Relaxed / Low engagement';
    }
    if (betaAlphaRatio <= 1.5) {
      return 'Balanced / Normal';
    }
    return 'Focused / High cognitive engagement';
  }, [isLeadsDisconnected, isAlphaValid, betaAlphaRatio]);

  return (
    <div
      id="focus-indicator-panel"
      className="border border-neutral-300 bg-white p-3.5 sm:p-4 shadow-2xs font-sans transition-all flex flex-col justify-between"
    >
      {/* ─── PANEL HEADER ─── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#D96514]" />
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-tight text-[#141517]">
              <span>FOCUS INDICATOR</span>
              <span className="text-neutral-400 font-normal">|</span>
              <span className="text-neutral-600 font-medium">BETA/ALPHA</span>
            </div>
            <span className="border border-neutral-300 bg-neutral-50 px-1.5 py-0.2 font-mono text-[10px] text-neutral-600">
              β / α
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {isLeadsDisconnected ? (
              <span className="border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                LEADS OFF
              </span>
            ) : (
              <span className="border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-neutral-700 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {source === 'live' ? 'LIVE' : `SIM #${patientModeId}`}
              </span>
            )}
          </div>
        </div>

        {/* Small Caption */}
        <p className="mt-2 text-[11px] font-mono text-neutral-500 leading-tight">
          Derived from live Beta and Alpha band power
        </p>

        {/* ─── PROMINENT METRIC DISPLAY ─── */}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
              Focus Indicator
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-mono text-3xl sm:text-4xl font-black tracking-tight transition-all duration-300 ease-out ${
                  betaAlphaRatio === null
                    ? 'text-neutral-400'
                    : betaAlphaRatio < 0.8
                      ? 'text-emerald-700'
                      : betaAlphaRatio <= 1.5
                        ? 'text-blue-700'
                        : 'text-[#D96514]'
                }`}
              >
                {betaAlphaRatio !== null ? betaAlphaRatio.toFixed(2) : '—'}
              </span>
              <span className="font-mono text-xs text-neutral-500">
                {betaAlphaRatio !== null
                  ? `(${betaPct.toFixed(1)}% β ÷ ${alphaPct.toFixed(1)}% α)`
                  : 'waiting for signal'}
              </span>
            </div>
          </div>

          {/* Short Interpretation Label Badge */}
          <div className="self-end pb-1">
            <div
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-bold transition-all duration-300 ease-out ${
                betaAlphaRatio === null
                  ? 'border-neutral-300 bg-neutral-100 text-neutral-500'
                  : betaAlphaRatio < 0.8
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : betaAlphaRatio <= 1.5
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-orange-300 bg-orange-50 text-[#D96514]'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full transition-all duration-300 ease-out ${
                  betaAlphaRatio === null
                    ? 'bg-neutral-400'
                    : betaAlphaRatio < 0.8
                      ? 'bg-emerald-500 animate-pulse'
                      : betaAlphaRatio <= 1.5
                        ? 'bg-blue-500'
                        : 'bg-[#D96514] animate-pulse'
                }`}
              />
              <span>{interpretation}</span>
            </div>
          </div>
        </div>

        {/* ─── LIVE ANIMATED GAUGE BAR ─── */}
        <div className="mt-3.5">
          <div className="flex justify-between font-mono text-[10px] text-neutral-600 mb-1">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>&lt; 0.8 Relaxed</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>0.8 – 1.5 Balanced</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E06915]" />
              <span>&gt; 1.5 Focused</span>
            </span>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-xs bg-neutral-200 shadow-inner">
            {/* Segmented background tints */}
            <div className="absolute inset-0 flex h-full w-full opacity-25">
              <div className="h-full bg-emerald-500" style={{ width: '32%' }} />
              <div className="h-full bg-blue-500 border-x border-neutral-400" style={{ width: '28%' }} />
              <div className="h-full bg-orange-500" style={{ width: '40%' }} />
            </div>

            {/* Live animated filled bar matching band bars transition style */}
            <div
              className={`h-full transition-all duration-300 ease-out ${
                betaAlphaRatio === null
                  ? 'w-0'
                  : betaAlphaRatio < 0.8
                    ? 'bg-emerald-600'
                    : betaAlphaRatio <= 1.5
                      ? 'bg-blue-600'
                      : 'bg-[#D96514]'
              }`}
              style={{
                width: `${
                  betaAlphaRatio !== null
                    ? Math.min(100, Math.max(3, (betaAlphaRatio / 2.5) * 100))
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="mt-1 flex justify-between font-mono text-[9px] text-neutral-400">
            <span>0.0</span>
            <span className="translate-x-1 font-semibold text-neutral-600">0.8</span>
            <span className="translate-x-1 font-semibold text-neutral-600">1.5</span>
            <span>2.5+</span>
          </div>
        </div>
      </div>

      {/* ─── FOOTER METADATA ─── */}
      <div className="mt-3 flex items-center justify-between border-t border-neutral-200/80 pt-2 font-mono text-[10px] text-neutral-500">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-neutral-400" />
          <span>Higher ratio suggests more active mental state</span>
        </span>
        <span className="text-neutral-400">CYCLE: ~350ms</span>
      </div>
    </div>
  );
};
