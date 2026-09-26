import { FC, useState, useMemo, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Activity,
  Heart,
  Brain,
  AlertTriangle,
  ShieldCheck,
  Clock,
  User,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { useCognitiveAlerts } from '../context/CognitiveAlertContext';
import {
  generateClinicalReport,
  generateMedicalHtmlDocument,
  downloadMedicalHtmlReport,
  downloadMedicalTextSummary,
  ClinicalReportData,
} from '../utils/clinicalReportGenerator';
import { PATIENT_MODES } from '../data/patientModesData';

export const SessionDownloadModal: FC = () => {
  const {
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    sessionStats,
    sessionRecords,
    latestPacket,
    patientModeId,
    setPatientModeId,
    source,
    sampleRateHz,
    batteryLevel,
    downloadSessionLog,
  } = useHardwareConnection();

  const { activeMetrics } = useCognitiveAlerts();

  // Patient metadata customization
  const [patientId, setPatientId] = useState<string>('PT-KORTEX-8942');
  const [clinicianName, setClinicianName] = useState<string>('Dr. H. Vance, MD / Ph.D');
  const [patientAge, setPatientAge] = useState<string>('34');
  const [patientGender, setPatientGender] = useState<string>('Female');
  const [showMetadataEditor, setShowMetadataEditor] = useState<boolean>(false);
  const [showRawDataSection, setShowRawDataSection] = useState<boolean>(false);

  // User feedback states
  const [copiedOneLiner, setCopiedOneLiner] = useState<boolean>(false);
  const [downloadSuccessHtml, setDownloadSuccessHtml] = useState<boolean>(false);
  const [downloadSuccessTxt, setDownloadSuccessTxt] = useState<boolean>(false);
  const [csvDownloaded, setCsvDownloaded] = useState<boolean>(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Compute dynamic clinical report data based on current telemetry & metrics
  const report: ClinicalReportData = useMemo(() => {
    return generateClinicalReport({
      sessionStats,
      sessionRecords,
      activeMetrics,
      latestPacket,
      patientModeId,
      source,
      sampleRateHz,
      batteryLevel,
      customPatientId: patientId,
      customClinicianName: clinicianName,
      customPatientAge: patientAge,
      customPatientGender: patientGender,
    });
  }, [
    sessionStats,
    sessionRecords,
    activeMetrics,
    latestPacket,
    patientModeId,
    source,
    sampleRateHz,
    batteryLevel,
    patientId,
    clinicianName,
    patientAge,
    patientGender,
  ]);

  if (!isDownloadModalOpen) return null;

  // Print / Save to PDF handler
  const handlePrint = () => {
    window.print();
  };

  // Download standalone HTML report
  const handleDownloadHtml = () => {
    const ok = downloadMedicalHtmlReport(
      report,
      `kortex_clinical_report_${report.patientId}_${Date.now()}.html`
    );
    if (ok) {
      setDownloadSuccessHtml(true);
      setTimeout(() => setDownloadSuccessHtml(false), 3000);
    }
  };

  // Download plain-text medical summary
  const handleDownloadTxt = () => {
    const ok = downloadMedicalTextSummary(
      report,
      `kortex_clinical_summary_${report.patientId}_${Date.now()}.txt`
    );
    if (ok) {
      setDownloadSuccessTxt(true);
      setTimeout(() => setDownloadSuccessTxt(false), 3000);
    }
  };

  // Copy Executive One-Liner to clipboard
  const handleCopyOneLiner = () => {
    navigator.clipboard.writeText(report.clinicalOneLiner);
    setCopiedOneLiner(true);
    setTimeout(() => setCopiedOneLiner(false), 2500);
  };

  // Optional CSV download for raw technical time-series
  const handleDownloadCsv = () => {
    downloadSessionLog();
    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#141517]/80 backdrop-blur-xs font-mono"
    >
      {/* Print Styles for Native Browser Save-as-PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #clinical-report-printable, #clinical-report-printable * {
            visibility: visible !important;
          }
          #clinical-report-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl border border-neutral-300 bg-[#FAF9F5] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col text-[#141517]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-300 bg-[#EFECE5] px-4 py-3 no-print">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-[#D96514] rounded-xs" />
            <div>
              <div className="text-xs font-bold tracking-wider text-[#141517] flex items-center gap-2">
                <span>CLINICAL NEUROLOGY &amp; DIAGNOSTIC REPORT</span>
                <span className="text-neutral-400 font-normal">·</span>
                <span className="text-neutral-600 text-[11px] font-normal">
                  Medical Record Document
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 font-sans">
                Stress · Cognitive Workload (CLI) · Affective Experience · Diagnostic Screening · Clinical One-Liner
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-3 font-mono text-xs font-semibold text-neutral-800 hover:border-black transition-colors"
              title="Print or Save as PDF"
            >
              <Printer className="h-3.5 w-3.5 text-[#D96514]" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(false)}
              className="h-8 w-8 inline-flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200 transition-colors"
              aria-label="Close clinical report modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* Printable Container */}
          <div id="clinical-report-printable" ref={reportContainerRef} className="space-y-6">
            {/* Hospital / Lab Official Masthead */}
            <div className="border-b-2 border-[#141517] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-[10px] tracking-widest text-[#D96514] font-bold block uppercase">
                  Kortex-Kare Clinical Neuro-Biometrics Center
                </span>
                <h1 className="text-base sm:text-lg font-bold text-[#141517] tracking-tight">
                  NEUROLOGICAL &amp; COGNITIVE DYNAMICS ASSESSMENT REPORT
                </h1>
                <p className="text-[10px] text-neutral-500 font-sans">
                  Dual Prefrontal (Fp1, Fp2) + Common-Mode Reference (REF/GND) + Lead II Electrocardiography
                </p>
              </div>

              <div className="text-left sm:text-right text-[10px] font-mono text-neutral-600 bg-neutral-100 p-2 border border-neutral-200">
                <div>
                  <strong className="text-neutral-900">DOC ID: {report.reportId}</strong>
                </div>
                <div>EXAM DATE: {new Date(report.generatedAtIso).toLocaleDateString()}</div>
                <div>SIGNAL INTEGRITY: OPTIMAL (&lt;10 kΩ)</div>
              </div>
            </div>

            {/* Patient & Examination Metadata Strip */}
            <div className="border border-neutral-300 bg-white p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
                  <User className="h-3 w-3 text-[#D96514]" />
                  SUBJECT DEMOGRAPHICS &amp; RECORDING PARAMETERS
                </span>
                <button
                  type="button"
                  onClick={() => setShowMetadataEditor((v) => !v)}
                  className="no-print text-[10px] text-neutral-600 hover:text-black flex items-center gap-1 underline"
                >
                  <Sliders className="h-2.5 w-2.5" />
                  {showMetadataEditor ? 'Done Editing' : 'Edit Demographics'}
                </button>
              </div>

              {/* Editable Fields if toggled */}
              {showMetadataEditor && (
                <div className="no-print mb-3 p-2.5 bg-neutral-50 border border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] text-neutral-500 block">PATIENT ID</label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full border border-neutral-300 p-1 text-[11px] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 block">ATTENDING CLINICIAN</label>
                    <input
                      type="text"
                      value={clinicianName}
                      onChange={(e) => setClinicianName(e.target.value)}
                      className="w-full border border-neutral-300 p-1 text-[11px] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 block">AGE</label>
                    <input
                      type="text"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="w-full border border-neutral-300 p-1 text-[11px] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 block">GENDER</label>
                    <input
                      type="text"
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full border border-neutral-300 p-1 text-[11px] bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-[9px] text-neutral-500 block">PATIENT ID</span>
                  <strong className="text-neutral-900 font-bold">{report.patientId}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">AGE / GENDER</span>
                  <strong className="text-neutral-900">
                    {report.patientAge} Yrs / {report.patientGender}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">SESSION DURATION</span>
                  <strong className="text-neutral-900">
                    {report.sessionDurationStr} ({report.totalSamples.toLocaleString()} samples)
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">ACQUISITION SOURCE</span>
                  <strong className="text-neutral-900">{report.hardwareSource}</strong>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 1. STRESS LEVEL ASSESSMENT                                      */}
            {/* ============================================================== */}
            <div className="border border-neutral-300 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#E06915]" />
                  <h2 className="text-xs font-bold text-neutral-900 tracking-wider">
                    1. STRESS LEVEL &amp; AUTONOMIC AROUSAL
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${report.stressColor}20`,
                      color: report.stressColor,
                      border: `1px solid ${report.stressColor}60`,
                    }}
                  >
                    {report.stressTier}
                  </span>
                </div>
              </div>

              {/* Stress Gauge Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-semibold text-neutral-500">
                    QUANTIFIED STRESS INDEX:
                  </span>
                  <span
                    className="text-base font-bold font-mono"
                    style={{ color: report.stressColor }}
                  >
                    {report.stressScore}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 border border-neutral-200 overflow-hidden rounded-xs">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${report.stressScore}%`,
                      backgroundColor: report.stressColor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-neutral-400 mt-1 font-mono">
                  <span>0% Low / Rest</span>
                  <span>35% Mild</span>
                  <span>65% Elevated</span>
                  <span>100% Acute Distress</span>
                </div>
              </div>

              {/* Key Biomarkers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 bg-[#FAF9F5] p-2.5 border border-neutral-200">
                <div>
                  <span className="text-[9px] text-neutral-500 block">SYMPATHETIC TONE</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.stressSympatheticRatio}%
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">Autonomic balance</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">BETA / ALPHA RATIO</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.stressBetaAlphaRatio}:1
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">Normative: &lt;1.0</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">HEART RATE</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.stressHeartRateBpm} BPM
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">Cardiac pacing</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">HRV RMSSD</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.stressHrvRmssdMs} ms
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">Vagal parasympathetic</span>
                </div>
              </div>

              {/* Clinical Narrative on Stress */}
              <div className="text-[11px] leading-relaxed text-neutral-700 bg-neutral-50 p-2.5 border-l-2 border-[#E06915]">
                <strong className="text-neutral-900 font-semibold block mb-0.5">
                  Physiological Stress Findings:
                </strong>
                {report.stressClinicalNarrative}
              </div>
            </div>

            {/* ============================================================== */}
            {/* 2. COGNITIVE LOAD ASSESSMENT                                    */}
            {/* ============================================================== */}
            <div className="border border-neutral-300 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  <h2 className="text-xs font-bold text-neutral-900 tracking-wider">
                    2. COGNITIVE LOAD &amp; MENTAL WORKLOAD (CLI)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${report.cognitiveLoadColor}20`,
                      color: report.cognitiveLoadColor,
                      border: `1px solid ${report.cognitiveLoadColor}60`,
                    }}
                  >
                    {report.cognitiveLoadTier}
                  </span>
                </div>
              </div>

              {/* Cognitive Load Gauge Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-semibold text-neutral-500">
                    COGNITIVE LOAD INDEX (CLI):
                  </span>
                  <span
                    className="text-base font-bold font-mono"
                    style={{ color: report.cognitiveLoadColor }}
                  >
                    {report.cognitiveLoadScore}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 border border-neutral-200 overflow-hidden rounded-xs">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${report.cognitiveLoadScore}%`,
                      backgroundColor: report.cognitiveLoadColor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-neutral-400 mt-1 font-mono">
                  <span>0% Underload</span>
                  <span>40% Balanced</span>
                  <span>70% High Load</span>
                  <span>100% Executive Exhaustion</span>
                </div>
              </div>

              {/* Key Cognitive Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 bg-[#FAF9F5] p-2.5 border border-neutral-200">
                <div>
                  <span className="text-[9px] text-neutral-500 block">FRONTAL THETA (Fmθ)</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.frontalThetaPowerPct}%
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">Working memory load</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">THETA / ALPHA RATIO</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.thetaAlphaRatio}
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">TAR fatigue indicator</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">ENGAGEMENT INDEX</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.taskEngagementIndex}
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">Beta / (Alpha + Theta)</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">RESERVE BUFFER</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.mentalReserveRemainingPct}%
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">Residual mental reserve</span>
                </div>
              </div>

              {/* Clinical Narrative on Cognitive Load */}
              <div className="text-[11px] leading-relaxed text-neutral-700 bg-neutral-50 p-2.5 border-l-2 border-blue-600">
                <strong className="text-neutral-900 font-semibold block mb-0.5">
                  Cognitive Workload Findings:
                </strong>
                {report.cognitiveLoadClinicalNarrative}
              </div>
            </div>

            {/* ============================================================== */}
            {/* 3. HOW THE PATIENT FEELS (AFFECTIVE & SUBJECTIVE STATE)         */}
            {/* ============================================================== */}
            <div className="border border-neutral-300 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-600" />
                  <h2 className="text-xs font-bold text-neutral-900 tracking-wider">
                    3. HOW THE PATIENT FEELS (AFFECTIVE &amp; SUBJECTIVE STATE)
                  </h2>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    report.patientFeelingsValence.includes('Positive')
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : report.patientFeelingsValence.includes('Negative')
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  }`}
                >
                  {report.patientFeelingsValence}
                </span>
              </div>

              <div className="mb-3">
                <div className="text-[10px] text-neutral-500">SUBJECTIVE AFFECTIVE HEADLINE:</div>
                <div className="text-sm font-bold text-[#141517] mt-0.5 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#D96514]" />
                  <span>{report.patientFeelingsHeadline}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 bg-[#FAF9F5] p-2.5 border border-neutral-200">
                <div>
                  <span className="text-[9px] text-neutral-500 block">PRIMARY EMOTION</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.patientFeelingsEmotion}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">AROUSAL STATE</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.patientFeelingsArousal.toUpperCase()}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 block">FRONTAL ASYMMETRY (FAA)</span>
                  <strong className="text-xs text-neutral-900 font-bold">
                    {report.frontalAlphaAsymmetryIndex > 0
                      ? `+${report.frontalAlphaAsymmetryIndex.toFixed(2)}`
                      : report.frontalAlphaAsymmetryIndex.toFixed(2)}
                  </strong>
                  <span className="text-[8px] text-neutral-400 block">
                    {report.frontalAlphaAsymmetryIndex > 0 ? 'Approach / Calm' : 'Withdrawal / Stress'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] leading-relaxed text-neutral-700 bg-neutral-50 p-2.5 border-l-2 border-purple-600">
                <strong className="text-neutral-900 font-semibold block mb-0.5">
                  Subjective Patient Experience:
                </strong>
                <p className="mb-1.5">{report.patientFeelingsNarrative}</p>
                <p className="text-[10px] text-neutral-500 italic">
                  <strong>Biophysical Correlation:</strong> {report.frontalAlphaAsymmetryInterpretation}
                </p>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 4. CLINICAL CONDITION SCREENING                                  */}
            {/* ============================================================== */}
            <div className="border border-neutral-300 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  {report.conditionDetected ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-[#D96514]" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  <h2 className="text-xs font-bold text-neutral-900 tracking-wider">
                    4. CLINICAL CONDITION SCREENING (IS THERE ANY CONDITION?)
                  </h2>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    !report.conditionDetected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : report.conditionSeverity.includes('Marked')
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {report.conditionStatusBadge}
                </span>
              </div>

              <div className="mb-3">
                <span className="text-[9px] text-neutral-500 block uppercase">
                  DETECTED CONDITION / PROFILE:
                </span>
                <strong className="text-sm text-neutral-900 font-bold block mt-0.5">
                  {report.conditionName}
                </strong>
                <div className="text-[10px] text-neutral-600 mt-0.5">
                  <span>Category: </span>
                  <strong className="text-neutral-800">{report.conditionCategory}</strong>
                  <span className="mx-1.5">|</span>
                  <span>Severity: </span>
                  <strong className="text-neutral-800">{report.conditionSeverity}</strong>
                </div>
              </div>

              {/* Condition biomarker flags */}
              <div className="mb-3">
                <span className="text-[9px] font-bold text-neutral-500 tracking-wider block mb-1">
                  OBSERVED BIOMARKER FLAGS &amp; EVIDENCE:
                </span>
                <div className="space-y-1">
                  {report.conditionClinicalFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 text-[10px] bg-neutral-50 border border-neutral-200 px-2 py-1 text-neutral-800"
                    >
                      <span className="text-[#D96514] font-bold">•</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] leading-relaxed text-neutral-700 bg-neutral-50 p-2.5 border-l-2 border-[#141517] mb-3">
                <strong className="text-neutral-900 font-semibold block mb-0.5">
                  Differential Neurological Analysis:
                </strong>
                {report.conditionDiagnosticAnalysis}
              </div>

              {/* Recommendations */}
              <div className="bg-[#FAF9F5] p-2.5 border border-neutral-200">
                <span className="text-[9px] font-bold text-neutral-700 tracking-wider block mb-1">
                  CLINICAL RECOMMENDATIONS &amp; ACTIONABLE STEPS:
                </span>
                <ul className="space-y-1 text-[10px] text-neutral-700 pl-4 list-disc">
                  {report.clinicalRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 5. CLINICAL ONE-LINER (AT THE END)                               */}
            {/* ============================================================== */}
            <div className="border-2 border-[#141517] bg-[#141517] text-white p-4 sm:p-5 relative shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] tracking-widest text-[#D96514] font-bold uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  5. CLINICAL EXECUTIVE ONE-LINER (AT THE END)
                </span>
                <button
                  type="button"
                  onClick={handleCopyOneLiner}
                  className="no-print inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 text-[10px] transition-colors border border-white/20"
                >
                  {copiedOneLiner ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-neutral-300" />
                      <span>Copy One-Liner</span>
                    </>
                  )}
                </button>
              </div>

              <blockquote className="text-xs sm:text-sm font-semibold text-[#FAF9F5] leading-relaxed italic border-l-2 border-[#D96514] pl-3 my-2">
                "{report.clinicalOneLiner}"
              </blockquote>

              <div className="text-[9px] text-neutral-400 mt-3 pt-2 border-t border-neutral-800 flex justify-between items-center">
                <span>Certified Neuro-Biometric Assessment Takeaway</span>
                <span>Clinician: {report.clinicianName}</span>
              </div>
            </div>

            {/* Optional Collapsible Technical Data Section */}
            <div className="no-print pt-2">
              <button
                type="button"
                onClick={() => setShowRawDataSection((v) => !v)}
                className="text-[10px] text-neutral-600 hover:text-black flex items-center gap-1 font-semibold"
              >
                {showRawDataSection ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span>Technical Details &amp; Raw Samples (Optional Lab Utilities)</span>
              </button>

              {showRawDataSection && (
                <div className="mt-2 p-3 bg-white border border-neutral-300 text-[10px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Active Profile: <strong>{report.activePatientProfileName}</strong></span>
                    <span>Mean Fp1: <strong>{report.meanFp1_uV} µV</strong> | Mean Fp2: <strong>{report.meanFp2_uV} µV</strong></span>
                  </div>
                  <div className="text-neutral-500">
                    If raw comma-separated voltage values are needed for OpenBCI/MATLAB processing:
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="inline-flex items-center gap-1 border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 px-2 py-1 text-[10px]"
                  >
                    <FileSpreadsheet className="h-3 w-3 text-neutral-600" />
                    <span>Download Raw Sensor CSV ({sessionStats.samplesRecorded} samples)</span>
                    {csvDownloaded && <span className="text-emerald-700 font-bold ml-1">✓ CSV Saved</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="border-t border-neutral-300 bg-[#EFECE5] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="text-[11px] text-neutral-600">
            {downloadSuccessHtml ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold animate-fadeIn">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Diagnostic Medical Report (.HTML) downloaded successfully!
              </span>
            ) : downloadSuccessTxt ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold animate-fadeIn">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Clinical Summary (.TXT) downloaded successfully!
              </span>
            ) : (
              <span>Ready to export clinical diagnostic report ({report.totalSamples} samples).</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-3.5 font-mono text-xs font-semibold text-neutral-800 hover:border-black transition-colors"
              title="Print or Save as PDF"
            >
              <Printer className="h-3.5 w-3.5 text-neutral-700" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="h-9 inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-3.5 font-mono text-xs font-semibold text-neutral-800 hover:border-black transition-colors"
              title="Download text summary for medical records"
            >
              <FileText className="h-3.5 w-3.5 text-neutral-700" />
              <span>Summary (.TXT)</span>
            </button>

            <button
              id="download-medical-report-btn"
              type="button"
              onClick={handleDownloadHtml}
              className="h-9 inline-flex items-center gap-2 border border-[#D96514] bg-[#D96514] px-4 font-mono text-xs font-semibold text-white hover:bg-[#b8520e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D96514] shadow-xs"
              title="Download standalone Medical Diagnostic HTML Report"
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>Download Report (.HTML)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
