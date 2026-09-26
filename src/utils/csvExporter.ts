import { EegSessionRecord } from '../types';

export interface CsvExportMetadata {
  deviceName?: string;
  montage?: string;
  sampleRateHz?: number;
  totalDurationSec?: number;
  mode?: string;
}

/**
 * Formats seconds into a clean human-readable HH:MM:SS or MM:SS string
 */
export function formatDuration(totalSeconds: number): string {
  const rounded = Math.floor(Math.max(0, totalSeconds));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Builds a standardized, research-grade CSV string formatted with BIDS/OpenBCI electrophysiology headers.
 */
export function generateEegCsv(records: EegSessionRecord[], meta: CsvExportMetadata = {}): string {
  const nowIso = new Date().toISOString();
  const device = meta.deviceName || 'Kortex-Kare';
  const montage = meta.montage || 'Dual Prefrontal (Fp1, Fp2) + Earclip REF/GND';
  const sampleRate = meta.sampleRateHz || 250;
  const durationStr = formatDuration(meta.totalDurationSec || 0);

  const headerLines = [
    '# ==============================================================================',
    `# ${device} — ELECTROPHYSIOLOGY SESSION LOG (CSV EXPORT)`,
    `# Export Generated: ${nowIso}`,
    `# Transducer Montage: ${montage}`,
    `# Nominal Sampling Rate: ${sampleRate} Hz (Samples/Second)`,
    `# Total Samples Captured: ${records.length}`,
    `# Session Duration: ${durationStr} (${(meta.totalDurationSec || 0).toFixed(2)} seconds)`,
    `# Acquisition Protocol: ${meta.mode || 'Global Cloud Stream'}`,
    '# Voltage Units: Microvolts (µV) | Impedance Units: Kilo-Ohms (kΩ)',
    '# Channels: E1=Fp1, E2=Fp2, E3=REF/GND, Diff=(Fp1 - Fp2), Aux=ECG Lead II',
    '# Standard Compliance: 10-20 International EEG Electrode Placement & Standard Limb Lead ECG',
    '# ==============================================================================',
    'SampleIndex,Timestamp_ISO,Elapsed_Sec,Fp1_uV,Fp2_uV,REF_uV,Differential_Fp1_Fp2_uV,Impedance_E1_kOhm,Impedance_E2_kOhm,Impedance_REF_kOhm,Battery_Pct,Cognitive_State,ECG_Lead_mV,HeartRate_BPM',
  ];

  const rows = records.map((rec) => {
    return [
      rec.sampleIndex,
      rec.timestampIso,
      rec.elapsedSec.toFixed(3),
      rec.fp1_uV.toFixed(2),
      rec.fp2_uV.toFixed(2),
      rec.ref_uV.toFixed(2),
      rec.diff_uV.toFixed(2),
      rec.impedanceE1.toFixed(1),
      rec.impedanceE2.toFixed(1),
      rec.impedanceRef.toFixed(1),
      rec.batteryPct,
      `"${(rec.cognitiveState || 'normal').replace(/"/g, '""')}"`,
      (rec.ecg_mV ?? 0).toFixed(3),
      rec.heartRate_bpm ?? 72,
    ].join(',');
  });

  return headerLines.concat(rows).join('\r\n');
}

/**
 * Triggers a native client-side file download in the browser.
 */
export function downloadCsvFile(csvContent: string, filename?: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const targetFilename = filename || `kortex_eeg_session_${timestamp}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', targetFilename);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 150);
}
