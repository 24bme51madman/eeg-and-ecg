import { FC, useState, FormEvent } from 'react';
import { Check, ShieldCheck, Mail, ArrowRight, UserCheck, RefreshCw } from 'lucide-react';
import { WaitlistSubmission } from '../types';

export const WaitlistSection: FC = () => {
  const [formData, setFormData] = useState<WaitlistSubmission>({
    email: '',
    role: 'researcher',
    organization: '',
    hardwareKit: true,
    lslStreamAccess: true,
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [queuePosition, setQueuePosition] = useState(318);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.email.includes('@')) {
      return;
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const assignedTicket = `K8-WL-${randomId}`;
    setTicketNumber(assignedTicket);
    setQueuePosition((prev) => prev + 1);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      email: '',
      role: 'researcher',
      organization: '',
      hardwareKit: true,
      lslStreamAccess: true,
      notes: ''
    });
  };

  return (
    <section id="waitlist" className="w-full border-b border-neutral-300 bg-[#F6F5F0] py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="border-b border-neutral-300 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase">
            <span className="h-1.5 w-1.5 bg-[#D96514]" />
            <span>Section 08 · Production Allocation</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#141517] sm:text-3xl">
            Join the Hardware Early-Access Waitlist
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Batch 01 production units (500 serial-numbered devices) are allocated to academic research labs, clinical pilots, and qualified independent developers.
          </p>
        </div>

        {submitted ? (
          /* Confirmation Ticket State */
          <div className="mt-8 border border-neutral-300 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="font-mono text-xs font-semibold text-[#141517]">
                  ALLOCATION RECORD ISSUED
                </span>
              </div>
              <span className="font-mono text-xs text-[#D96514] font-bold">
                {ticketNumber}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="border-l-2 border-[#D96514] pl-4">
                <h3 className="text-xl font-bold text-[#141517]">
                  Reservation Confirmed for {formData.email}
                </h3>
                <p className="mt-1 text-sm text-neutral-700">
                  Your entry has been recorded in the hardware fulfillment queue. 
                  Bench qualification reports and developer SDK onboarding instructions will be dispatched to your email address.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-b border-neutral-200 py-4 font-mono text-xs sm:grid-cols-4">
                <div>
                  <span className="text-neutral-500 block text-[10px]">TICKET ID</span>
                  <strong className="text-[#141517]">{ticketNumber}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">QUEUE POSITION</span>
                  <strong className="text-[#141517]">#{queuePosition}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">COHORT TIER</span>
                  <strong className="text-[#D96514] uppercase">{formData.role}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">BATCH TARGET</span>
                  <strong className="text-[#141517]">Q3 2026 BENCH</strong>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="font-mono text-xs text-neutral-500">
                  No payment is processed at this stage. Verification requires organizational or developer credentials upon fulfillment.
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 border border-neutral-300 bg-[#FAF9F5] px-3 py-1.5 font-mono text-xs text-neutral-700 hover:bg-neutral-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Register Another Unit
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Entry */
          <form
            onSubmit={handleSubmit}
            className="mt-8 border border-neutral-300 bg-white p-6 sm:p-8"
          >
            <div className="space-y-6">
              {/* Primary Email */}
              <div>
                <label
                  htmlFor="waitlist-email"
                  className="block font-mono text-xs font-semibold text-[#141517]"
                >
                  EMAIL ADDRESS <span className="text-[#D96514]">*</span>
                </label>
                <div className="mt-1.5">
                  <input
                    id="waitlist-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="researcher@institution.edu or name@domain.com"
                    className="w-full border border-neutral-300 bg-[#FAF9F5] px-3.5 py-2.5 font-mono text-xs text-[#141517] placeholder:text-neutral-400 focus:border-[#141517] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#141517]"
                  />
                </div>
                <p className="mt-1 font-mono text-[10px] text-neutral-500">
                  We communicate exclusively regarding hardware release milestones, firmware changelogs, and shipping dates.
                </p>
              </div>

              {/* Primary Cohort / Role Selection */}
              <div>
                <label className="block font-mono text-xs font-semibold text-[#141517]">
                  PRIMARY INTENDED USE / SECTOR <span className="text-[#D96514]">*</span>
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { id: 'researcher', label: 'Neuroscience / Academic Researcher' },
                    { id: 'biohacker', label: 'Biohacker / Quantified Self' },
                    { id: 'wellness', label: 'Mental Wellness / Deep Work' },
                    { id: 'enterprise', label: 'Enterprise / Clinical Ergonomics' }
                  ].map((roleOption) => (
                    <label
                      key={roleOption.id}
                      className={`flex items-center gap-2.5 border p-3 cursor-pointer text-xs transition-colors ${
                        formData.role === roleOption.id
                          ? 'border-[#141517] bg-[#FAF9F5] font-semibold text-[#141517]'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cohort-role"
                        value={roleOption.id}
                        checked={formData.role === roleOption.id}
                        onChange={() => setFormData({ ...formData, role: roleOption.id })}
                        className="accent-[#141517]"
                      />
                      <span>{roleOption.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional Organization / Institution */}
              <div>
                <label
                  htmlFor="waitlist-org"
                  className="block font-mono text-xs font-semibold text-[#141517]"
                >
                  INSTITUTION / COMPANY (OPTIONAL)
                </label>
                <div className="mt-1.5">
                  <input
                    id="waitlist-org"
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Cognitive Neuro Lab / Independent R&D"
                    className="w-full border border-neutral-300 bg-[#FAF9F5] px-3.5 py-2.5 font-mono text-xs text-[#141517] placeholder:text-neutral-400 focus:border-[#141517] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#141517]"
                  />
                </div>
              </div>

              {/* Hardware package flags */}
              <div className="space-y-2 border-t border-neutral-200 pt-4">
                <div className="font-mono text-xs font-semibold text-[#141517] mb-1">
                  REQUESTED ASSETS & CLEARANCES
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-700">
                  <input
                    type="checkbox"
                    checked={formData.hardwareKit}
                    onChange={(e) => setFormData({ ...formData, hardwareKit: e.target.checked })}
                    className="mt-0.5 accent-[#141517]"
                  />
                  <span>
                    <strong>Batch 01 Physical Wearable Headband:</strong> 8-channel dry Ag/AgCl hardware assembly with magnetic docking cradle.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-700">
                  <input
                    type="checkbox"
                    checked={formData.lslStreamAccess}
                    onChange={(e) => setFormData({ ...formData, lslStreamAccess: e.target.checked })}
                    className="mt-0.5 accent-[#141517]"
                  />
                  <span>
                    <strong>Research Developer Access:</strong> Lab Streaming Layer (LSL) broadcast daemon, Python MNE sample scripts, and native STEP mechanical CAD geometry archive.
                  </span>
                </label>
              </div>

              {/* Submit button - Plain, active voice */}
              <div className="pt-2">
                <button
                  id="submit-waitlist-btn"
                  type="submit"
                  className="w-full border border-[#141517] bg-[#141517] px-6 py-3 font-mono text-xs font-semibold text-white transition-colors hover:bg-[#D96514] hover:border-[#D96514] focus:outline-none focus:ring-2 focus:ring-[#D96514]"
                >
                  Join the waitlist
                </button>
                <div className="mt-2 text-center font-mono text-[10px] text-neutral-500">
                  500 Allocations Total · Immediate Confirmation Receipt Upon Entry
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
