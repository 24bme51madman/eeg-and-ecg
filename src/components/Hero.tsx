import { FC, useState } from 'react';
import { ArrowDown, Cpu, Activity, Download, FileText, Check, Globe, BellRing } from 'lucide-react';
import { WaveformTrace } from './WaveformTrace';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { CognitiveStatePreset } from '../types';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { useCognitiveAlerts } from '../context/CognitiveAlertContext';

export const Hero: FC = () => {
  const [activePreset, setActivePreset] = useState<CognitiveStatePreset>('deep_focus');
  const {
    status,
    mode,
    globalIngestUrl,
    isSimulated,
    packetsTotal,
    setIsModalOpen,
    downloadSessionLog,
    setIsDownloadModalOpen,
    sessionStats,
  } = useHardwareConnection();
  const { toggleSidebar, unreadAlertCount, latestPulse } = useCognitiveAlerts();

  return (
    <section className="relative w-full border-b border-neutral-300 pt-8 pb-12 sm:pt-12 sm:pb-16 bg-[#F6F5F0]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top registration tick & document designation */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-300 pb-3 text-xs font-mono text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-[#D96514]" />
            <span>KORTEX ARCHITECTURE // 3-ELECTRODE GLOBAL HOST TELEMETRY SYSTEM</span>
          </div>
          <div>
            <span>CONFIG: DUAL PREFRONTAL (FP1 / FP2) + REF/GND</span>
          </div>
        </div>

        {/* Main headline and value proposition */}
        <div className="mt-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 border border-neutral-300 bg-[#EFECE5] px-2 py-0.5 font-mono text-[11px] text-neutral-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>3-ELECTRODE HEADBAND // WORLDWIDE CLOUD INGESTION &amp; STREAMING</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#141517] sm:text-5xl lg:text-5xl">
            Wearable 3-electrode headband with global host cloud data acquisition.
          </h1>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-700">
            Streams continuous microvolt biopotentials directly from your physical headband to this global cloud host from anywhere in the world. Utilizing a clinical 3-electrode montage (Fp1 left prefrontal, Fp2 right prefrontal, and earclip reference), the system ingests data via public REST API or Web Bluetooth and broadcasts real-time telemetry globally.
          </p>

          {/* Primary technical action buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 border border-[#141517] bg-[#141517] px-5 py-2.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-[#D96514] hover:border-[#D96514] focus:outline-none focus:ring-2 focus:ring-[#D96514]"
            >
              <Globe className="h-3.5 w-3.5" />
              Configure Global Host Telemetry
            </button>
            <button
              id="hero-download-session-btn"
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 border border-[#D96514] bg-[#D96514] px-4 py-2.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-[#b8520e] focus:outline-none focus:ring-2 focus:ring-[#D96514]"
              title="Export captured 3-electrode biopotentials as CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Download Session Log ({sessionStats.samplesRecorded > 0 ? `${sessionStats.samplesRecorded} Samples` : 'CSV'})
            </button>
            <button
              id="hero-open-alerts-btn"
              type="button"
              onClick={toggleSidebar}
              className={`inline-flex items-center justify-center gap-2 border px-4 py-2.5 font-mono text-xs font-semibold transition-all focus:outline-none ${
                latestPulse
                  ? 'border-[#D96514] bg-[#D96514] text-white animate-pulse ring-2 ring-[#D96514]/40'
                  : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100'
              }`}
              title="Open persistent Cognitive Alert Sentinel"
            >
              <BellRing className={`h-3.5 w-3.5 ${latestPulse ? 'text-white' : 'text-[#D96514]'}`} />
              Cognitive Alerts ({unreadAlertCount > 0 ? `${unreadAlertCount} Alert${unreadAlertCount > 1 ? 's' : ''}` : 'Sentinel'})
            </button>
            <a
              href="#waveform-recorder-panel"
              className="inline-flex items-center justify-center border border-neutral-300 bg-white px-4 py-2.5 font-mono text-xs font-medium text-[#141517] transition-colors hover:bg-neutral-100 focus:outline-none"
            >
              View Live Cortical Waveform
            </a>
          </div>

          {/* Quick instrument facts bar */}
          <div className="mt-6 grid grid-cols-2 gap-2 border-t border-neutral-200 pt-4 sm:grid-cols-4 font-mono text-xs">
            <div>
              <span className="text-neutral-500 block text-[10px]">ELECTRODES</span>
              <strong className="text-[#141517]">3 (Fp1, Fp2, REF/GND)</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">GLOBAL INGESTION</span>
              <strong className="text-[#141517]">/api/telemetry</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">STREAM LATENCY</span>
              <strong className="text-[#141517]">&lt; 15 ms Global SSE</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">BATTERY RUNTIME</span>
              <strong className="text-[#141517]">16.5 Hours Continuous</strong>
            </div>
          </div>
        </div>

        {/* Real-time Hardware Link Status Indicator UI Element (Prominent visual link banner) */}
        <div className="mt-8">
          <ConnectionStatusIndicator variant="banner" />
        </div>

        {/* Deliberate motion centerpiece: Live Oscilloscope / Chart-Recorder */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between font-mono text-xs text-neutral-600">
            <span className="font-semibold text-[#141517]">
              INSTRUMENT READOUT // DUAL-CHANNEL PHYSIOLOGICAL STREAM (EEG + ECG)
            </span>
            <span className="text-[11px] text-neutral-500">
              {status === 'connected'
                ? `SOURCE: DUAL PREFRONTAL STREAM (${packetsTotal.toLocaleString()} PKTS)`
                : 'STATUS: READY TO STREAM'}
            </span>
          </div>

          <WaveformTrace
            activePreset={activePreset}
            onSelectPreset={(p) => setActivePreset(p)}
          />
        </div>
      </div>
    </section>
  );
};

