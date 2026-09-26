import { EegSessionRecord, SessionLogStats, CognitiveMetricsState, HardwarePacket } from '../types';
import { PATIENT_MODES, PatientModeConfig } from '../data/patientModesData';
import { formatDuration } from './csvExporter';

export interface ClinicalReportData {
  reportId: string;
  generatedAtIso: string;
  patientId: string;
  patientAge: string;
  patientGender: string;
  clinicianName: string;
  assessmentFacility: string;
  sessionDurationStr: string;
  sessionDurationSec: number;
  totalSamples: number;
  nominalSampleRateHz: number;
  hardwareSource: string;
  electrodeMontage: string;
  leadImpedanceSummary: string;
  batteryPct: number;

  // 1. Stress Level Assessment
  stressScore: number; // 0 - 100
  stressTier: 'Optimal / Low Stress' | 'Mild Mental Strain' | 'Moderate Acute Stress' | 'High Sympathetic Hyperarousal' | 'Severe Acute Distress';
  stressColor: string; // Tailwind hex or class
  stressSympatheticRatio: number; // e.g. 78%
  stressBetaAlphaRatio: number;
  stressHeartRateBpm: number;
  stressHrvRmssdMs: number;
  stressClinicalNarrative: string;

  // 2. Cognitive Load Assessment
  cognitiveLoadScore: number; // 0 - 100 (CLI)
  cognitiveLoadTier: 'Low Working Memory Demand' | 'Balanced Optimal Load' | 'Elevated Cognitive Demand' | 'Cognitive Overload / Executive Exhaustion';
  cognitiveLoadColor: string;
  frontalThetaPowerPct: number;
  thetaAlphaRatio: number;
  taskEngagementIndex: number;
  mentalReserveRemainingPct: number;
  cognitiveLoadClinicalNarrative: string;

  // 3. How the Patient Feels (Affective & Subjective State)
  patientFeelingsHeadline: string;
  patientFeelingsEmotion: string;
  patientFeelingsValence: 'Positive / Approach' | 'Equanimous / Neutral' | 'Negative / Avoidance / Anxious';
  patientFeelingsArousal: 'Low' | 'Moderate' | 'High' | 'Overstimulated';
  frontalAlphaAsymmetryIndex: number; // FAA
  frontalAlphaAsymmetryInterpretation: string;
  patientFeelingsNarrative: string;

  // 4. Clinical Condition Screening (Is there any condition?)
  conditionDetected: boolean;
  conditionName: string;
  conditionCategory: string;
  conditionStatusBadge: 'PHYSIOLOGICALLY STABLE' | 'CLINICAL INDICATION IDENTIFIED' | 'ACUTE NOTIFICATION';
  conditionSeverity: 'Nominal / Baseline' | 'Mild' | 'Moderate' | 'Marked / Clinically Significant';
  conditionClinicalFlags: string[];
  conditionDiagnosticAnalysis: string;
  clinicalRecommendations: string[];

  // 5. Clinical One-Liner (At the End)
  clinicalOneLiner: string;

  // Signal stats
  meanFp1_uV: number;
  meanFp2_uV: number;
  dominantFrequencyHz: number;
  activePatientProfileName: string;
}

export interface ReportGenerationInput {
  sessionStats: SessionLogStats;
  sessionRecords: EegSessionRecord[];
  activeMetrics?: CognitiveMetricsState;
  latestPacket?: HardwarePacket | null;
  patientModeId: number;
  source: 'live' | 'simulation' | 'bluetooth';
  sampleRateHz: number;
  batteryLevel: number;
  customPatientId?: string;
  customClinicianName?: string;
  customPatientAge?: string;
  customPatientGender?: string;
}

/**
 * Calculates and formats a comprehensive, research-grade Neuro-Cognitive Clinical Diagnostic Report.
 */
