import { FC } from 'react';
import { Activity, ShieldCheck, ArrowRight, Radio, Download, BellRing, Cpu } from 'lucide-react';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { BatteryIndicator } from './BatteryIndicator';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { useCognitiveAlerts } from '../context/CognitiveAlertContext';

export const Header: FC = () => {
  const {
    status,
    endpoint,
    latencyMs,
    sampleRateHz,
    batteryLevel,
    isCharging,
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
            <span className="text-neutral-500">STANDARDS:</span>
            <span className="text-neutral-800">ISO 13485 // IEC 60601-1-2 // 3-ELECTRODE 10-20</span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-800">LEADS: FP1 + FP2 + REF/GND</span>
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
              GLOBAL LINK: {status === 'connected' ? `ACTIVE (${latencyMs}ms)` : 'DISCONNECTED'}
            </span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-600">INGESTION: /api/telemetry</span>
            <span className="text-neutral-400">|</span>
            <span className="inline-flex items-center gap-1 text-neutral-800">
              <span className="text-neutral-500">BATTERY:</span>
              <span className={`font-semibold ${batteryLevel < 20 && !isCharging ? 'text-rose-600' : 'text-neutral-900'}`}>
                {batteryLevel}%
              </span>
              {isCharging ? (
                <span className="text-emerald-700 font-bold text-[10px]">(CHARGING)</span>
              ) : (
                <span className="text-neutral-500 text-[10px]">(~{(batteryLevel * 0.165).toFixed(1)}h)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation masthead */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-baseline gap-2">
          <a href="#" className="group flex items-baseline gap-2 text-left focus:outline-none">
            <span className="font-mono text-base font-bold tracking-tight text-[#141517] group-hover:text-[#D96514] transition-colors">
              KORTEX
            </span>
            <span className="font-mono text-xs text-neutral-500">//</span>
            <span className="font-mono text-xs font-semibold text-[#D96514]">
              TRINITY-3
            </span>
          </a>
          <span className="hidden font-mono text-[10px] text-neutral-500 md:inline-block border border-neutral-300 px-1.5 py-0.2">
            3-ELECTRODE HEADBAND
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
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="header-cognitive-alerts-btn"
            type="button"
            onClick={toggleSidebar}
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-semibold transition-all ${
              latestPulse
                ? 'border-[#D96514] bg-[#D96514] text-white ring-2 ring-[#D96514]/40 animate-pulse'
                : 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500'
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
            id="header-export-csv-btn"
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 border border-neutral-300 bg-white px-2.5 py-1 font-mono text-xs font-medium text-neutral-800 hover:border-[#D96514] hover:text-[#D96514] transition-colors"
            title="Download captured EEG session log as CSV"
          >
            <Download className="h-3.5 w-3.5 text-[#D96514]" />
            <span>EXPORT CSV</span>
            <span className="text-[10px] text-neutral-400">({sessionStats.samplesRecorded})</span>
          </button>

          {/* Quick Mode Toggle Button: Simulation vs Live Hardware */}
          <div className="flex items-center border border-neutral-400 bg-white p-0.5 font-mono text-xs shadow-2xs">
            <button
              id="header-live-mode-btn"
              type="button"
              onClick={() => setSource('live')}
              className={`flex items-center gap-1 px-2 py-0.5 font-bold transition-all ${
                source === 'live'
                  ? 'bg-emerald-700 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
              }`}
              title="Activate Live Device Stream (ESP32 / AD8232)"
            >
              <Radio className={`h-3 w-3 ${source === 'live' ? 'text-white' : 'text-neutral-500'}`} />
              <span>LIVE</span>
              {source === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
            </button>
            <button
              id="header-simulation-mode-btn"
              type="button"
              onClick={() => setSource('simulation')}
              className={`flex items-center gap-1 px-2 py-0.5 font-bold transition-all ${
                source === 'simulation'
                  ? 'bg-[#141517] text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
              }`}
              title="Activate Synthetic Patient Mode Simulation"
            >
              <Cpu className={`h-3 w-3 ${source === 'simulation' ? 'text-amber-400' : 'text-neutral-500'}`} />
              <span>SIM</span>
              {source === 'simulation' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
            </button>
          </div>

          <ConnectionStatusIndicator variant="compact" />

          <BatteryIndicator />

          <a
            href="#waitlist"
            className="hidden sm:inline-flex items-center gap-1.5 border border-[#141517] bg-[#141517] px-3 py-1.5 font-mono text-xs font-medium text-white transition-colors hover:bg-[#D96514] hover:border-[#D96514] focus:outline-none focus:ring-2 focus:ring-[#D96514]"
          >
            ORDER KIT
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};

