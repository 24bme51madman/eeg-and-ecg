import { FC, useState } from 'react';
import {
  Download,
  X,
  FileSpreadsheet,
  Clock,
  Activity,
  RotateCcw,
  Play,
  Pause,
  CheckCircle2,
  Table,
  HardDrive,
  Layers,
} from 'lucide-react';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { formatDuration } from '../utils/csvExporter';

export const SessionDownloadModal: FC = () => {
  const {
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    sessionStats,
    sessionRecords,
    isRecording,
    toggleRecording,
    clearSessionLog,
    downloadSessionLog,
    sampleRateHz,
    mode,
  } = useHardwareConnection();

  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [customFilename, setCustomFilename] = useState<string>('');

  if (!isDownloadModalOpen) return null;

  const handleDownload = () => {
    const filenameToUse = customFilename.trim()
      ? (customFilename.endsWith('.csv') ? customFilename.trim() : `${customFilename.trim()}.csv`)
      : undefined;

    downloadSessionLog(filenameToUse);
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 3500);
  };

  const estimatedKb = Math.max(1, Math.round((sessionStats.samplesRecorded * 85) / 1024));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141517]/70 backdrop-blur-xs font-mono"
    >
      <div className="relative w-full max-w-2xl border border-neutral-300 bg-[#FAF9F5] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#141517]">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-neutral-300 bg-[#EFECE5] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-[#D96514]" />
            <span className="text-xs font-bold tracking-wider text-[#141517]">
              EXPORT SESSION DATA // RESEARCH-GRADE CSV
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(false)}
            className="text-neutral-500 hover:text-black p-1 transition-colors"
            aria-label="Close session export modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Status & Recording Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-300 bg-white p-3.5">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-2 py-1 font-bold text-[11px] ${
                  isRecording
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRecording ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
                  }`}
                />
                {isRecording ? 'RECORDING ACTIVE' : 'LOGGING PAUSED'}
              </div>

              <div className="flex items-center gap-1 text-neutral-600 text-[11px]">
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                <span>DURATION:</span>
                <strong className="text-neutral-900">{formatDuration(sessionStats.durationSec)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                className="inline-flex items-center gap-1 border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                {isRecording ? (
                  <>
                    <Pause className="h-3 w-3" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Resume
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={clearSessionLog}
                className="inline-flex items-center gap-1 border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Reset session buffer and timer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Buffer
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="border border-neutral-300 bg-white p-2.5">
              <span className="text-[10px] text-neutral-500 block">TOTAL SAMPLES</span>
              <strong className="text-sm text-neutral-900 font-bold">
                {sessionStats.samplesRecorded.toLocaleString()}
              </strong>
              <span className="text-[9px] text-neutral-400 block mt-0.5">Nominal: {sampleRateHz} S/s</span>
            </div>

            <div className="border border-neutral-300 bg-white p-2.5">
              <span className="text-[10px] text-neutral-500 block">EST. FILE SIZE</span>
              <strong className="text-sm text-neutral-900 font-bold">~{estimatedKb} KB</strong>
              <span className="text-[9px] text-neutral-400 block mt-0.5">UTF-8 Plain Text</span>
            </div>

            <div className="border border-neutral-300 bg-white p-2.5">
              <span className="text-[10px] text-neutral-500 block">FP1 MEAN (µV)</span>
              <strong className="text-sm text-[#D96514] font-bold">
                {sessionStats.meanFp1 > 0 ? `+${sessionStats.meanFp1}` : sessionStats.meanFp1}
              </strong>
              <span className="text-[9px] text-neutral-400 block mt-0.5">
                [{sessionStats.minFp1} to {sessionStats.maxFp1}]
              </span>
            </div>

            <div className="border border-neutral-300 bg-white p-2.5">
              <span className="text-[10px] text-neutral-500 block">FP2 MEAN (µV)</span>
              <strong className="text-sm text-neutral-900 font-bold">
                {sessionStats.meanFp2 > 0 ? `+${sessionStats.meanFp2}` : sessionStats.meanFp2}
              </strong>
              <span className="text-[9px] text-neutral-400 block mt-0.5">
                [{sessionStats.minFp2} to {sessionStats.maxFp2}]
              </span>
            </div>
          </div>

          {/* CSV File Format Info & Columns */}
          <div className="border border-neutral-300 bg-[#F6F5F0] p-3 text-[11px] text-neutral-700">
            <div className="flex items-center gap-1.5 font-bold text-neutral-900 mb-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#D96514]" />
              <span>STANDARDIZED CSV SPECIFICATION (BIDS &amp; OPENBCI COMPLIANT)</span>
            </div>
            <p className="text-neutral-600 leading-relaxed mb-2">
              Exported logs include scientific metadata comment headers, microsecond-accurate timestamps, calibrated microvolts for all 3 electrodes (Fp1, Fp2, REF/GND), computed bipolar differential, and contact impedance values.
            </p>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-neutral-800">SampleIndex</span>
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-neutral-800">Timestamp_ISO</span>
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-neutral-800">Elapsed_Sec</span>
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-[#D96514] font-semibold">Fp1_uV</span>
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-neutral-900 font-semibold">Fp2_uV</span>
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-neutral-800">REF_uV</span>
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-emerald-800 font-semibold">Differential_uV</span>
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-neutral-700">Impedances (kΩ)</span>
              <span className="bg-white border border-neutral-300 px-1.5 py-0.5 text-neutral-700">Battery_Pct</span>
            </div>
          </div>

          {/* Real-time sample table preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-neutral-800 flex items-center gap-1.5">
                <Table className="h-3 w-3 text-neutral-500" />
                REAL-TIME CAPTURED BUFFER PREVIEW (LAST 5 SAMPLES)
              </span>
              <span className="text-[10px] text-neutral-500">
                Displaying most recent data points
              </span>
            </div>

            <div className="border border-neutral-300 bg-white overflow-x-auto">
              <table className="w-full text-left text-[10px]">
                <thead className="border-b border-neutral-300 bg-neutral-100 font-semibold text-neutral-700">
                  <tr>
                    <th className="p-1.5">#</th>
                    <th className="p-1.5">Elapsed</th>
                    <th className="p-1.5">Fp1 (µV)</th>
                    <th className="p-1.5">Fp2 (µV)</th>
                    <th className="p-1.5">Diff (µV)</th>
                    <th className="p-1.5">Ref (µV)</th>
                    <th className="p-1.5">E1/E2 Imp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {sessionRecords.slice(-5).map((row) => (
                    <tr key={row.sampleIndex} className="hover:bg-[#FAF9F5]">
                      <td className="p-1.5 text-neutral-500">{row.sampleIndex}</td>
                      <td className="p-1.5">{row.elapsedSec.toFixed(2)}s</td>
                      <td className="p-1.5 font-semibold text-[#D96514]">{row.fp1_uV.toFixed(2)}</td>
                      <td className="p-1.5 font-semibold text-neutral-900">{row.fp2_uV.toFixed(2)}</td>
                      <td className="p-1.5 text-emerald-800">{row.diff_uV.toFixed(2)}</td>
                      <td className="p-1.5 text-neutral-600">{row.ref_uV.toFixed(2)}</td>
                      <td className="p-1.5 text-neutral-500">
                        {row.impedanceE1}k / {row.impedanceE2}k
                      </td>
                    </tr>
                  ))}
                  {sessionRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-neutral-400">
                        Stream initialized. Samples are being recorded into the session buffer...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Filename Field */}
          <div>
            <label htmlFor="custom-filename-input" className="block text-[11px] font-semibold text-neutral-700 mb-1">
              CUSTOM FILENAME (OPTIONAL):
            </label>
            <input
              id="custom-filename-input"
              type="text"
              placeholder={`kortex_eeg_session_${new Date().toISOString().slice(0, 10)}.csv`}
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="w-full border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-[#141517] focus:border-[#D96514] focus:outline-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-neutral-300 bg-[#EFECE5] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-600">
            {downloadSuccess ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold animate-fadeIn">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                CSV Session Log downloaded successfully!
              </span>
            ) : (
              <span>Ready to export {sessionStats.samplesRecorded} biopotential data points.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(false)}
              className="border border-neutral-300 bg-white px-3.5 py-2 font-mono text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Close
            </button>

            <button
              id="download-session-csv-btn"
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 border border-[#141517] bg-[#141517] px-5 py-2 font-mono text-xs font-semibold text-white hover:bg-[#D96514] hover:border-[#D96514] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D96514]"
            >
              <Download className="h-3.5 w-3.5" />
              Download Session Log (.CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
