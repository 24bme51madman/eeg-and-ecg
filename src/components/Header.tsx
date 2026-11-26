import { FC } from 'react';
import { Activity, Waves, Cpu, BellRing, FileText, Power } from 'lucide-react';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { PWAInstallButton } from './PWAInstallButton';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { useCognitiveAlerts } from '../context/CognitiveAlertContext';
import { AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const APP_TABS: { id: AppTab; label: string; icon: typeof Activity }[] = [
  { id: 'monitor', label: 'MONITOR', icon: Activity },
  { id: 'bands', label: 'BANDS', icon: Waves },
  { id: 'device', label: 'DEVICE', icon: Cpu },
  { id: 'reports', label: 'REPORTS', icon: FileText },
];

export const Header: FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const {
    status,
    latencyMs,
    setIsDownloadModalOpen,
    sessionStats,
    source,
    setSource,
    isPowered,
    togglePower,
  } = useHardwareConnection();
  const { toggleSidebar, unreadAlertCount, latestPulse } = useCognitiveAlerts();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-300 bg-[#F6F5F0]/95 backdrop-blur-xs">
      {/* Top laboratory status bar */}
      <div className="hidden border-b border-neutral-200 bg-[#EFECE5] px-4 py-1 text-[11px] font-mono sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-neutral-500 font-medium">Kortex-Kare App</span>
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

      {/* Main app masthead */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-baseline gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('monitor')}
            className="group flex items-baseline gap-1.5 text-left focus:outline-none"
            title="Kortex-Kare Monitor"
          >
            <span className="font-mono text-base font-bold tracking-tight text-[#141517] group-hover:text-[#D96514] transition-colors">
              Kortex<span className="text-[#D96514]">-Kare</span>
            </span>
          </button>
          <span className="hidden font-mono text-[10px] text-neutral-500 xl:inline-block border border-neutral-300 px-1.5 py-0.5">
            EEG App
          </span>
        </div>

        {/* Desktop Segmented App View Tabs */}
        <nav aria-label="Workspace Tabs" className="hidden items-center border border-neutral-300 bg-[#EFECE5] p-0.5 font-mono text-xs lg:flex">
          {APP_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1 font-semibold transition-all ${
                  isActive
                    ? 'bg-[#141517] text-white shadow-2xs'
                    : 'text-neutral-700 hover:text-[#141517] hover:bg-white/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#D96514]' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* App Utility Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="header-cognitive-alerts-btn"
            type="button"
            onClick={toggleSidebar}
            className={`h-8 inline-flex items-center gap-1.5 border px-2 font-mono text-xs font-semibold transition-all ${
              latestPulse
                ? 'border-[#D96514] bg-[#D96514] text-white ring-2 ring-[#D96514]/40 animate-pulse'
                : 'border-neutral-300 bg-white text-neutral-800 hover:border-black'
            }`}
            title="Open Cognitive Alert Monitor Sidebar"
          >
            <BellRing className={`h-3.5 w-3.5 ${latestPulse ? 'text-white' : 'text-[#D96514]'}`} />
            <span className="hidden xl:inline">ALERTS</span>
            {unreadAlertCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  latestPulse ? 'bg-black text-white' : 'bg-[#D96514] text-white'
                }`}
              >
                {unreadAlertCount}
              </span>
            )}
          </button>

          <button
            id="header-export-report-btn"
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="h-8 hidden sm:inline-flex items-center gap-1.5 border border-[#141517] bg-[#141517] px-2.5 font-mono text-xs font-semibold text-white hover:bg-[#D96514] hover:border-[#D96514] transition-colors"
            title="Generate Clinical Health Report"
          >
            <FileText className="h-3.5 w-3.5 text-[#FAF9F5]" />
            <span className="hidden md:inline">REPORT</span>
            <span className="text-[10px] text-neutral-400 font-normal">({sessionStats.samplesRecorded})</span>
          </button>

          {/* Discreet Stealth Stream Source Calibration Pill */}
          <button
            id="header-cal-mode-btn"
            type="button"
            onClick={() => setSource(source === 'live' ? 'simulation' : 'live')}
            className="h-8 hidden md:inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-2 font-mono text-xs text-neutral-800 hover:border-neutral-700 transition-colors"
            title="Front-end Lead Calibration (Shift+S toggles stream source)"
          >
            <span className={`h-2 w-2 rounded-full ${source === 'live' ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-semibold text-[11px] tracking-tight">
              250 S/s {source === 'live' ? 'Live' : 'Cal'}
            </span>
          </button>

          <ConnectionStatusIndicator variant="compact" />

          {/* PWA Install App Button */}
          <PWAInstallButton compact />

          {/* Master Power On/Off Button */}
          <button
            id="header-power-btn"
            type="button"
            onClick={togglePower}
            title={isPowered ? 'System is ON - click to turn OFF' : 'System is OFF - click to turn ON'}
            className={`h-8 inline-flex items-center gap-1.5 border px-2 font-mono text-xs font-semibold transition-colors focus:outline-none ${
              isPowered
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-700'
                : 'border-neutral-400 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:border-neutral-500'
            }`}
          >
            <Power className={`h-3 w-3 ${isPowered ? 'text-emerald-600' : 'text-neutral-500'}`} />
            <span>{isPowered ? 'ON' : 'OFF'}</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPowered ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};


