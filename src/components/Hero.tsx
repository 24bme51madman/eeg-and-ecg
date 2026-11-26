import { FC, useState } from 'react';
import { Activity, FileText, Globe } from 'lucide-react';
import { WaveformTrace } from './WaveformTrace';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { BrainwaveBandId, CognitiveStatePreset } from '../types';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { PATIENT_MODES } from '../data/patientModesData';

interface HeroProps {
  selectedBand?: BrainwaveBandId | 'all';
}

export const Hero: FC<HeroProps> = ({ selectedBand = 'all' }) => {
  const [activePreset, setActivePreset] = useState<CognitiveStatePreset>('deep_focus');
  const {
    status,
    packetsTotal,
    setIsModalOpen,
    setIsDownloadModalOpen,
    sessionStats,
    patientModeId,
  } = useHardwareConnection();
  const activePatientMode = PATIENT_MODES[patientModeId] || PATIENT_MODES[1];

  return (
    <section className="relative w-full pt-4 pb-8 sm:pt-6 sm:pb-10 bg-[#F6F5F0]">
      <div className="mx-auto max-w-6xl px-3 sm:px-6 space-y-4">
        {/* Compact App Action Strip */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-300 pb-3">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-600">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-bold text-[#141517] uppercase tracking-tight">
                Live Telemetry Workspace
              </span>
              <span className="hidden sm:inline text-neutral-400">·</span>
              <span className="hidden sm:inline">3-Electrode (Fp1 / Fp2 / REF)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              id="hero-jump-condition-btn"
              href="#standalone-physio-selector"
              className="h-9 inline-flex items-center justify-center gap-1.5 border border-[#141517] bg-[#141517] px-3 font-mono text-xs font-bold text-white transition-colors hover:bg-[#D96514] hover:border-[#D96514]"
              title="Jump to Physiological Pattern & Clinical Condition Selector"
            >
              <Activity className="h-3.5 w-3.5 text-[#D96514]" />
              <span>#{activePatientMode.id} {activePatientMode.name.split('(')[0].trim()} ↓</span>
            </a>

            <button
              id="hero-download-session-btn"
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="h-9 inline-flex items-center justify-center gap-1.5 border border-[#D96514] bg-[#D96514] px-3 font-mono text-xs font-semibold text-white transition-colors hover:bg-[#b8520e]"
              title="Generate Clinical Health Report"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Clinical Report</span>
              <span className="bg-black/20 px-1.5 py-0.5 text-[10px] font-normal">
                {sessionStats.samplesRecorded > 0 ? `${sessionStats.samplesRecorded}` : 'New'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="h-9 inline-flex items-center justify-center gap-1.5 border border-neutral-400 bg-white px-3 font-mono text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 hover:border-black"
            >
              <Globe className="h-3.5 w-3.5 text-[#D96514]" />
              <span>Host Setup</span>
            </button>
          </div>
        </div>

        {/* Real-time Hardware Link Status Banner */}
        <ConnectionStatusIndicator variant="banner" />

        {/* Live Oscilloscope & Telemetry Panels */}
        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-xs text-neutral-600">
            <span className="font-semibold text-[#141517]">
              Dual-Channel Physiological Instrument Stream (EEG + ECG)
            </span>
            <span className="text-[11px] text-neutral-500">
              {status === 'connected'
                ? `Dual Prefrontal Stream (${packetsTotal.toLocaleString()} pkts)`
                : 'Status: Ready to Stream'}
            </span>
          </div>

          <WaveformTrace
            selectedBand={selectedBand}
            activePreset={activePreset}
            onSelectPreset={(p) => setActivePreset(p)}
          />
        </div>
      </div>
    </section>
  );
};


