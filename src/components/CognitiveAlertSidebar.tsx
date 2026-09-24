import { FC, useState } from 'react';
import {
  Brain,
  Zap,
  Coffee,
  Flame,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  Sliders,
  Activity,
  Trash2,
  Sparkles,
  Info,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { useCognitiveAlerts } from '../context/CognitiveAlertContext';
import { CognitiveAlert, CognitiveAlertType } from '../types';

export const CognitiveAlertSidebar: FC = () => {
  const {
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
  } = useCognitiveAlerts();

  const [activeTab, setActiveTab] = useState<'feed' | 'gauges' | 'settings'>('feed');

  // Format relative timestamp
  const getRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const getAlertIcon = (type: CognitiveAlertType) => {
    switch (type) {
      case 'deep_focus':
        return <Zap className="h-3.5 w-3.5 text-cyan-600" />;
      case 'high_fatigue':
        return <Coffee className="h-3.5 w-3.5 text-[#D96514]" />;
      case 'acute_stress':
        return <Flame className="h-3.5 w-3.5 text-rose-600" />;
      case 'high_workload':
        return <Activity className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <Brain className="h-3.5 w-3.5 text-neutral-600" />;
    }
  };

  const getAlertColorClasses = (type: CognitiveAlertType) => {
    switch (type) {
      case 'deep_focus':
        return 'border-cyan-300 bg-cyan-50/70 text-cyan-950';
      case 'high_fatigue':
        return 'border-amber-300 bg-amber-50/70 text-amber-950';
      case 'acute_stress':
        return 'border-rose-300 bg-rose-50/70 text-rose-950';
      case 'high_workload':
        return 'border-orange-300 bg-orange-50/70 text-orange-950';
      default:
        return 'border-neutral-300 bg-neutral-50 text-neutral-900';
    }
  };

  return (
    <>
      {/* 1. Subtle Screen Edge Ambient Pulse when pattern is detected */}
      {latestPulse && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-1000 ${
            latestPulse.type === 'deep_focus'
              ? 'ring-4 ring-cyan-500/40 bg-cyan-500/[0.02]'
              : latestPulse.type === 'high_fatigue'
                ? 'ring-4 ring-amber-500/50 bg-amber-500/[0.03]'
                : latestPulse.type === 'acute_stress'
                  ? 'ring-4 ring-rose-500/50 bg-rose-500/[0.03]'
                  : 'ring-4 ring-[#D96514]/40 bg-[#D96514]/[0.02]'
          }`}
        />
      )}

      {/* 2. Persistent Collapsed Floating Rail Button (Visible whenever sidebar is closed) */}
      {!isSidebarOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end">
          <button
            id="open-cognitive-alert-sidebar-btn"
            type="button"
            onClick={toggleSidebar}
            className={`group relative flex items-center gap-2 border-l border-y border-neutral-300 bg-[#FAF9F5] py-3 px-3 shadow-lg transition-all hover:bg-white focus:outline-none ${
              latestPulse ? 'border-[#D96514] ring-2 ring-[#D96514]/50' : ''
            }`}
            title="Open Cognitive Alert Monitor Sidebar"
          >
            {/* Live pulsing activity dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  latestPulse
                    ? latestPulse.type === 'deep_focus'
                      ? 'animate-ping bg-cyan-500'
                      : 'animate-ping bg-[#D96514]'
                    : activeMetrics.focusScore > 75
                      ? 'animate-pulse bg-emerald-500'
                      : activeMetrics.fatigueIndex > 60
                        ? 'animate-pulse bg-amber-500'
                        : 'bg-neutral-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  activeMetrics.focusScore > 75
                    ? 'bg-emerald-600'
                    : activeMetrics.fatigueIndex > 60
                      ? 'bg-[#D96514]'
                      : 'bg-neutral-600'
                }`}
              />
            </span>

            {/* Icon & Label */}
            <div className="flex flex-col items-start font-mono text-[10px] leading-tight">
              <span className="flex items-center gap-1 font-bold text-[#141517] group-hover:text-[#D96514]">
                <BellRing className="h-3.5 w-3.5" />
                <span>ALERTS</span>
              </span>
              <span className="text-[9px] text-neutral-500">
                {activeMetrics.focusScore > 75
                  ? `FOCUS ${activeMetrics.focusScore}%`
                  : activeMetrics.fatigueIndex > 60
                    ? `FATIGUE ${activeMetrics.fatigueIndex}%`
                    : `${activeMetrics.currentDominantHz} Hz`}
              </span>
            </div>

            {/* Unread badge */}
            {unreadAlertCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D96514] px-1 text-[9px] font-bold text-white shadow-xs">
                {unreadAlertCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. Persistent Sliding Drawer / Sidebar */}
      <aside
        id="cognitive-alert-sidebar"
        aria-label="Cognitive Alert Monitor Sidebar"
        className={`fixed right-0 top-0 bottom-0 z-50 flex w-80 sm:w-96 flex-col border-l border-neutral-300 bg-[#FAF9F5] shadow-2xl transition-transform duration-300 ease-in-out font-mono text-[#141517] ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-300 bg-[#EFECE5] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D96514] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D96514]" />
            </span>
            <div>
              <h2 className="text-xs font-bold tracking-wider text-[#141517]">
                COGNITIVE ALERT MONITOR
              </h2>
              <span className="text-[10px] text-neutral-500 block">
                REAL-TIME BIOMARKER SENTINEL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 border transition-colors ${
                soundEnabled
                  ? 'border-neutral-300 bg-white text-neutral-800 hover:text-black'
                  : 'border-neutral-200 bg-neutral-100 text-neutral-400'
              }`}
              title={soundEnabled ? 'Acoustic feedback enabled' : 'Acoustic feedback muted'}
              aria-label={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>

            <button
              id="close-cognitive-alert-sidebar-btn"
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 border border-neutral-300 bg-white text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
              aria-label="Close cognitive alert sidebar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time State Banner & Pulse Flash */}
        <div
          className={`border-b px-4 py-2.5 text-xs transition-colors duration-500 flex items-center justify-between ${
            latestPulse
              ? latestPulse.type === 'deep_focus'
                ? 'bg-cyan-100/90 border-cyan-300 text-cyan-950 animate-pulse'
                : latestPulse.type === 'high_fatigue'
                  ? 'bg-amber-100/90 border-amber-300 text-amber-950 animate-pulse'
                  : 'bg-rose-100/90 border-rose-300 text-rose-950 animate-pulse'
              : 'bg-[#F4F2EC] border-neutral-300 text-neutral-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#D96514]" />
            <div>
              <span className="font-bold text-[11px] block">
                {latestPulse ? latestPulse.title.toUpperCase() : activeMetrics.activePatternLabel}
              </span>
              <span className="text-[10px] text-neutral-600">
                Dominant: {activeMetrics.currentDominantHz} Hz • TBR: {activeMetrics.thetaBetaRatio}
              </span>
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 border border-neutral-300 bg-white font-semibold">
            {sensitivity.toUpperCase()} SENS
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-300 bg-[#EFECE5] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 text-center font-bold text-[11px] border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'feed'
                ? 'border-[#D96514] bg-white text-[#D96514]'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Bell className="h-3 w-3" />
            <span>ALERTS ({alerts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gauges')}
            className={`flex-1 py-2 text-center font-bold text-[11px] border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'gauges'
                ? 'border-[#D96514] bg-white text-[#D96514]'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Activity className="h-3 w-3" />
            <span>BIOMARKERS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-center font-bold text-[11px] border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-[#D96514] bg-white text-[#D96514]'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Sliders className="h-3 w-3" />
            <span>CONFIG</span>
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* TAB 1: Real-time Alert Feed */}
          {activeTab === 'feed' && (
            <div className="space-y-3">
              {/* Quick simulation bar for testing UI pulses */}
              <div className="border border-neutral-300 bg-white p-2.5">
                <span className="text-[10px] text-neutral-500 font-bold block mb-1.5">
                  TEST COGNITIVE PULSE TRIGGERS:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => simulateAlert('deep_focus')}
                    className="flex items-center justify-center gap-1 border border-cyan-300 bg-cyan-50 px-1.5 py-1 text-cyan-900 hover:bg-cyan-100 transition-colors font-semibold"
                    title="Simulate deep focus pattern detection"
                  >
                    <Zap className="h-3 w-3 text-cyan-600" />
                    Deep Focus
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateAlert('high_fatigue')}
                    className="flex items-center justify-center gap-1 border border-amber-300 bg-amber-50 px-1.5 py-1 text-amber-900 hover:bg-amber-100 transition-colors font-semibold"
                    title="Simulate high fatigue pattern detection"
                  >
                    <Coffee className="h-3 w-3 text-[#D96514]" />
                    Fatigue
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateAlert('acute_stress')}
                    className="flex items-center justify-center gap-1 border border-rose-300 bg-rose-50 px-1.5 py-1 text-rose-900 hover:bg-rose-100 transition-colors font-semibold"
                    title="Simulate acute stress pattern detection"
                  >
                    <Flame className="h-3 w-3 text-rose-600" />
                    Stress
                  </button>
                </div>
              </div>

              {/* Alert history list */}
              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-semibold px-0.5">
                <span>DETECTED COGNITIVE PATTERNS</span>
                {alerts.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllAlerts}
                    className="hover:text-red-700 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    Clear Feed
                  </button>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="border border-neutral-300 bg-white p-6 text-center text-neutral-400 text-xs">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-40 text-neutral-400" />
                  <p className="font-semibold text-neutral-600">No active cognitive alerts</p>
                  <p className="text-[11px] mt-1 text-neutral-400">
                    Real-time EEG biopotentials are streaming normally. Use the test buttons above to preview alert pulses.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border p-2.5 transition-all text-xs ${getAlertColorClasses(
                        alert.type
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {getAlertIcon(alert.type)}
                          <strong className="font-bold text-[11px] tracking-tight">
                            {alert.title}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                          <span>{getRelativeTime(alert.timestamp)}</span>
                          <button
                            type="button"
                            onClick={() => dismissAlert(alert.id)}
                            className="text-neutral-400 hover:text-black p-0.5"
                            title="Dismiss alert"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] leading-relaxed mb-2 text-neutral-700">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between border-t border-neutral-200/60 pt-1.5 text-[10px]">
                        <span className="font-semibold text-neutral-600">
                          {alert.biomarkerDetails}
                        </span>
                        <span className="border border-current px-1 py-0.2 font-bold uppercase text-[9px]">
                          {alert.metricLabel}: {alert.metricValue}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Live Cognitive Gauges & Biomarkers */}
          {activeTab === 'gauges' && (
            <div className="space-y-3">
              {/* Focus Depth Gauge */}
              <div className="border border-neutral-300 bg-white p-3">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="flex items-center gap-1 font-bold text-cyan-950">
                    <Zap className="h-3.5 w-3.5 text-cyan-600" />
                    DEEP FOCUS INDEX
                  </span>
                  <strong className="text-sm font-bold text-cyan-700">
                    {activeMetrics.focusScore}%
                  </strong>
                </div>
                <div className="h-2 w-full bg-neutral-100 overflow-hidden border border-neutral-200">
                  <div
                    className="h-full bg-cyan-600 transition-all duration-300"
                    style={{ width: `${activeMetrics.focusScore}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-neutral-400">
                  <span>Distracted</span>
                  <span>Baseline</span>
                  <span className="text-cyan-700 font-semibold">Deep Focus (&gt;75%)</span>
                </div>
              </div>

              {/* Fatigue Accumulation Gauge */}
              <div className="border border-neutral-300 bg-white p-3">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-950">
                    <Coffee className="h-3.5 w-3.5 text-[#D96514]" />
                    FATIGUE ACCUMULATION
                  </span>
                  <strong className="text-sm font-bold text-[#D96514]">
                    {activeMetrics.fatigueIndex}%
                  </strong>
                </div>
                <div className="h-2 w-full bg-neutral-100 overflow-hidden border border-neutral-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      activeMetrics.fatigueIndex > 65 ? 'bg-amber-600 animate-pulse' : 'bg-amber-500'
                    }`}
                    style={{ width: `${activeMetrics.fatigueIndex}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-neutral-400">
                  <span>Alert</span>
                  <span>Moderate</span>
                  <span className="text-amber-700 font-semibold">Exhaustion (&gt;70%)</span>
                </div>
              </div>

              {/* Cognitive Stress Level */}
              <div className="border border-neutral-300 bg-white p-3">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="flex items-center gap-1 font-bold text-rose-950">
                    <Flame className="h-3.5 w-3.5 text-rose-600" />
                    COGNITIVE STRESS / CLI
                  </span>
                  <strong className="text-sm font-bold text-rose-700">
                    {activeMetrics.stressLevel}%
                  </strong>
                </div>
                <div className="h-2 w-full bg-neutral-100 overflow-hidden border border-neutral-200">
                  <div
                    className="h-full bg-rose-600 transition-all duration-300"
                    style={{ width: `${activeMetrics.stressLevel}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-neutral-400">
                  <span>Restful</span>
                  <span>Nominal</span>
                  <span className="text-rose-700 font-semibold">Sympathetic (&gt;70%)</span>
                </div>
              </div>

              {/* Spectral Biomarker Readout Table */}
              <div className="border border-neutral-300 bg-[#F6F5F0] p-3 text-[11px]">
                <div className="font-bold text-neutral-800 mb-2 flex items-center gap-1">
                  <Radio className="h-3.5 w-3.5 text-[#D96514]" />
                  <span>SPECTRAL EEG BIOMARKERS (FP1/FP2)</span>
                </div>
                <div className="space-y-1.5 text-neutral-700">
                  <div className="flex justify-between border-b border-neutral-200 pb-1">
                    <span>Dominant Peak Rhythm:</span>
                    <strong>{activeMetrics.currentDominantHz} Hz</strong>
                  </div>
                  <div className="flex justify-between border-b border-neutral-200 pb-1">
                    <span>Theta / Beta Ratio (TBR):</span>
                    <strong>{activeMetrics.thetaBetaRatio}</strong>
                  </div>
                  <div className="flex justify-between border-b border-neutral-200 pb-1">
                    <span>Cognitive Load Index (CLI):</span>
                    <strong>{activeMetrics.workloadCLI} / 100</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Vigilance Vigil Index:</span>
                    <strong className="text-emerald-700">OPTIMAL</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Sentinel Settings & Thresholds */}
          {activeTab === 'settings' && (
            <div className="space-y-3.5 text-xs">
              {/* Detection Sensitivity */}
              <div className="border border-neutral-300 bg-white p-3">
                <span className="text-[11px] font-bold text-neutral-800 block mb-2">
                  SENTINEL SENSITIVITY:
                </span>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  {(['low', 'balanced', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSensitivity(level)}
                      className={`border py-1.5 uppercase font-semibold transition-colors ${
                        sensitivity === level
                          ? 'border-[#141517] bg-[#141517] text-white'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-neutral-500 leading-normal">
                  {sensitivity === 'high'
                    ? 'High: Triggers alerts faster with lower threshold requirements (12s cooldown).'
                    : sensitivity === 'low'
                      ? 'Low: Requires sustained, unambiguous rhythm trends to trigger (30s cooldown).'
                      : 'Balanced: Standard clinical vigilance threshold (20s cooldown).'}
                </p>
              </div>

              {/* Monitored Pattern Toggles */}
              <div className="border border-neutral-300 bg-white p-3">
                <span className="text-[11px] font-bold text-neutral-800 block mb-2">
                  MONITORED COGNITIVE STATES:
                </span>
                <div className="space-y-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={monitoredPatterns.deep_focus}
                      onChange={() => togglePatternMonitor('deep_focus')}
                      className="accent-[#D96514]"
                    />
                    <span>Deep Focus (Beta-Gamma Coherence)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={monitoredPatterns.high_fatigue}
                      onChange={() => togglePatternMonitor('high_fatigue')}
                      className="accent-[#D96514]"
                    />
                    <span>High Fatigue &amp; Drowsiness (Theta Surge)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={monitoredPatterns.acute_stress}
                      onChange={() => togglePatternMonitor('acute_stress')}
                      className="accent-[#D96514]"
                    />
                    <span>Acute Cognitive Strain &amp; Stress</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={monitoredPatterns.high_workload}
                      onChange={() => togglePatternMonitor('high_workload')}
                      className="accent-[#D96514]"
                    />
                    <span>High Cognitive Workload (CLI &gt; 80)</span>
                  </label>
                </div>
              </div>

              {/* Sound & Notification preferences */}
              <div className="border border-neutral-300 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-[11px] text-neutral-800 block">ACOUSTIC CHIME</strong>
                    <span className="text-[10px] text-neutral-500">
                      Subtle harmonic sine ping on state transitions
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-3 py-1 text-[11px] font-bold border transition-colors ${
                      soundEnabled
                        ? 'border-emerald-700 bg-emerald-100 text-emerald-900'
                        : 'border-neutral-300 bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {soundEnabled ? 'ACTIVE' : 'MUTED'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="border-t border-neutral-300 bg-[#EFECE5] p-3 text-[10px] text-neutral-500 flex items-center justify-between">
          <span>KORTEX TRINITY-3 SENTINEL</span>
          <span className="text-neutral-700 font-semibold">Fp1 + Fp2 PREFRONTAL</span>
        </div>
      </aside>
    </>
  );
};