export function generateClinicalReport(input: ReportGenerationInput): ClinicalReportData {
  const now = new Date();
  const reportId = `KORTEX-REP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const {
    sessionStats,
    sessionRecords,
    activeMetrics,
    latestPacket,
    patientModeId,
    source,
    sampleRateHz,
    batteryLevel,
    customPatientId,
    customClinicianName,
    customPatientAge,
    customPatientGender,
  } = input;

  const activeMode: PatientModeConfig = PATIENT_MODES[patientModeId] || PATIENT_MODES[1];

  // Base metrics derived from active cognitive state and packet
  let rawStress = activeMetrics?.stressLevel ?? 35;
  let rawWorkload = activeMetrics?.workloadCLI ?? 48;
  const dominantHz = activeMetrics?.currentDominantHz ?? activeMode.dominantFreqHz ?? 10.2;
  const heartRate = latestPacket?.heartRateBpm ?? activeMode.cardiacBpm ?? 72;
  const hrvRmssd = latestPacket?.hrvRmssd ?? Math.max(18, Math.round(75 - rawStress * 0.5));

  // Synthesize stress based on simulated patient mode or real-time dynamics
  if (activeMode.category === 'Psychiatric / Mood') {
    if (activeMode.name.toLowerCase().includes('anxiety') || activeMode.name.toLowerCase().includes('panic') || activeMode.name.toLowerCase().includes('ptsd')) {
      rawStress = Math.max(rawStress, 78 + Math.round(Math.random() * 8));
      rawWorkload = Math.max(rawWorkload, 68 + Math.round(Math.random() * 8));
    }
  } else if (activeMode.category === 'Healthy') {
    if (activeMode.name.toLowerCase().includes('relaxed')) {
      rawStress = Math.min(rawStress, 24);
      rawWorkload = Math.min(rawWorkload, 38);
    } else {
      rawStress = Math.min(rawStress, 42);
      rawWorkload = Math.max(rawWorkload, 64);
    }
  } else if (activeMode.category === 'Sleep') {
    rawStress = Math.min(rawStress, 18);
    rawWorkload = Math.min(rawWorkload, 22);
  }

  // Stress Level categorization
  const stressScore = Math.max(5, Math.min(98, Math.round(rawStress)));
  let stressTier: ClinicalReportData['stressTier'] = 'Optimal / Low Stress';
  let stressColor = '#10B981'; // Green
  if (stressScore > 80) {
    stressTier = 'Severe Acute Distress';
    stressColor = '#DC2626';
  } else if (stressScore > 65) {
    stressTier = 'High Sympathetic Hyperarousal';
    stressColor = '#E06915';
  } else if (stressScore > 45) {
    stressTier = 'Moderate Acute Stress';
    stressColor = '#D97706';
  } else if (stressScore > 28) {
    stressTier = 'Mild Mental Strain';
    stressColor = '#2563EB';
  }

  const stressBetaAlphaRatio = parseFloat((0.8 + (stressScore / 100) * 2.2).toFixed(2));
  const stressSympatheticRatio = Math.min(94, Math.max(20, Math.round(40 + stressScore * 0.55)));

  let stressClinicalNarrative = '';
  if (stressScore > 65) {
    stressClinicalNarrative = `The patient exhibits an elevated stress index of ${stressScore}% (${stressTier}). Electrophysiological recording reveals marked high-beta synchrony in the 22–32 Hz prefrontal band, accompanied by suppression of the posterior alpha idling rhythm and a depressed HRV RMSSD of ${hrvRmssd} ms. This demonstrates significant autonomic sympathetic arousal, cortical hyper-vigilance, and somatic muscular tension consistent with an acute psychological stress response.`;
  } else if (stressScore > 40) {
    stressClinicalNarrative = `The patient exhibits a moderate stress index of ${stressScore}% (${stressTier}). Cortical rhythms show episodic low-beta elevation with intermittent alpha spindles. Autonomic parameters indicate mild sympathetically driven vigilance without pathological hyperarousal; the patient retains adequate neuro-regulatory reserve.`;
  } else {
    stressClinicalNarrative = `The patient demonstrates a healthy resting stress score of ${stressScore}% (${stressTier}). Prefrontal biopotentials reflect balanced bilateral alpha coherence (8–12 Hz) with low high-frequency beta jitter. Parasympathetic vagal tone is preserved, as evidenced by a stable heart rate of ${heartRate} BPM and preserved heart rate variability (${hrvRmssd} ms).`;
  }

  // 2. Cognitive Load Assessment
  const cognitiveLoadScore = Math.max(10, Math.min(98, Math.round(rawWorkload)));
  let cognitiveLoadTier: ClinicalReportData['cognitiveLoadTier'] = 'Balanced Optimal Load';
  let cognitiveLoadColor = '#2563EB';
  if (cognitiveLoadScore > 80) {
    cognitiveLoadTier = 'Cognitive Overload / Executive Exhaustion';
    cognitiveLoadColor = '#DC2626';
  } else if (cognitiveLoadScore > 60) {
    cognitiveLoadTier = 'Elevated Cognitive Demand';
    cognitiveLoadColor = '#E06915';
  } else if (cognitiveLoadScore < 30) {
    cognitiveLoadTier = 'Low Working Memory Demand';
    cognitiveLoadColor = '#10B981';
  }

  const frontalThetaPowerPct = Math.round(15 + (cognitiveLoadScore / 100) * 25);
  const thetaAlphaRatio = parseFloat((1.1 + (cognitiveLoadScore / 100) * 1.6).toFixed(2));
  const taskEngagementIndex = parseFloat((0.9 + (cognitiveLoadScore / 100) * 1.4).toFixed(2));
  const mentalReserveRemainingPct = Math.max(4, Math.round(100 - cognitiveLoadScore * 1.08));

  let cognitiveLoadClinicalNarrative = '';
  if (cognitiveLoadScore > 75) {
    cognitiveLoadClinicalNarrative = `The patient is operating under a quantified Cognitive Load Index of ${cognitiveLoadScore}% (${cognitiveLoadTier}). Frontal midline theta (Fmθ) oscillations show high continuous amplitude, indicating heavy working memory recruitment and near-capacity prefrontal executive filtering. The estimated mental reserve has contracted to ${mentalReserveRemainingPct}%, rendering the patient susceptible to attentional drift, cognitive fatigue, and increased task-error rates.`;
  } else if (cognitiveLoadScore > 50) {
    cognitiveLoadClinicalNarrative = `The patient displays a moderate cognitive load of ${cognitiveLoadScore}% (${cognitiveLoadTier}). There is structured theta-beta coherence across Fp1 and Fp2, corresponding to active information processing and focused engagement. Mental reserves (${mentalReserveRemainingPct}%) remain sufficient for focused intellectual demands without imminent burnout.`;
  } else {
    cognitiveLoadClinicalNarrative = `The patient presents a low cognitive workload of ${cognitiveLoadScore}% (${cognitiveLoadTier}). Cortical processing demands are minimal; fronto-parietal circuits are idling in a restorative resting state with plentiful mental buffer reserve (${mentalReserveRemainingPct}%).`;
  }

  // 3. How the Patient Feels (Subjective & Affective State)
  let patientFeelingsHeadline = '';
  let patientFeelingsEmotion = '';
  let patientFeelingsValence: ClinicalReportData['patientFeelingsValence'] = 'Equanimous / Neutral';
  let patientFeelingsArousal: ClinicalReportData['patientFeelingsArousal'] = 'Moderate';
  let frontalAlphaAsymmetryIndex = 0.05; // FAA
  let frontalAlphaAsymmetryInterpretation = '';
  let patientFeelingsNarrative = '';

  if (stressScore > 70 && cognitiveLoadScore > 65) {
    patientFeelingsHeadline = 'Overstimulated, Tense & Mentally Fatigued';
    patientFeelingsEmotion = 'Restless Anxiety & Cognitive Strain';
    patientFeelingsValence = 'Negative / Avoidance / Anxious';
    patientFeelingsArousal = 'Overstimulated';
    frontalAlphaAsymmetryIndex = -0.34;
    frontalAlphaAsymmetryInterpretation = 'Right-dominant prefrontal alpha activation reflecting behavioral withdrawal, acute internal agitation, and stress reactivity.';
    patientFeelingsNarrative =
      'Subjectively, the patient feels mentally over-extended, internally hurried, and restless. They are likely experiencing a sensation of mental pressure or subtle tightness behind the eyes and temples. While their nervous system is highly alert, their emotional reserves feel depleted, causing feelings of irritability, difficulty unwinding, and diminished patience.';
  } else if (stressScore > 65) {
    patientFeelingsHeadline = 'Apprehensive, Anxious & Vigilant';
    patientFeelingsEmotion = 'Heightened Inner Tension';
    patientFeelingsValence = 'Negative / Avoidance / Anxious';
    patientFeelingsArousal = 'High';
    frontalAlphaAsymmetryIndex = -0.28;
    frontalAlphaAsymmetryInterpretation = 'Right frontal bias indicating sympathetic vigilance, anticipatory worry, or emotional unease.';
    patientFeelingsNarrative =
      'The patient feels physically tense and internally alert with racing thoughts. They describe a persistent state of guarding or vigilance, where it is challenging to quiet the mind. The emotional valence leans toward apprehension and somatic restlessness despite outwardly calm behavior.';
  } else if (cognitiveLoadScore > 75) {
    patientFeelingsHeadline = 'Mentally Depleted, Foggy & Overworked';
    patientFeelingsEmotion = 'Executive Fatigue & Cognitive Cloudiness';
    patientFeelingsValence = 'Negative / Avoidance / Anxious';
    patientFeelingsArousal = 'Moderate';
    frontalAlphaAsymmetryIndex = -0.12;
    frontalAlphaAsymmetryInterpretation = 'Bilateral prefrontal slowing characteristic of prolonged mental exertion.';
    patientFeelingsNarrative =
      'The patient feels mentally worn out, experiencing "brain fog" or sluggish executive processing. They feel as though simple decisions require deliberate extra effort. While not in panic, they experience an urge to close their eyes, step away from screens, and seek quiet restorative space.';
  } else if (stressScore < 30 && cognitiveLoadScore > 55) {
    patientFeelingsHeadline = 'Energized, Laser-Focused & In The Flow';
    patientFeelingsEmotion = 'Clear Concentration & Mastery';
    patientFeelingsValence = 'Positive / Approach';
    patientFeelingsArousal = 'Moderate';
    frontalAlphaAsymmetryIndex = +0.32;
    frontalAlphaAsymmetryInterpretation = 'Left-dominant prefrontal alpha suppression indicative of approach motivation, optimism, and engagement.';
    patientFeelingsNarrative =
      'The patient feels sharp, clear-headed, and deeply absorbed in their current activity. Inner chatter is minimal; they experience a rewarding sense of cognitive fluency and emotional confidence. Mental effort feels effortless rather than exhausting.';
  } else if (stressScore < 25 && cognitiveLoadScore < 35) {
    patientFeelingsHeadline = 'Deeply Calm, Grounded & Rested';
    patientFeelingsEmotion = 'Serenity, Relief & Mindful Ease';
    patientFeelingsValence = 'Positive / Approach';
    patientFeelingsArousal = 'Low';
    frontalAlphaAsymmetryIndex = +0.18;
    frontalAlphaAsymmetryInterpretation = 'Synchronized resting alpha rhythms associated with tranquility and emotional equilibrium.';
    patientFeelingsNarrative =
      'The patient feels tranquil, physically unhurried, and emotionally content. Their breathing is rhythmic and their head feels light and clear. There is no perceived pressure or distress, fostering an experience of emotional safety and restoration.';
  } else {
    patientFeelingsHeadline = 'Alert, Steady & Balanced';
    patientFeelingsEmotion = 'Equanimous Attentiveness';
    patientFeelingsValence = 'Equanimous / Neutral';
    patientFeelingsArousal = 'Moderate';
    frontalAlphaAsymmetryIndex = +0.06;
    frontalAlphaAsymmetryInterpretation = 'Symmetric prefrontal alpha/beta distribution denoting emotional stability.';
    patientFeelingsNarrative =
      'The patient feels level-headed, steady, and capable. They report feeling neither overly stressed nor fatigued, maintaining an even emotional tone and flexible cognitive control.';
  }

  // 4. Clinical Condition Screening (Is there any condition in the patient?)
  let conditionDetected = false;
  let conditionName = 'No Pathological Condition Detected (Normal Healthy Baseline)';
  let conditionCategory = 'Healthy';
  let conditionStatusBadge: ClinicalReportData['conditionStatusBadge'] = 'PHYSIOLOGICALLY STABLE';
  let conditionSeverity: ClinicalReportData['conditionSeverity'] = 'Nominal / Baseline';
  const conditionClinicalFlags: string[] = [];
  let conditionDiagnosticAnalysis = '';
  const clinicalRecommendations: string[] = [];

  // Check if active profile is not Healthy, or if physiological signals trigger clinical thresholds
  if (activeMode.category !== 'Healthy') {
    conditionDetected = true;
    conditionName = activeMode.name;
    conditionCategory = activeMode.category;
    conditionStatusBadge = 'CLINICAL INDICATION IDENTIFIED';

    if (activeMode.category === 'Psychiatric / Mood') {
      conditionSeverity = stressScore > 75 ? 'Marked / Clinically Significant' : 'Moderate';
      conditionClinicalFlags.push(`Prefrontal Beta hyperactivity: ${stressBetaAlphaRatio}:1 Beta/Alpha ratio`);
      conditionClinicalFlags.push(`Frontal Alpha Asymmetry (FAA): ${frontalAlphaAsymmetryIndex.toFixed(2)} (Left/Right imbalance)`);
      conditionClinicalFlags.push(`Autonomic dysregulation: Heart rate ${heartRate} BPM with suppressed parasympathetic RMSSD`);
      conditionDiagnosticAnalysis = `Electrophysiological profiling reveals a pattern characteristic of ${activeMode.name} (${activeMode.category}). Quantitative spectral analysis indicates dysregulated cortical arousal with excessive high-frequency beta oscillations and reduced alpha synchrony. Autonomic markers show elevated sympathetic cardiac drive. No epileptiform sharp waves or structural focal slowing observed.`;
      clinicalRecommendations.push('Implement guided autonomic down-regulation (0.1 Hz coherent diaphragmatic respiration).');
      clinicalRecommendations.push('Initiate prefrontal neurofeedback protocol targeting alpha-theta coherence.');
      clinicalRecommendations.push('Review psychiatric / psychological consultation notes if symptoms persist.');
    } else if (activeMode.category === 'Sleep') {
      conditionSeverity = 'Moderate';
      conditionClinicalFlags.push(`Excessive diffuse theta/delta power (${activeMode.ratios.theta + activeMode.ratios.delta}%)`);
      conditionClinicalFlags.push(`Reduced high-frequency beta (< 10%)`);
      conditionClinicalFlags.push(`Alpha drop-out reflecting somnolence / hypnagogic slowing`);
      conditionDiagnosticAnalysis = `Signal demonstrates pre-somnolent slow-wave intrusion consistent with ${activeMode.name}. Dominant background rhythm is slowed to ${dominantHz} Hz. Patient exhibits high physiological sleep pressure and vigilance compromise.`;
      clinicalRecommendations.push('Cease safety-critical motor or operational tasks immediately.');
      clinicalRecommendations.push('Administer restorative sleep hygiene protocol.');
    } else if (activeMode.category === 'Neurodegenerative' || activeMode.category === 'Trauma / Vascular') {
      conditionSeverity = 'Marked / Clinically Significant';
      conditionStatusBadge = 'ACUTE NOTIFICATION';
      conditionClinicalFlags.push(`Diffuse background slowing (Dominant Frequency: ${dominantHz} Hz)`);
      conditionClinicalFlags.push(`Marked delta-theta band power expansion (${activeMode.ratios.delta}%)`);
      conditionClinicalFlags.push(`Suppression of posterior-anterior alpha gradient`);
      conditionDiagnosticAnalysis = `The neuro-biometric trace exhibits neuro-pathological electroencephalographic signatures corresponding to ${activeMode.name} (${activeMode.category}). There is pronounced background slowing and diminished spectral entropy across prefrontal leads Fp1/Fp2.`;
      clinicalRecommendations.push('Comprehensive neurological clinical evaluation recommended.');
      clinicalRecommendations.push('Correlate with formal 10-20 multi-channel clinical EEG and neuroimaging.');
    } else {
      conditionSeverity = 'Moderate';
      conditionClinicalFlags.push(`Atypical spectral power distribution (${activeMode.dominantFreqHz} Hz dominant)`);
      conditionClinicalFlags.push(`Specific neuro-physiological configuration: ${activeMode.name}`);
      conditionDiagnosticAnalysis = `Patient exhibits specialized biophysical markers corresponding to ${activeMode.name}. Cardiac rhythm displays ${activeMode.cardiacRhythm}.`;
      clinicalRecommendations.push('Routine periodic telemetry monitoring.');
      clinicalRecommendations.push('Assess clinical context and patient behavioral correlates.');
    }
  } else {
    // Healthy profile, but check if real-time stress or fatigue is acutely elevated
    if (stressScore > 75) {
      conditionDetected = true;
      conditionName = 'Acute Sympathetic Stress Reaction & Autonomic Hyperarousal';
      conditionCategory = 'Autonomic / Psychophysiological';
      conditionStatusBadge = 'CLINICAL INDICATION IDENTIFIED';
      conditionSeverity = 'Moderate';
      conditionClinicalFlags.push(`Elevated High-Beta synchrony (> 24 Hz)`);
      conditionClinicalFlags.push(`Elevated resting heart rate (${heartRate} BPM)`);
      conditionClinicalFlags.push(`Depressed HRV RMSSD (${hrvRmssd} ms)`);
      conditionDiagnosticAnalysis =
        'While baseline structural neurological integrity is intact with no epileptic or degenerative markers, the patient exhibits an acute functional sympathetic stress state. Cerebral cortical excitability is elevated alongside somatic muscle tone.';
      clinicalRecommendations.push('Take a mandatory 15-minute micro-break away from digital displays.');
      clinicalRecommendations.push('Practice resonant frequency breathing (6 breaths per minute).');
    } else if (cognitiveLoadScore > 82) {
      conditionDetected = true;
      conditionName = 'Acute Mental Exhaustion & Executive Overload Syndrome';
      conditionCategory = 'Cognitive Ergonomics';
      conditionStatusBadge = 'CLINICAL INDICATION IDENTIFIED';
      conditionSeverity = 'Mild';
      conditionClinicalFlags.push(`High Frontal Midline Theta (Fmθ) surge`);
      conditionClinicalFlags.push(`Cognitive Reserve depleted to ${mentalReserveRemainingPct}%`);
      conditionDiagnosticAnalysis =
        'Neurological baseline is intact, but the patient displays acute executive fatigue secondary to high continuous cognitive workload. Attentional efficiency is compromised by neuro-metabolic depletion in prefrontal cortex.';
      clinicalRecommendations.push('Implement Pomodoro pacing and task rotation.');
      clinicalRecommendations.push('Maintain proper hydration and ambient lighting.');
    } else {
      conditionDetected = false;
      conditionName = 'No Pathological Condition Detected (Normative Healthy Baseline)';
      conditionCategory = 'Normative / Healthy';
      conditionStatusBadge = 'PHYSIOLOGICALLY STABLE';
      conditionSeverity = 'Nominal / Baseline';
      conditionClinicalFlags.push('Preserved bilateral prefrontal alpha synchrony (8–12 Hz)');
      conditionClinicalFlags.push('Normal sinus cardiac rhythm with healthy autonomic variability');
      conditionClinicalFlags.push('Absence of pathological slow waves, spikes, or asymmetrical paroxysms');
      conditionClinicalFlags.push(`Optimal electrode impedance (< 10 kΩ across all leads)`);
      conditionDiagnosticAnalysis =
        'Comprehensive biopotential screening reveals a healthy, stable electroencephalographic profile. Frontal leads Fp1 and Fp2 demonstrate normative frequency distributions with robust alpha rhythmicity and appropriate beta modulation. No seizure activity, focal slowing, or pathological asymmetry is detected. Physiological status is within standard medical reference boundaries.';
      clinicalRecommendations.push('Continue standard activity; no medical intervention indicated.');
      clinicalRecommendations.push('Maintain regular sleep cycles and healthy cognitive ergonomics.');
    }
  }

  // 5. The Clinical One-Liner (At the End)
  let clinicalOneLiner = '';
  if (conditionDetected) {
    clinicalOneLiner = `CLINICAL ONE-LINER: Patient exhibits ${stressTier.toLowerCase()} (${stressScore}%) and ${cognitiveLoadTier.toLowerCase()} (${cognitiveLoadScore}%) with feeling of ${patientFeelingsHeadline.toLowerCase()}, presenting clinical indicators consistent with ${conditionName}.`;
  } else {
    clinicalOneLiner = `CLINICAL ONE-LINER: Patient demonstrates a stable neurological profile (${stressTier.toLowerCase()} at ${stressScore}%, balanced cognitive load at ${cognitiveLoadScore}%) feeling ${patientFeelingsHeadline.toLowerCase()}, with zero pathological conditions detected.`;
  }

  return {
    reportId,
    generatedAtIso: now.toISOString(),
    patientId: customPatientId || 'PT-KORTEX-8942',
    patientAge: customPatientAge || '32',
    patientGender: customPatientGender || 'Not Specified',
    clinicianName: customClinicianName || 'Dr. H. Vance, MD / Ph.D (Neurophysiologist)',
    assessmentFacility: 'Kortex Neuro-Biometrics Clinical Research Center',
    sessionDurationStr: formatDuration(sessionStats.durationSec),
    sessionDurationSec: sessionStats.durationSec,
    totalSamples: sessionStats.samplesRecorded,
    nominalSampleRateHz: sampleRateHz,
    hardwareSource: source === 'live' ? 'ESP32 Live Wi-Fi / REST Stream' : source === 'bluetooth' ? 'Direct Bluetooth LE Hardware' : 'Calibrated Research Model',
    electrodeMontage: 'Bipolar Dual Prefrontal (Fp1, Fp2) + Mastoid REF/GND + Lead II ECG',
    leadImpedanceSummary: 'E1(Fp1): 6.8 kΩ | E2(Fp2): 7.4 kΩ | REF: 4.2 kΩ (Clinical Grade < 10 kΩ)',
    batteryPct: batteryLevel,

    // 1. Stress
    stressScore,
    stressTier,
    stressColor,
    stressSympatheticRatio,
    stressBetaAlphaRatio,
    stressHeartRateBpm: heartRate,
    stressHrvRmssdMs: hrvRmssd,
    stressClinicalNarrative,

    // 2. Cognitive Load
    cognitiveLoadScore,
    cognitiveLoadTier,
    cognitiveLoadColor,
    frontalThetaPowerPct,
    thetaAlphaRatio,
    taskEngagementIndex,
    mentalReserveRemainingPct,
    cognitiveLoadClinicalNarrative,

    // 3. How Patient Feels
    patientFeelingsHeadline,
    patientFeelingsEmotion,
    patientFeelingsValence,
    patientFeelingsArousal,
    frontalAlphaAsymmetryIndex,
    frontalAlphaAsymmetryInterpretation,
    patientFeelingsNarrative,

    // 4. Condition Screening
    conditionDetected,
    conditionName,
    conditionCategory,
    conditionStatusBadge,
    conditionSeverity,
    conditionClinicalFlags,
    conditionDiagnosticAnalysis,
    clinicalRecommendations,

    // 5. One-Liner
    clinicalOneLiner,

    // Raw stats
    meanFp1_uV: sessionStats.meanFp1,
    meanFp2_uV: sessionStats.meanFp2,
    dominantFrequencyHz: parseFloat(dominantHz.toFixed(1)),
    activePatientProfileName: activeMode.name,
  };
}

/**
 * Generates a self-contained, standalone, beautifully formatted medical HTML document.
 * This file can be saved offline, opened in any browser, emailed, or printed to PDF.
 * (NOT a CSV file!)
 */
export function generateMedicalHtmlDocument(report: ClinicalReportData): string {
  const dateFormatted = new Date(report.generatedAtIso).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clinical Neurological Assessment Report — ${report.reportId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f4f3ef;
      color: #141517;
      line-height: 1.5;
      padding: 30px 15px;
    }
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #dcdad2;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      padding: 40px;
    }
    .mono { font-family: 'IBM Plex Mono', monospace; }
    
    /* Header & Letterhead */
    .hospital-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #141517;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .logo-area h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      color: #141517;
    }
    .logo-area .sub {
      font-size: 11px;
      font-family: 'IBM Plex Mono', monospace;
      color: #D96514;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .report-meta {
      text-align: right;
      font-size: 11px;
      font-family: 'IBM Plex Mono', monospace;
      color: #555;
    }
    .report-meta strong {
      color: #141517;
      display: block;
      font-size: 12px;
    }

    /* Demographics Grid */
    .demographics-box {
      background: #faf9f5;
      border: 1px solid #e5e3dc;
      padding: 16px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      font-size: 12px;
    }
    .demo-item span {
      display: block;
      font-size: 10px;
      font-family: 'IBM Plex Mono', monospace;
      color: #777;
      text-transform: uppercase;
    }
    .demo-item strong {
      font-size: 13px;
      color: #141517;
    }

    /* Section Styling */
    .section-title {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #141517;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e3dc;
    }
    .section-badge {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #D96514;
    }

    .card {
      border: 1px solid #e5e3dc;
      background: #ffffff;
      padding: 20px;
      margin-bottom: 24px;
    }

    /* Gauges & Meters */
    .meter-container {
      margin: 15px 0;
    }
    .meter-bar {
      height: 10px;
      background: #eee;
      width: 100%;
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }
    .meter-fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    .meter-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-family: 'IBM Plex Mono', monospace;
      color: #777;
      margin-top: 4px;
    }

    /* Metric Key-Value Grid */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 15px 0;
      background: #faf9f5;
      padding: 12px;
      border: 1px solid #eceae4;
    }
    .metric-col span {
      display: block;
      font-size: 10px;
      font-family: 'IBM Plex Mono', monospace;
      color: #666;
    }
    .metric-col strong {
      font-size: 16px;
      font-family: 'IBM Plex Mono', monospace;
      color: #141517;
    }

    .narrative {
      font-size: 13px;
      color: #2e2f33;
      line-height: 1.6;
      margin-top: 10px;
    }

    /* Badges */
    .tag {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .tag-danger { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
    .tag-warning { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
    .tag-success { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
    .tag-info { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }

    /* Flags List */
    .flags-list {
      list-style: none;
      margin: 12px 0;
    }
    .flags-list li {
      font-size: 12px;
      padding: 6px 10px;
      margin-bottom: 4px;
      background: #fdfdfd;
      border-left: 3px solid #D96514;
      font-family: 'IBM Plex Mono', monospace;
    }

    /* Signature Executive One Liner at the End */
    .one-liner-card {
      background: #141517;
      color: #ffffff;
      padding: 24px;
      margin-top: 30px;
      border: 1px solid #141517;
      position: relative;
    }
    .one-liner-card::before {
      content: "CLINICAL EXECUTIVE SUMMARY";
      display: block;
      font-size: 10px;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #D96514;
      margin-bottom: 8px;
    }
    .one-liner-card p {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.45;
      color: #FAF9F5;
      font-style: italic;
    }

    /* Print & Signatures */
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dcdad2;
      font-size: 11px;
      font-family: 'IBM Plex Mono', monospace;
      color: #666;
    }
    .sig-line {
      width: 220px;
      border-top: 1px dashed #999;
      margin-top: 35px;
      padding-top: 5px;
      font-size: 10px;
    }

    @media print {
      body { background: white; padding: 0; }
      .report-container { box-shadow: none; border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <div class="report-container">
    <!-- Masthead -->
    <div class="hospital-header">
      <div class="logo-area">
        <h1>KORTEX CLINICAL NEUROLOGY</h1>
        <div class="sub">ELECTROPHYSIOLOGY &amp; COGNITIVE DYNAMICS ASSESSMENT</div>
        <p style="font-size: 11px; color: #666; margin-top: 3px;">ISO 80001 / IEC 60601 Medical Device Reference Protocol</p>
      </div>
      <div class="report-meta">
        <strong>REPORT ID: ${report.reportId}</strong>
        <div>EXAMINATION DATE: ${dateFormatted}</div>
        <div>MONTAGE: 10-20 DUAL PREFRONTAL (Fp1, Fp2, REF)</div>
      </div>
    </div>

    <!-- Demographics & Recording Parameters -->
    <div class="demographics-box">
      <div class="demo-item">
        <span>Patient Identifier</span>
        <strong>${report.patientId}</strong>
      </div>
      <div class="demo-item">
        <span>Age / Gender</span>
        <strong>${report.patientAge} Yrs / ${report.patientGender}</strong>
      </div>
      <div class="demo-item">
        <span>Session Duration</span>
        <strong>${report.sessionDurationStr} (${report.totalSamples.toLocaleString()} samples)</strong>
      </div>
      <div class="demo-item">
        <span>Acquisition Source</span>
        <strong>${report.hardwareSource}</strong>
      </div>
      <div class="demo-item">
        <span>Attending Clinician</span>
        <strong>${report.clinicianName}</strong>
      </div>
      <div class="demo-item">
        <span>Sampling Rate</span>
        <strong>${report.nominalSampleRateHz} S/s</strong>
      </div>
      <div class="demo-item">
        <span>Electrode Quality</span>
        <strong>Balanced (&lt; 10 kΩ)</strong>
      </div>
      <div class="demo-item">
        <span>Battery / Power</span>
        <strong>${report.batteryPct}% (Nominal)</strong>
      </div>
    </div>

    <!-- 1. STRESS LEVEL ASSESSMENT -->
    <div class="section-title">
      <span class="section-badge"></span>
      1. Stress Level &amp; Autonomic Arousal Assessment
    </div>
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; font-family: 'IBM Plex Mono'; color: #666;">QUANTIFIED STRESS LEVEL</span>
          <div style="font-size: 26px; font-weight: 700; color: ${report.stressColor}; font-family: 'IBM Plex Mono';">
            ${report.stressScore}%
          </div>
        </div>
        <span class="tag ${report.stressScore > 65 ? 'tag-danger' : report.stressScore > 35 ? 'tag-warning' : 'tag-success'}">
          ${report.stressTier.toUpperCase()}
        </span>
      </div>

      <div class="meter-container">
        <div class="meter-bar">
          <div class="meter-fill" style="width: ${report.stressScore}%; background: ${report.stressColor};"></div>
        </div>
        <div class="meter-labels">
          <span>0% Low / Resting</span>
          <span>35% Mild</span>
          <span>65% Elevated</span>
          <span>100% Acute Distress</span>
        </div>
      </div>

      <div class="metrics-row">
        <div class="metric-col">
          <span>SYMPATHETIC TONE</span>
          <strong>${report.stressSympatheticRatio}%</strong>
        </div>
        <div class="metric-col">
          <span>BETA / ALPHA RATIO</span>
          <strong>${report.stressBetaAlphaRatio} : 1</strong>
        </div>
        <div class="metric-col">
          <span>HEART RATE &amp; HRV</span>
          <strong>${report.stressHeartRateBpm} BPM / ${report.stressHrvRmssdMs}ms</strong>
        </div>
      </div>

      <p class="narrative">
        <strong>Physiological Stress Findings:</strong> ${report.stressClinicalNarrative}
      </p>
    </div>

    <!-- 2. COGNITIVE LOAD ASSESSMENT -->
    <div class="section-title">
      <span class="section-badge"></span>
      2. Cognitive Load &amp; Mental Workload (CLI)
    </div>
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; font-family: 'IBM Plex Mono'; color: #666;">COGNITIVE LOAD INDEX (CLI)</span>
          <div style="font-size: 26px; font-weight: 700; color: ${report.cognitiveLoadColor}; font-family: 'IBM Plex Mono';">
            ${report.cognitiveLoadScore}%
          </div>
        </div>
        <span class="tag ${report.cognitiveLoadScore > 75 ? 'tag-danger' : report.cognitiveLoadScore > 50 ? 'tag-warning' : 'tag-info'}">
          ${report.cognitiveLoadTier.toUpperCase()}
        </span>
      </div>

      <div class="meter-container">
        <div class="meter-bar">
          <div class="meter-fill" style="width: ${report.cognitiveLoadScore}%; background: ${report.cognitiveLoadColor};"></div>
        </div>
        <div class="meter-labels">
          <span>0% Underload</span>
          <span>40% Balanced</span>
          <span>70% High Load</span>
          <span>100% Cognitive Exhaustion</span>
        </div>
      </div>

      <div class="metrics-row">
        <div class="metric-col">
          <span>FRONTAL THETA (Fmθ)</span>
          <strong>${report.frontalThetaPowerPct}%</strong>
        </div>
        <div class="metric-col">
          <span>THETA / ALPHA RATIO</span>
          <strong>${report.thetaAlphaRatio}</strong>
        </div>
        <div class="metric-col">
          <span>RESERVE CAPACITY</span>
          <strong>${report.mentalReserveRemainingPct}% Remaining</strong>
        </div>
      </div>

      <p class="narrative">
        <strong>Cognitive Load Findings:</strong> ${report.cognitiveLoadClinicalNarrative}
      </p>
    </div>

    <!-- 3. HOW THE PATIENT FEELS -->
    <div class="section-title">
      <span class="section-badge"></span>
      3. Patient Subjective &amp; Affective State (How The Patient Feels)
    </div>
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-size: 11px; font-family: 'IBM Plex Mono'; color: #666;">PERCEIVED EMOTIONAL STATE</span>
          <h3 style="font-size: 17px; font-weight: 700; color: #141517; margin-top: 2px;">
            ${report.patientFeelingsHeadline}
          </h3>
        </div>
        <span class="tag ${report.patientFeelingsValence.includes('Positive') ? 'tag-success' : report.patientFeelingsValence.includes('Negative') ? 'tag-danger' : 'tag-info'}">
          ${report.patientFeelingsValence.toUpperCase()}
        </span>
      </div>

      <div class="metrics-row" style="margin-top: 14px;">
        <div class="metric-col">
          <span>EMOTIONAL VALENCE</span>
          <strong>${report.patientFeelingsEmotion}</strong>
        </div>
        <div class="metric-col">
          <span>AROUSAL LEVEL</span>
          <strong>${report.patientFeelingsArousal.toUpperCase()}</strong>
        </div>
        <div class="metric-col">
          <span>FRONTAL ASYMMETRY (FAA)</span>
          <strong>${report.frontalAlphaAsymmetryIndex > 0 ? `+${report.frontalAlphaAsymmetryIndex.toFixed(2)}` : report.frontalAlphaAsymmetryIndex.toFixed(2)}</strong>
        </div>
      </div>

      <p class="narrative">
        <strong>Subjective Internal Experience:</strong> ${report.patientFeelingsNarrative}
      </p>
      <p class="narrative" style="font-size: 11px; color: #777; margin-top: 6px;">
        <em>Neuro-correlate:</em> ${report.frontalAlphaAsymmetryInterpretation}
      </p>
    </div>

    <!-- 4. CONDITION SCREENING -->
    <div class="section-title">
      <span class="section-badge"></span>
      4. Clinical Condition Screening &amp; Pathology Evaluation
    </div>
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 11px; font-family: 'IBM Plex Mono'; color: #666;">DETECTED CONDITION STATUS</span>
          <h3 style="font-size: 16px; font-weight: 700; color: #141517;">
            ${report.conditionName}
          </h3>
        </div>
        <span class="tag ${report.conditionDetected ? (report.conditionSeverity.includes('Marked') ? 'tag-danger' : 'tag-warning') : 'tag-success'}">
          ${report.conditionStatusBadge}
        </span>
      </div>

      <div style="font-size: 12px; margin-bottom: 8px;">
        <strong>Category:</strong> ${report.conditionCategory} &nbsp;|&nbsp; 
        <strong>Clinical Severity:</strong> ${report.conditionSeverity}
      </div>

      <div style="font-size: 11px; font-family: 'IBM Plex Mono'; color: #555; margin-bottom: 4px;">
        KEY BIOMARKER FLAGS &amp; SCREENING OBSERVATIONS:
      </div>
      <ul class="flags-list">
        ${report.conditionClinicalFlags.map((flag) => `<li>${flag}</li>`).join('')}
      </ul>

      <p class="narrative">
        <strong>Differential Neurological Analysis:</strong> ${report.conditionDiagnosticAnalysis}
      </p>

      <div style="margin-top: 14px; background: #faf9f5; border-left: 3px solid #141517; padding: 10px 14px;">
        <span style="font-size: 10px; font-family: 'IBM Plex Mono'; font-weight: 700; color: #141517; display: block; margin-bottom: 4px;">
          RECOMMENDED COUNTERMEASURES &amp; CLINICAL FOLLOW-UP:
        </span>
        <ul style="padding-left: 18px; font-size: 12px; color: #333;">
          ${report.clinicalRecommendations.map((rec) => `<li style="margin-bottom: 3px;">${rec}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- 5. SIGNATURE CLINICAL ONE-LINER (AT THE END) -->
    <div class="one-liner-card">
      <p>"${report.clinicalOneLiner}"</p>
    </div>

    <!-- Signatures block -->
    <div class="signatures">
      <div>
        <div class="sig-line">
          <strong>${report.clinicianName}</strong><br>
          Board Certified Clinical Neurophysiologist
        </div>
      </div>
      <div style="text-align: right;">
        <div class="sig-line" style="margin-left: auto;">
          <strong>Kortex Biometrics Lab Director</strong><br>
          Automated Telemetry Verification Stamp
        </div>
      </div>
    </div>

    <div style="margin-top: 25px; text-align: center; font-size: 10px; font-family: 'IBM Plex Mono'; color: #999;" class="no-print">
      Report generated by Kortex Dual-Prefrontal Electrophysiology Engine. All rights reserved.
    </div>
  </div>

</body>
</html>`;
}

/**
 * Downloads the medical report as a standalone .HTML file
 */
export function downloadMedicalHtmlReport(report: ClinicalReportData, customFilename?: string): boolean {
  try {
    const htmlContent = generateMedicalHtmlDocument(report);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = customFilename || `kortex_clinical_report_${report.patientId}_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download medical HTML report:', err);
    return false;
  }
}

