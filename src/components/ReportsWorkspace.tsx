import { FC } from 'react';
import { FileText, Download, BellRing, Activity, Clock, Database } from 'lucide-react';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { useCognitiveAlerts } from '../context/CognitiveAlertContext';
import { PATIENT_MODES } from '../data/patientModesData';

export const ReportsWorkspace: FC = () => {
  const {
    sessionStats,
    setIsDownloadModalOpen,
    downloadSessionLog,
    patientModeId,
    packetsTotal,
    status,
  } = useHardwareConnection();
  const { toggleSidebar, unreadAlertCount, activeMetrics } = useCognitiveAlerts();

  const activeMode = PATIENT_MODES[patientModeId] || PATIENT_MODES[1];
  const mins = Math.floor((sessionStats.durationSec || 0) / 60);
  const secs = Math.floor((sessionStats.durationSec || 0) % 60);
  const durationLabel = `${mins}m ${secs.toString().padStart(2, '0')}s`;

  return (
    <section className="w-full border-b border-neutral-300 bg-[#F6F5F0] py-6 sm:py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <div className="flex flex-col justify-between gap-2 border-b border-neutral-300 pb-4 md:flex-row md:items-baseline">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 bg-[#D96514]" />
              <span>Clinical Workspace · Session Diagnostics</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#141517] sm:text-3xl">
              Reports, Exports &amp; Alert Sentinel
            </h1>
          </div>
          <div className="font-mono text-xs text-neutral-600">
            Active Profile: <strong className="text-[#D96514]">#{activeMode.id} {activeMode.name}</strong>
          </div>
        </div>

        {/* Live Session Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono">
          <div className="border border-neutral-300 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase">
              <Database className="h-3.5 w-3.5 text-[#D96514]" />
              <span>Recorded Samples</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[#141517]">
              {sessionStats.samplesRecorded.toLocaleString()}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {packetsTotal.toLocaleString()} total packets
            </div>
          </div>

          <div className="border border-neutral-300 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase">
              <Clock className="h-3.5 w-3.5 text-[#D96514]" />
              <span>Session Duration</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[#141517]">{durationLabel}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              Status: {status === 'connected' ? 'Recording Live' : 'Paused'}
            </div>
          </div>

          <div className="border border-neutral-300 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase">
              <Activity className="h-3.5 w-3.5 text-[#D96514]" />
              <span>Focus / Stress</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[#141517]">
              {activeMetrics.focusScore}% / {activeMetrics.stressLevel}%
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              Dominant: {activeMetrics.currentDominantHz} Hz
            </div>
          </div>

          <div className="border border-neutral-300 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase">
              <BellRing className="h-3.5 w-3.5 text-[#D96514]" />
              <span>Sentinel Alerts</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[#141517]">{unreadAlertCount}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Unread cognitive flags</div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="border border-neutral-300 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-sm font-bold text-[#141517] uppercase">
              Generate Assessment &amp; Export Raw Telemetry
            </h2>
            <p className="mt-1 text-xs text-neutral-600 max-w-xl">
              Compile a full clinical neurological assessment (stress, cognitive load, affect, pattern summary) or export timestamped Fp1/Fp2 CSV records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 font-mono text-xs">
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="h-10 inline-flex items-center gap-2 border border-[#D96514] bg-[#D96514] px-4 font-semibold text-white hover:bg-[#b8520e] transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Open Clinical Report</span>
            </button>
            <button
              type="button"
              onClick={() => downloadSessionLog()}
              className="h-10 inline-flex items-center gap-2 border border-[#141517] bg-[#141517] px-4 font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              className="h-10 inline-flex items-center gap-2 border border-neutral-300 bg-[#FAF9F5] px-4 font-semibold text-[#141517] hover:border-[#141517] transition-colors"
            >
              <BellRing className="h-4 w-4 text-[#D96514]" />
              <span>Alert Sentinel ({unreadAlertCount})</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
