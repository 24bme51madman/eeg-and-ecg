import { FC, useState } from 'react';
import { PIPELINE_STEPS } from '../data/specsData';
import { Check, ArrowRight, Layers, Cpu, Radio, Sparkles } from 'lucide-react';

export const PipelineSequence: FC = () => {
  const [selectedStep, setSelectedStep] = useState<number>(0);

  return (
    <section id="how-it-works" className="w-full border-b border-neutral-300 bg-[#F6F5F0] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-2 border-b border-neutral-300 pb-4 md:flex-row md:items-baseline">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 bg-[#D96514]" />
              <span>Section 03 · Pipeline Architecture</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#141517] sm:text-3xl">
              End-to-End Signal Pipeline
            </h2>
          </div>
          <div className="font-mono text-xs text-neutral-500">
            Sequence: Transduction → Acquisition → Inference → Telemetry
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-neutral-700">
          The processing pipeline operates in strict sequence. Each stage performs deterministic signal conditioning before handing off to the next subsystem, maintaining microsecond timing alignment across all 3 cortical leads (Fp1, Fp2, REF/GND).
        </p>

        {/* 4-Step Linear Pipeline Layout with Ruled Borders */}
        <div className="mt-8 grid grid-cols-1 divide-y border border-neutral-300 divide-neutral-300 bg-white sm:grid-cols-2 lg:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {PIPELINE_STEPS.map((step, index) => {
            const isSelected = selectedStep === index;
            return (
              <div
                key={step.step}
                onClick={() => setSelectedStep(index)}
                className={`p-5 transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#FAF9F5] ring-2 ring-inset ring-[#D96514]' : 'hover:bg-[#FCFBF8]'
                }`}
              >
                {/* Step header number & status */}
                <div className="flex items-center justify-between font-mono text-xs">
                  <span
                    className={`font-bold ${
                      isSelected ? 'text-[#D96514]' : 'text-[#141517]'
                    }`}
                  >
                    STEP {step.step}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {index === 0 ? 'PHYSICAL' : index === 1 ? 'ANALOG' : index === 2 ? 'NEURAL' : 'DIGITAL'}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-[#141517]">
                  {step.title}
                </h3>
                <p className="font-mono text-[11px] text-neutral-500">
                  {step.subtitle}
                </p>

                <p className="mt-3 text-xs leading-relaxed text-neutral-700">
                  {step.description}
                </p>

                {/* Technical highlights list */}
                <div className="mt-4 border-t border-neutral-200 pt-3 space-y-1.5 font-mono text-[10px] text-neutral-600">
                  {step.technicalDetails.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#D96514] font-bold">›</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Signal Flow Detail Inspector */}
        <div className="mt-6 border border-neutral-300 bg-[#FAF9F5] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2 font-mono text-xs">
            <span className="font-semibold text-[#141517]">
              STAGE {PIPELINE_STEPS[selectedStep].step} SUB-SYSTEM ARCHITECTURE SPECIFICATION
            </span>
            <span className="text-[#D96514]">CLICK STEPS ABOVE TO SWITCH STAGE</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
            <div className="border border-neutral-200 bg-white p-3">
              <span className="font-mono text-[10px] text-neutral-500 block">HARDWARE COUPLING</span>
              <strong className="mt-1 block text-sm text-[#141517]">
                {selectedStep === 0 && 'Dry Polymer Finger Geometry'}
                {selectedStep === 1 && 'ADS1299-Class 24-Bit ADC'}
                {selectedStep === 2 && 'Dual-Core Cortex-M33 + NPU'}
                {selectedStep === 3 && 'BLE 5.3 + Lab Streaming Layer'}
              </strong>
              <p className="mt-1 text-neutral-600">
                {selectedStep === 0 && 'Conductive elastomer fingers self-penetrate hair canopy to seat directly on scalp epidermis.'}
                {selectedStep === 1 && 'Simultaneous sampling on bilateral prefrontal leads (Fp1, Fp2) against active ear reference eliminates phase skew.'}
                {selectedStep === 2 && 'On-chip quantization (INT8) minimizes power draw to under 18 mA during active inference.'}
                {selectedStep === 3 && 'LSL packets are timestamped with microsecond synchronization against stimulus monitors.'}
              </p>
            </div>

            <div className="border border-neutral-200 bg-white p-3">
              <span className="font-mono text-[10px] text-neutral-500 block">NOISE & INTERFERENCE CONTROL</span>
              <strong className="mt-1 block text-sm text-[#141517]">
                {selectedStep === 0 && 'Earclip CMS/DRL Common Mode'}
                {selectedStep === 1 && '112 dB CMRR Rejection'}
                {selectedStep === 2 && 'Real-Time EOG / EMG Filter'}
                {selectedStep === 3 && 'Zero-Loss Local Buffer'}
              </strong>
              <p className="mt-1 text-neutral-600">
                {selectedStep === 0 && 'Active ear feedback loop continuously inverts and cancels stray body ambient potentials.'}
                {selectedStep === 1 && 'Internal notch filters eradicate 50 Hz / 60 Hz fluorescent lighting contamination.'}
                {selectedStep === 2 && 'Blinks and jaw clenches are parsed and subtracted before computing cognitive load indices.'}
                {selectedStep === 3 && '8GB local flash records non-volatile backup if Bluetooth telemetry is briefly dropped.'}
              </p>
            </div>

            <div className="border border-neutral-200 bg-white p-3">
              <span className="font-mono text-[10px] text-neutral-500 block">DOWNSTREAM OUTPUT</span>
              <strong className="mt-1 block text-sm text-[#141517]">
                {selectedStep === 0 && '< 15 kΩ Verified Impedance'}
                {selectedStep === 1 && '500 Hz Calibrated µV Stream'}
                {selectedStep === 2 && 'Cognitive Load, Valence, Stress'}
                {selectedStep === 3 && 'EDF+, BIDS CSV, LSL Broadcast'}
              </strong>
              <p className="mt-1 text-neutral-600">
                {selectedStep === 0 && 'Visual LED and software indicators confirm optimal contact before recording starts.'}
                {selectedStep === 1 && 'Uncompressed 24-bit floating point microvolt stream preserved for raw analysis.'}
                {selectedStep === 2 && 'Outputs updated every 100 ms with validated cognitive index scores (0–100 scale).'}
                {selectedStep === 3 && 'Directly loadable into Python MNE, MATLAB EEGLAB, PsychoPy, or our mobile dashboard.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
