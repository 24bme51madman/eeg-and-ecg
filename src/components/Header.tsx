import { FC } from 'react';
import { Activity, ShieldCheck, Download, BellRing, FileText } from 'lucide-react';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { useCognitiveAlerts } from '../context/CognitiveAlertContext';

export const Header: FC = () => {
  const {
    status,
    endpoint,
    latencyMs,
    sampleRateHz,
    setIsDownloadModalOpen,
    sessionStats,
    isSimulated,
    source,
    setSource,
    setMode,
  } = useHardwareConnection();
  const { toggleSidebar, unreadAlertCount, latestPulse, activeMetrics } = useCognitiveAlerts();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-300 bg-[#F6F5F0]/95 backdrop-blur-xs">
      {/* Top laboratory metadata band */}
      <div className="hidden border-b border-neutral-200 bg-[#EFECE5] px-4 py-1 text-[11px] font-mono sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-neutral-500 font-medium">Standards:</span>
            <span className="text-neutral-800">ISO 13485 · IEC 60601-1-2 · 10-20 Electrophysiology</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-800">Leads: Fp1 + Fp2 + REF/GND</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-neutral-800">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-600 animate-pulse'
                    : status === 'connecting'
                      ? 'bg-[#D96514] animate-ping'
                      : 'bg-neutral-400'
                }`}
              />
              Global Link: {status === 'connected' ? `Active (${latencyMs}ms)` : 'Disconnected'}
            </span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-600">Ingest: /api/telemetry</span>
          </div>
        </div>
      </div>

      {/* Main navigation masthead */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-baseline gap-2">
          <a href="#" className="group flex items-baseline gap-1.5 text-left focus:outline-none" title="Kortex-Kare">
            <span className="font-mono text-base font-bold tracking-tight text-[#141517] group-hover:text-[#D96514] transition-colors">
              Kortex<span className="text-[#D96514]">-Kare</span>
            </span>
          </a>
          <span className="hidden font-mono text-[10px] text-neutral-500 md:inline-block border border-neutral-300 px-1.5 py-0.5">
            3-Electrode Headband
          </span>
        </div>

        {/* Section links */}
        <nav className="hidden items-center gap-4 text-xs font-mono text-neutral-700 lg:flex">
          <a href="#waveform-recorder-panel" className="hover:text-[#D96514] transition-colors">
            LIVE SIGNAL
          </a>
          <a href="#why-it-matters" className="hover:text-[#D96514] transition-colors">
            WHY EEG
          </a>
          <a href="#how-it-works" className="hover:text-[#D96514] transition-colors">
            PIPELINE
          </a>
          <a href="#brainwave-bands" className="hover:text-[#D96514] transition-colors">
            FREQUENCY BANDS
          </a>
          <a href="#cad-hardware-section" className="hover:text-[#D96514] transition-colors">
            3-CHASSIS CAD
          </a>
          <a href="#technical-specifications" className="hover:text-[#D96514] transition-colors">
            SPECS
          </a>
        </nav>

        {/* Real-time Hardware Link Status Indicator & Session Export UI Element */}
        <div className="flex items-center gap-2">
          <button
            id="header-cognitive-alerts-btn"
            type="button"
            onClick={toggleSidebar}
            className={`h-8 inline-flex items-center gap-1.5 border px-2.5 font-mono text-xs font-semibold transition-all ${
              latestPulse
                ? 'border-[#D96514] bg-[#D96514] text-white ring-2 ring-[#D96514]/40 animate-pulse'
                : 'border-neutral-300 bg-white text-neutral-800 hover:border-black'
            }`}
            title="Open Cognitive Alert Monitor Sidebar"
          >
            <BellRing className={`h-3.5 w-3.5 ${latestPulse ? 'text-white' : 'text-[#D96514]'}`} />
            <span className="hidden md:inline">ALERTS</span>
            {unreadAlertCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                latestPulse ? 'bg-black text-white' : 'bg-[#D96514] text-white'
              }`}>
                {unreadAlertCount}
              </span>
            )}
          </button>

          <button
            id="header-export-report-btn"
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="h-8 hidden sm:inline-flex items-center gap-1.5 border border-[#141517] bg-[#141517] px-3 font-mono text-xs font-semibold text-white hover:bg-[#D96514] hover:border-[#D96514] transition-colors"
            title="Generate Clinical Health Report (Stress, Cognitive Load, Affect, Condition & One-Liner)"
          >
            <FileText className="h-3.5 w-3.5 text-[#FAF9F5]" />
            <span>CLINICAL REPORT</span>
            <span className="text-[10px] text-neutral-400 font-normal">({sessionStats.samplesRecorded})</span>
          </button>

          {/* Discreet Stealth Stream Source Calibration Pill */}
          <button
            id="header-cal-mode-btn"
            type="button"
            onClick={() => setSource(source === 'live' ? 'simulation' : 'live')}
            className="h-8 hidden sm:inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-2.5 font-mono text-xs text-neutral-800 hover:border-neutral-700 transition-colors"
            title="Front-end Lead Calibration (Shift+S toggles stream source)"
          >
            <span className={`h-2 w-2 rounded-full ${source === 'live' ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-semibold text-[11px] tracking-tight">250 S/s {source === 'live' ? 'Live' : 'Cal'}</span>
          </button>

          <ConnectionStatusIndicator variant="compact" />
        </div>
      </div>
    </header>
  );
};

