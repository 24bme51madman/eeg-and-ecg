import { FC } from 'react';
import { Mail, Github, Twitter, FileText, Download, ShieldCheck } from 'lucide-react';

export const Footer: FC = () => {
  return (
    <footer className="w-full border-t border-neutral-300 bg-[#EFECE5] py-12 text-xs font-mono text-neutral-700">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top footer row: brand & brief synopsis */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 border-b border-neutral-300 pb-10">
          <div className="md:col-span-5">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-[#141517]">
                Kortex<span className="text-[#D96514]">-Kare</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-sans max-w-md">
              Precision 8-channel wearable electroencephalography (EEG) transducer. 
              Engineered with dry Ag/AgCl active electrodes and on-device machine learning for real-time cognitive workload, emotional valence, and neurological stress detection.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-neutral-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>LAB VALIDATION BENCH: KEYSIGHT 33600A + 10kΩ SCALP PHANTOM</span>
            </div>
          </div>

          {/* Quick links & resources */}
          <div className="md:col-span-2">
            <div className="font-bold text-[#141517] uppercase tracking-wider text-[11px]">
              ARCHITECTURE
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a href="#waveform-recorder-panel" className="hover:text-[#D96514] transition-colors">
                  Live Waveform Trace
                </a>
              </li>
              <li>
                <a href="#why-it-matters" className="hover:text-[#D96514] transition-colors">
                  Cortical vs. Peripheral
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#D96514] transition-colors">
                  Signal Pipeline
                </a>
              </li>
              <li>
                <a href="#brainwave-bands" className="hover:text-[#D96514] transition-colors">
                  Spectral Bands (δ/θ/α/β/γ)
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="font-bold text-[#141517] uppercase tracking-wider text-[11px]">
              HARDWARE & CAD
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a href="#cad-hardware-section" className="hover:text-[#D96514] transition-colors">
                  Mechanical Solid Models
                </a>
              </li>
              <li>
                <a href="#technical-specifications" className="hover:text-[#D96514] transition-colors">
                  24-Bit ADC Bench Specs
                </a>
              </li>
              <li>
                <a href="#cad-hardware-section" className="hover:text-[#D96514] transition-colors">
                  STEP / STL / DXF Files
                </a>
              </li>
              <li>
                <a href="#waitlist" className="hover:text-[#D96514] transition-colors">
                  Batch 01 Developer Kits
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="font-bold text-[#141517] uppercase tracking-wider text-[11px]">
              DIRECT CONTACT & INQUIRIES
            </div>
            <p className="mt-3 text-xs text-neutral-600 font-sans">
              For research partnerships, IRB documentation, or high-volume enterprise pilots:
            </p>
            <div className="mt-2 text-xs text-[#141517] font-semibold">
              <a href="mailto:engineering@kortex-neuro.io" className="hover:text-[#D96514] underline">
                engineering@kortex-neuro.io
              </a>
            </div>
            <div className="mt-4 flex items-center gap-3 text-neutral-700">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="border border-neutral-300 bg-white p-1.5 hover:border-[#141517] transition-colors"
                aria-label="GitHub Repository"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="border border-neutral-300 bg-white p-1.5 hover:border-[#141517] transition-colors"
                aria-label="X / Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#waitlist"
                className="border border-neutral-300 bg-white p-1.5 hover:border-[#141517] transition-colors"
                aria-label="Email Communications"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright, compliance notes and registration marks */}
        <div className="mt-8 flex flex-col justify-between gap-3 text-[11px] text-neutral-500 sm:flex-row sm:items-center">
          <div>
            © 2026 KORTEX NEUROTECHNOLOGY CORP. ALL SPECIFICATIONS SUBJECT TO CERTIFICATION.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>DOC VER: 3.2.4</span>
            <span>NON-INVASIVE INVESTIGATIONAL DEVICE</span>
            <span>NOT FOR PRIMARY CLINICAL DIAGNOSIS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
