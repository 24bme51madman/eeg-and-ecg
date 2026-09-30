import { FC, useState, useEffect, useMemo } from 'react';
import { Heart, Activity, Waves } from 'lucide-react';
import { EegSource, HardwarePacket, ConnectionStatus, HardwareEegData } from '../types';
import { PatientModeConfig, PATIENT_MODES } from '../data/patientModesData';

interface CardiacRhythmPanelProps {
  source: EegSource;
  patientModeId: number;
  latestPacket?: HardwarePacket | null;
  hardwareData?: HardwareEegData | null;
  hwStatus: ConnectionStatus;
}

export const CardiacRhythmPanel: FC<CardiacRhythmPanelProps> = ({
  source,
  patientModeId,
  latestPacket,
  hardwareData,
  hwStatus,
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

  // Compute live heart rate (BPM)
  // In Live mode: read from existing heartRateBpm in latestPacket. If undefined, null, or 0 -> null
  // In Simulation mode: read from existing cardiacBpm in active Patient Mode
  const heartRateBpm = useMemo(() => {
    if (source === 'live') {
      if (hwStatus !== 'connected' || !latestPacket) {
        return null;
      }
      const rawBpm = latestPacket.heartRateBpm;
      if (rawBpm === undefined || rawBpm === null || rawBpm <= 0) {
        return null;
      }
      return Math.round(rawBpm);
    }

    // Simulation mode: use active patient mode cardiacBpm with subtle physiological respiratory jitter (±1 bpm)
    const baseBpm = activePatientMode.cardiacBpm || 72;
    const jitter = Math.sin(tick * 0.3) * 1.2;
    return Math.max(30, Math.round(baseBpm + jitter));
  }, [source, hwStatus, latestPacket, activePatientMode, tick]);

  // Rhythm Status label:
  // - 60-100 BPM: "Normal Sinus Rhythm"
  // - Below 60: "Bradycardia range"
  // - Above 100: "Tachycardia range"
  // - No data: "Not available"
  const rhythmStatus = useMemo(() => {
    if (heartRateBpm === null || heartRateBpm === 0) {
      return {
        label: 'Not available',
        badgeClass: 'border-neutral-300 bg-neutral-100 text-neutral-500',
        dotClass: 'bg-neutral-400',
        barColor: 'bg-neutral-400',
      };
    }
    if (heartRateBpm >= 60 && heartRateBpm <= 100) {
      return {
        label: 'Normal Sinus Rhythm',
        badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-800',
        dotClass: 'bg-emerald-500 animate-pulse',
        barColor: 'bg-emerald-600',
      };
    }
    if (heartRateBpm < 60) {
      return {
        label: 'Bradycardia range',
        badgeClass: 'border-blue-300 bg-blue-50 text-blue-800',
        dotClass: 'bg-blue-500 animate-pulse',
        barColor: 'bg-blue-600',
      };
    }
    return {
      label: 'Tachycardia range',
      badgeClass: 'border-rose-300 bg-rose-50 text-rose-800',
      dotClass: 'bg-rose-500 animate-pulse',
      barColor: 'bg-rose-600',
    };
  }, [heartRateBpm]);

  // Visual Gauge percentage (scale from 40 to 140 BPM)
  const bpmGaugePercent = useMemo(() => {
    if (heartRateBpm === null || heartRateBpm === 0) return 0;
    const clamped = Math.max(40, Math.min(140, heartRateBpm));
    return ((clamped - 40) / (140 - 40)) * 100;
  }, [heartRateBpm]);

  return (
    <div
      id="cardiac-rhythm-panel"
      className="border border-neutral-300 bg-white p-3.5 sm:p-4 shadow-2xs font-sans transition-all flex flex-col justify-between"
    >
      {/* ─── PANEL HEADER ─── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Heart
              className={`h-4 w-4 transition-transform duration-300 ${
                heartRateBpm !== null ? 'text-rose-600 animate-pulse' : 'text-neutral-400'
              }`}
            />
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-tight text-[#141517]">
              <span>CARDIAC RHYTHM</span>
              <span className="text-neutral-400 font-normal">|</span>
              <span className="text-neutral-600 font-medium">HEART RATE</span>
            </div>
            <span className="border border-neutral-300 bg-neutral-50 px-1.5 py-0.2 font-mono text-[10px] text-neutral-600">
              ECG/BPM
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {source === 'live' ? (
              hwStatus === 'connected' && heartRateBpm !== null ? (
                <span className="border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  OPTICAL / LEAD-II
                </span>
              ) : (
                <span className="border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-neutral-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                  AWAITING SENSOR
                </span>
              )
            ) : (
              <span className="border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-neutral-700 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                SIM #{patientModeId} ({activePatientMode.cardiacBpm} BPM)
              </span>
            )}
          </div>
        </div>

        {/* Caption */}
        <p className="mt-2 text-[11px] font-mono text-neutral-500 leading-tight">
          {heartRateBpm === null
            ? 'Waiting for cardiac data from device'
            : source === 'live'
              ? 'Real-time telemetry ingested from biopotential front-end transducer'
              : `Simulated cardiac profile: ${activePatientMode.cardiacRhythm}`}
        </p>

        {/* ─── PROMINENT METRIC DISPLAY ─── */}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
              Heart Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-mono text-3xl sm:text-4xl font-black tracking-tight transition-all duration-300 ease-out ${
                  heartRateBpm === null
                    ? 'text-neutral-400'
                    : heartRateBpm >= 60 && heartRateBpm <= 100
                      ? 'text-emerald-700'
                      : heartRateBpm < 60
                        ? 'text-blue-700'
                        : 'text-rose-700'
                }`}
              >
                {heartRateBpm !== null ? heartRateBpm : '—'}
              </span>
              <span className="font-mono text-sm font-bold text-neutral-600">BPM</span>
              {heartRateBpm !== null && (
                <span className="font-mono text-xs text-neutral-400">
                  (~{Math.round(60000 / heartRateBpm)}ms R-R)
                </span>
              )}
            </div>
          </div>

          {/* Rhythm Status Label Badge */}
          <div className="self-end pb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-0.5">
              Rhythm Status
            </span>
            <div
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-bold transition-all duration-300 ease-out ${rhythmStatus.badgeClass}`}
            >
              <span className={`h-2 w-2 rounded-full transition-all duration-300 ease-out ${rhythmStatus.dotClass}`} />
              <span>{rhythmStatus.label}</span>
            </div>
          </div>
        </div>

        {/* ─── LIVE CARDIAC SCALE GAUGE ─── */}
        <div className="mt-3.5">
          <div className="flex justify-between font-mono text-[10px] text-neutral-600 mb-1">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>&lt; 60 Brady</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>60 – 100 Sinus</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>&gt; 100 Tachy</span>
            </span>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-xs bg-neutral-200 shadow-inner">
            {/* Segmented background tints: 40-60 (20%), 60-100 (40%), 100-140 (40%) */}
            <div className="absolute inset-0 flex h-full w-full opacity-25">
              <div className="h-full bg-blue-500" style={{ width: '20%' }} />
              <div className="h-full bg-emerald-500 border-x border-neutral-400" style={{ width: '40%' }} />
              <div className="h-full bg-rose-500" style={{ width: '40%' }} />
            </div>

            {/* Live animated filled bar matching band bars transition style */}
            <div
              className={`h-full transition-all duration-300 ease-out ${rhythmStatus.barColor}`}
              style={{
                width: `${heartRateBpm !== null ? Math.min(100, Math.max(3, bpmGaugePercent)) : 0}%`,
              }}
            />
          </div>

          <div className="mt-1 flex justify-between font-mono text-[9px] text-neutral-400">
            <span>40</span>
            <span className="translate-x-1 font-semibold text-neutral-600">60</span>
            <span className="translate-x-1 font-semibold text-neutral-600">100</span>
            <span>140+</span>
          </div>
        </div>
      </div>

      {/* ─── FOOTER METADATA ─── */}
      <div className="mt-3 flex items-center justify-between border-t border-neutral-200/80 pt-2 font-mono text-[10px] text-neutral-500">
        <span className="flex items-center gap-1">
          <Waves className="h-3 w-3 text-neutral-400" />
          <span>Synchronized Autonomic Tone // Channel B</span>
        </span>
        <span className="text-neutral-400">CYCLE: ~350ms</span>
      </div>
    </div>
  );
};
