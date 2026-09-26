import { FC } from 'react';
import { TECH_SPECS } from '../data/specsData';
import { Download, FileCode, CheckCircle2 } from 'lucide-react';

export const TechSpecs: FC = () => {
  return (
    <section id="technical-specifications" className="w-full border-b border-neutral-300 bg-[#FAF9F5] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-2 border-b border-neutral-300 pb-4 md:flex-row md:items-baseline">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 bg-[#D96514]" />
              <span>Section 06 · System Hardware Specifications</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#141517] sm:text-3xl">
              Laboratory Instrument Specifications
            </h2>
          </div>
          <div className="font-mono text-xs text-neutral-500">
            Compliance: CE · FCC Part 15B · ISO 13485 Standards
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-neutral-700">
          All values verified via calibrated signal generator bench testing (Keysight 33600A) into 10 kΩ resistive-capacitive scalp phantom loads. 
          No software interpolations or uncalibrated microvolt scaling.
        </p>

        {/* 4 Category Spec Tables with Lab Ruled Dividers */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {TECH_SPECS.map((category) => (
            <div key={category.title} className="border border-neutral-300 bg-white p-5">
              <div className="flex items-center justify-between border-b border-neutral-300 pb-2.5">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#141517]">
                  {category.title}
                </h3>
                <span className="font-mono text-[10px] text-[#D96514]">VERIFIED BENCH SPEC</span>
              </div>

              <div className="mt-3 divide-y divide-neutral-200">
                {category.specs.map((item, idx) => (
                  <div key={idx} className="flex flex-col py-2 sm:flex-row sm:items-baseline sm:justify-between text-xs">
                    <span className="font-mono text-neutral-600 sm:w-1/2">
                      {item.label}
                    </span>
                    <span className="font-mono font-semibold text-[#141517] sm:w-1/2 sm:text-right mt-0.5 sm:mt-0">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Engineering Compliance & Architecture Notice Bar */}
        <div className="mt-8 border border-neutral-300 bg-[#EFECE5] p-4 text-xs font-mono text-neutral-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-emerald-600 rounded-full" />
            <span>Open Research APIs: Lab Streaming Layer (LSL) · Python MNE · MATLAB EEGLAB</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#waveform-recorder-panel"
              className="text-[#D96514] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Developer SDK & Hardware Schematics</span>
              <span>›</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
