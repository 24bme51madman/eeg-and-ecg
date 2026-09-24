import { FC } from 'react';
import { USE_CASES } from '../data/specsData';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const UseCases: FC = () => {
  return (
    <section id="use-cases" className="w-full border-b border-neutral-300 bg-[#FAF9F5] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-2 border-b border-neutral-300 pb-4 md:flex-row md:items-baseline">
          <div>
            <div className="font-mono text-xs text-neutral-500 uppercase">
              SEC 07 // DEPLOYMENT MODES
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#141517] sm:text-3xl">
              Target Applications & Cohorts
            </h2>
          </div>
          <div className="font-mono text-xs text-neutral-500">
            VALIDATED FOR LAB, INDIVIDUAL & ENTERPRISE WORKFLOWS
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-neutral-700">
          From controlled cognitive psychology trials to all-day personal attentional tracking, 
          SYNAPSE-8 bridges laboratory-grade biosensing with an unencumbered wearable form factor.
        </p>

        {/* 3 Use Case Ruled Panels */}
        <div className="mt-8 grid grid-cols-1 divide-y border border-neutral-300 divide-neutral-300 bg-white lg:grid-cols-3 lg:divide-y-0 lg:divide-x">
          {USE_CASES.map((uc) => (
            <div key={uc.tag} className="flex flex-col justify-between p-6">
              <div>
                <div className="font-mono text-xs font-bold text-[#D96514]">
                  {uc.tag}
                </div>
                <h3 className="mt-2 text-lg font-bold text-[#141517]">
                  {uc.title}
                </h3>
                <div className="mt-1 font-mono text-[11px] text-neutral-500">
                  COHORT: {uc.audience}
                </div>

                <div className="mt-4 space-y-3 text-xs leading-relaxed text-neutral-700">
                  <div>
                    <strong className="font-mono text-[#141517] block text-[11px] uppercase">
                      The Operational Challenge:
                    </strong>
                    <p className="mt-1">{uc.challenge}</p>
                  </div>

                  <div>
                    <strong className="font-mono text-[#141517] block text-[11px] uppercase">
                      Synthesized Solution:
                    </strong>
                    <p className="mt-1">{uc.solution}</p>
                  </div>
                </div>
              </div>

              {/* Benchmarks & metrics tags */}
              <div className="mt-6 border-t border-neutral-200 pt-4">
                <div className="font-mono text-[10px] text-neutral-500 mb-2">VERIFIED OUTCOMES</div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {uc.metrics.map((metric, idx) => (
                    <span
                      key={idx}
                      className="border border-neutral-300 bg-[#FAF9F5] px-2 py-0.5 text-neutral-800"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