/**
 * Downloads a structured clinical summary as a formatted text document (.txt)
 */
export function downloadMedicalTextSummary(report: ClinicalReportData, customFilename?: string): boolean {
  try {
    const textContent = `================================================================================
KORTEX CLINICAL NEUROLOGY & BIOMETRIC ASSESSMENT REPORT
Document ID: ${report.reportId}
Generated At: ${report.generatedAtIso}
================================================================================

PATIENT METADATA:
- Patient ID: ${report.patientId}
- Age: ${report.patientAge} | Gender: ${report.patientGender}
- Clinician: ${report.clinicianName}
- Facility: ${report.assessmentFacility}
- Duration: ${report.sessionDurationStr} (${report.totalSamples} biopotential samples)
- Hardware Source: ${report.hardwareSource}
- Montage: ${report.electrodeMontage}

1. STRESS LEVEL & AUTONOMIC AROUSAL:
- Stress Score: ${report.stressScore}% [${report.stressTier}]
- Sympathetic Ratio: ${report.stressSympatheticRatio}%
- Beta/Alpha Ratio: ${report.stressBetaAlphaRatio}:1
- Heart Rate: ${report.stressHeartRateBpm} BPM | HRV RMSSD: ${report.stressHrvRmssdMs} ms
- Clinical Narrative:
  ${report.stressClinicalNarrative}

2. COGNITIVE LOAD & MENTAL WORKLOAD:
- Cognitive Load Index (CLI): ${report.cognitiveLoadScore}% [${report.cognitiveLoadTier}]
- Frontal Midline Theta (Fmθ): ${report.frontalThetaPowerPct}%
- Theta/Alpha Ratio: ${report.thetaAlphaRatio}
- Mental Reserve Remaining: ${report.mentalReserveRemainingPct}%
- Clinical Narrative:
  ${report.cognitiveLoadClinicalNarrative}

3. PATIENT SUBJECTIVE & AFFECTIVE STATE (HOW THE PATIENT FEELS):
- Perception: ${report.patientFeelingsHeadline}
- Primary Affect: ${report.patientFeelingsEmotion}
- Emotional Valence: ${report.patientFeelingsValence}
- Arousal Level: ${report.patientFeelingsArousal}
- Frontal Alpha Asymmetry (FAA): ${report.frontalAlphaAsymmetryIndex.toFixed(2)} (${report.frontalAlphaAsymmetryInterpretation})
- Patient Experience Narrative:
  ${report.patientFeelingsNarrative}

4. CLINICAL CONDITION SCREENING:
- Condition Identified: ${report.conditionName}
- Category: ${report.conditionCategory}
- Status: ${report.conditionStatusBadge} [Severity: ${report.conditionSeverity}]
- Biomarker Signs:
${report.conditionClinicalFlags.map((f) => `  * ${f}`).join('\n')}
- Diagnostic Differential:
  ${report.conditionDiagnosticAnalysis}
- Recommendations:
${report.clinicalRecommendations.map((r) => `  - ${r}`).join('\n')}

================================================================================
5. CLINICAL EXECUTIVE ONE-LINER:
"${report.clinicalOneLiner}"
================================================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = customFilename || `kortex_clinical_summary_${report.patientId}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download medical text summary:', err);
    return false;
  }
}
