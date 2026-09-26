import { FC } from 'react';
import { AlertCircle, Clock, Zap, ShieldCheck } from 'lucide-react';

export const WhyItMatters: FC = () => {
  return (
    <section id="why-it-matters" className="w-full border-b border-neutral-300 bg-[#FAF9F5] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section title & header line */}
        <div className="flex flex-col justify-between gap-2 border-b border-neutral-300 pb-4 md:flex-row md:items-baseline">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 bg-[#D96514]" />
              <span>Section 02 · Physiological Rationale</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#141517] sm:text-3xl">
              Why Cortical Monitoring Matters
            </h2>
          </div>
          <div className="font-mono text-xs text-neutral-500">
            Metric Comparison: Central vs. Peripheral Biomarkers
          </div>
        </div>

        {/* Short, concrete case without filler */}
        <div className="mt-6 max-w-3xl">
          <p className="text-sm sm:text-base leading-relaxed text-neutral-800">
            Wearable fitness trackers infer mental state from peripheral autonomic signals—such as optical heart rate variability (HRV) or skin temperature. 
            These peripheral metrics lag mental transitions by 90 to 180 seconds and conflate physical exertion, ambient heat, and digestion with actual psychological workload.
          </p>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-neutral-800">
            Electroencephalography measures the direct postsynaptic potentials of synchronized pyramidal cortical neurons at the millisecond scale. 
            This allows instantaneous detection of mental strain, attentional lapses, and affective shifts before physiological fatigue manifests in the body.
          </p>
        </div>

        {/* 3 Concrete Pillar Rows with Ruled Lab Dividers */}
        <div className="mt-8 grid grid-cols-1 divide-y border-y border-neutral-300 divide-neutral-300 lg:grid-cols-3 lg:divide-y-0 lg:divide-x">
          {/* Pillar 1 */}
          <div className="p-6">
            <div className="flex items-center gap-2 font-mono text-xs text-[#D96514]">
              <span className="font-bold">01</span>
              <span>· Attentional Saturation</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#141517]">
              Preempting Executive Overload
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              When working memory saturates, frontal midline theta (Fmθ, 4–8 Hz) power spikes while parieto-occipital alpha suppresses. 
              Kortex-Kare computes this Cognitive Load Index in rolling 2-second windows, identifying cognitive saturation before quality of work deteriorates.
            </p>
            <div className="mt-4 border-t border-neutral-200 pt-3 font-mono text-[11px] text-neutral-600">
              PHYSIOLOGY: Medial prefrontal cortex (mPFC) &amp; anterior cingulate activation.
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6">
            <div className="flex items-center gap-2 font-mono text-xs text-[#D96514]">
              <span className="font-bold">02</span>
              <span>· Emotional Valence</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#141517]">
              Frontal Alpha Asymmetry (FAA)
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              Relative alpha power between left (Fp1) and right (Fp2) frontal electrodes maps directly to motivational approach vs. withdrawal states. 
              Left frontal dominance indicates positive engagement; right frontal dominance correlates with acute avoidance, stress, and anxiety.
            </p>
            <div className="mt-4 border-t border-neutral-200 pt-3 font-mono text-[11px] text-neutral-600">
              VALIDATION: Davidson electrophysiological asymmetry protocol (Fp1/Fp2 differential).
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6">
            <div className="flex items-center gap-2 font-mono text-xs text-[#D96514]">
              <span className="font-bold">03</span>
              <span>· Neurological Stress</span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#141517]">
              High-Beta Somatic Agitation
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-700">
              During acute sympathetic distress, cortical rhythms shift toward disorganized high-beta frequencies (22–30 Hz) accompanied by transient micro-clenches. 
              The on-device model filters muscular artifacts to quantify true neurogenic stress without false alarms from facial movement.
            </p>
            <div className="mt-4 border-t border-neutral-200 pt-3 font-mono text-[11px] text-neutral-600">
              ARTIFACT MITIGATION: Local real-time blind source separation (BSS).
            </div>
          </div>
        </div>

        {/* Technical benchmark table: EEG vs Peripheral Trackers */}
        <div className="mt-8 overflow-x-auto border border-neutral-300 bg-white">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-neutral-300 bg-[#EFECE5] text-[#141517]">
              <tr>
                <th className="p-3 font-semibold">PHYSIOLOGICAL PARAMETER</th>
                <th className="p-3 font-semibold text-[#D96514]">Kortex-Kare (EEG)</th>
                <th className="p-3 font-semibold text-neutral-600">OPTICAL WRIST PPG (HRV)</th>
                <th className="p-3 font-semibold text-neutral-600">GALVANIC SKIN RESPONSE (GSR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-800">
              <tr>
                <td className="p-3 font-medium text-[#141517]">Measurement Source</td>
                <td className="p-3 text-[#141517] font-semibold">Direct Cortical Potentials (Fp1, Fp2)</td>
                <td className="p-3 text-neutral-600">Microvascular Blood Volume</td>
                <td className="p-3 text-neutral-600">Eccrine Sweat Gland Conductance</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#141517]">Signal Latency</td>
                <td className="p-3 text-[#D96514] font-semibold">&lt; 100 milliseconds</td>
                <td className="p-3 text-neutral-600">90 – 180 seconds delay</td>
                <td className="p-3 text-neutral-600">2 – 5 seconds delay</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#141517]">Working Memory Load</td>
                <td className="p-3 text-[#141517] font-semibold">Direct (Theta/Alpha ratio)</td>
                <td className="p-3 text-neutral-600">Inferred / Unreliable</td>
                <td className="p-3 text-neutral-600">No correlation</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#141517]">Emotional Valence (±)</td>
                <td className="p-3 text-[#141517] font-semibold">Classifiable via FAA (Fp1 vs Fp2)</td>
                <td className="p-3 text-neutral-600">None (Arousal only)</td>
                <td className="p-3 text-neutral-600">None (Arousal only)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#141517]">Motion Artifact Handling</td>
                <td className="p-3 text-[#141517] font-semibold">Earclip CMS/DRL Active Rejection</td>
                <td className="p-3 text-neutral-600">Heavy arm movement distortion</td>
                <td className="p-3 text-neutral-600">Pressure sensitive</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
