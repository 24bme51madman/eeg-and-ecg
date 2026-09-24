import { useState, FC } from 'react';
import { Layers, Box, Cpu, Compass, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SensorHotspot {
  id: string;
  label: string;
  sublabel: string;
  chName: string;
  specs: string;
  coord: { x: number; y: number };
}

const SENSOR_HOTSPOTS: SensorHotspot[] = [
  {
    id: 'fp1',
    label: 'Electrode 1: Frontal Pole Left (Fp1)',
    sublabel: 'Fp1 Active Dry Lead',
    chName: 'E1 // FP1 ACTIVE LEAD',
    specs: 'Ag/AgCl dry elastomer • <8 kΩ contact impedance • Left prefrontal executive monitoring & theta tracking',
    coord: { x: 38, y: 32 }
  },
  {
    id: 'fp2',
    label: 'Electrode 2: Frontal Pole Right (Fp2)',
    sublabel: 'Fp2 Active Dry Lead',
    chName: 'E2 // FP2 ACTIVE LEAD',
    specs: 'Ag/AgCl dry elastomer • Bilateral FAA pairing with Fp1 for emotional valence and stress asymmetry',
    coord: { x: 62, y: 32 }
  },
  {
    id: 'ear',
    label: 'Electrode 3: Earclip / Mastoid Reference (REF/GND)',
    sublabel: 'Active Common Mode Sense',
    chName: 'E3 // REF-GND COMMON MODE',
    specs: 'Active driven reference eliminates 50/60 Hz ambient electromagnetic interference (112 dB CMRR)',
    coord: { x: 88, y: 78 }
  },
  {
    id: 'mcu',
    label: 'Telemetry Pod & Global Host Bridge',
    sublabel: '24-bit ADC + Worldwide Cloud Telemetry',
    chName: 'MCU // GLOBAL HOST LINK',
    specs: 'Dual-core ARM Cortex-M33 with WiFi/BLE + 24-bit ADC streaming biopotentials directly to the Global Host Ingestion API (/api/telemetry)',
    coord: { x: 50, y: 15 }
  }
];


export const CadHardwareSection: FC = () => {
  const [activeHotspot, setActiveHotspot] = useState<SensorHotspot>(SENSOR_HOTSPOTS[0]);
  const [cadView, setCadView] = useState<'isometric' | 'orthographic' | 'exploded'>('isometric');

  return (
    <section id="cad-hardware-section" className="w-full border-b border-neutral-300 bg-[#F6F5F0] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <div className="flex flex-col justify-between gap-2 border-b border-neutral-300 pb-4 md:flex-row md:items-baseline">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 bg-[#D96514]" />
              <span>SEC 05 // HARDWARE ENGINEERING & CAD SPEC</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#141517] sm:text-3xl">
              Ergonomic Beta-Titanium Architecture
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="border border-neutral-300 bg-white px-2.5 py-1 text-neutral-800">
              MASS: <strong className="text-[#141517]">36.5 g</strong>
            </span>
            <span className="border border-neutral-300 bg-white px-2.5 py-1 text-neutral-800">
              PROFILE: <strong className="text-[#141517]">1.8 mm</strong>
            </span>
            <span className="border border-neutral-300 bg-white px-2.5 py-1 text-neutral-800">
              FILES: <strong className="text-[#D96514]">STEP / STL / DXF</strong>
            </span>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-neutral-700">
          Engineered in parametric CAD (STEP, STL, DXF) to solve the fundamental failure point of consumer neurotech: 
          consistent low-impedance scalp coupling without painful focal pressure or conductive goop.
        </p>

        {/* CAD Schematic Viewer and Specs Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Visual CAD blueprint container */}
          <div className="relative border border-neutral-300 bg-[#F4F2EC] p-4 lg:col-span-7">
            {/* Blueprint corner registration marks */}
            <div className="absolute top-2 left-2 font-mono text-[9px] text-neutral-400">+ REG: L-01</div>
            <div className="absolute top-2 right-2 font-mono text-[9px] text-neutral-400">DWG: TRINITY-3-REV2</div>
            <div className="absolute bottom-2 left-2 font-mono text-[9px] text-neutral-400">SCALE 1:1.2</div>
            <div className="absolute bottom-2 right-2 font-mono text-[9px] text-neutral-400">ISO 13485 COMPLIANT</div>

            {/* View selector tabs */}
            <div className="flex items-center justify-between border-b border-neutral-300 pb-2">
              <span className="font-mono text-xs font-semibold text-[#141517]">
                FIGURE 1.0 — 3-ELECTRODE MECHANICAL BLUEPRINT
              </span>
              <div className="flex gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setCadView('isometric')}
                  className={`px-2 py-0.5 border ${
                    cadView === 'isometric'
                      ? 'border-[#141517] bg-[#141517] text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  ISOMETRIC
                </button>
                <button
                  type="button"
                  onClick={() => setCadView('orthographic')}
                  className={`px-2 py-0.5 border ${
                    cadView === 'orthographic'
                      ? 'border-[#141517] bg-[#141517] text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  ORTHO (TOP)
                </button>
                <button
                  type="button"
                  onClick={() => setCadView('exploded')}
                  className={`px-2 py-0.5 border ${
                    cadView === 'exploded'
                      ? 'border-[#141517] bg-[#141517] text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  PINOUT
                </button>
              </div>
            </div>

            {/* SVG Engineering Drawing */}
            <div className="relative my-4 flex h-[320px] w-full items-center justify-center overflow-hidden bg-[#FAF9F5] border border-neutral-200">
              <svg
                viewBox="0 0 500 320"
                className="h-full w-full select-none"
                style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.04))' }}
              >
                {/* Engineering grid lines */}
                <defs>
                  <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(20,21,23,0.04)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cadGrid)" />

                {/* Center axis guide lines */}
                <line x1="250" y1="20" x2="250" y2="300" stroke="rgba(20,21,23,0.15)" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="30" y1="160" x2="470" y2="160" stroke="rgba(20,21,23,0.15)" strokeDasharray="4 4" strokeWidth="1" />

                {/* Main Headband Halo Curve (Beta-Titanium flexible band) */}
                <path
                  d="M 90 230 C 90 110, 160 60, 250 60 C 340 60, 410 110, 410 230"
                  fill="none"
                  stroke="#141517"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                
                {/* Secondary inner silicone cushioning strip */}
                <path
                  d="M 96 226 C 96 116, 164 68, 250 68 C 336 68, 404 116, 404 226"
                  fill="none"
                  stroke="#8C887B"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />

                {/* Occipital / temporal tensioner arms */}
                <path
                  d="M 90 230 C 85 250, 75 270, 60 280"
                  fill="none"
                  stroke="#141517"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 410 230 C 415 250, 425 270, 440 280"
                  fill="none"
                  stroke="#141517"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Central Electronics Pod (Top Center Forehead) */}
                <rect
                  x="215"
                  y="42"
                  width="70"
                  height="34"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#141517"
                  strokeWidth="2"
                />
                {/* LED / Logo mark on pod */}
                <circle cx="230" cy="59" r="3" fill="#D96514" />
                <text x="240" y="62" fontFamily="IBM Plex Mono" fontSize="8" fill="#141517" fontWeight="600">
                  CORTEX-M33
                </text>
                <text x="220" y="90" fontFamily="IBM Plex Mono" fontSize="9" fill="#8C887B">
                  POD: 34x12mm
                </text>

                {/* 3-Electrode Clinical Montage Transducers */}
                {/* Fp1 Active Left Prefrontal Lead */}
                <circle cx="190" cy="102" r="10" fill="#FFFFFF" stroke="#D96514" strokeWidth="2.5" />
                <circle cx="190" cy="102" r="4" fill="#D96514" />
                <text x="145" y="105" fontFamily="IBM Plex Mono" fontSize="10" fill="#141517" fontWeight="700">E1: Fp1</text>
                <text x="145" y="117" fontFamily="IBM Plex Mono" fontSize="8" fill="#8C887B">LEFT FRONTAL</text>

                {/* Fp2 Active Right Prefrontal Lead */}
                <circle cx="310" cy="102" r="10" fill="#FFFFFF" stroke="#D96514" strokeWidth="2.5" />
                <circle cx="310" cy="102" r="4" fill="#D96514" />
                <text x="328" y="105" fontFamily="IBM Plex Mono" fontSize="10" fill="#141517" fontWeight="700">E2: Fp2</text>
                <text x="328" y="117" fontFamily="IBM Plex Mono" fontSize="8" fill="#8C887B">RIGHT FRONTAL</text>

                {/* Earclip reference lead (flexible wire to CMS/DRL) */}
                <path
                  d="M 435 270 Q 460 285 455 305"
                  fill="none"
                  stroke="#D96514"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
                <circle cx="455" cy="305" r="8" fill="#FFFFFF" stroke="#D96514" strokeWidth="2.5" />
                <circle cx="455" cy="305" r="4" fill="#D96514" />
                <text x="350" y="310" fontFamily="IBM Plex Mono" fontSize="9" fill="#D96514" fontWeight="700">
                  E3: REF/GND EARCLIP
                </text>

                {/* Dimension callouts */}
                <line x1="90" y1="290" x2="410" y2="290" stroke="#8C887B" strokeWidth="1" />
                <line x1="90" y1="285" x2="90" y2="295" stroke="#8C887B" strokeWidth="1" />
                <line x1="410" y1="285" x2="410" y2="295" stroke="#8C887B" strokeWidth="1" />
                <text x="220" y="303" fontFamily="IBM Plex Mono" fontSize="9" fill="#8C887B">
                  SPAN: 174.0 mm
                </text>
              </svg>

              {/* Interactive Hotspot Buttons Overlay */}
              {SENSOR_HOTSPOTS.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setActiveHotspot(spot)}
                  style={{ top: `${spot.coord.y}%`, left: `${spot.coord.x}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center justify-center p-1 rounded-full transition-transform focus:outline-none ${
                    activeHotspot.id === spot.id ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                  }`}
                  aria-label={`Inspect ${spot.label}`}
                >
                  <span
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      activeHotspot.id === spot.id
                        ? 'border-[#D96514] bg-[#D96514] text-white shadow-sm'
                        : 'border-[#141517] bg-white group-hover:border-[#D96514]'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                </button>
              ))}
            </div>

            {/* Caption & technical note */}
            <div className="flex items-center justify-between border-t border-neutral-300 pt-2 text-[11px] text-neutral-600 font-mono">
              <span>CLICK ANY SENSOR NODE TO INSPECT TRANSDUCER SPECS</span>
              <span className="text-[#D96514] font-semibold">3-ELECTRODE DRY AG/AGCL ARRAY</span>
            </div>
          </div>

          {/* Hotspot Inspector & CAD download info */}
          <div className="flex flex-col justify-between border border-neutral-300 bg-white p-5 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <span className="font-mono text-xs font-semibold text-[#D96514]">
                  {activeHotspot.chName}
                </span>
                <span className="font-mono text-[10px] text-neutral-500">HOTSPOT INSPECTOR</span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-[#141517]">{activeHotspot.label}</h3>
                <p className="font-mono text-xs text-neutral-500">{activeHotspot.sublabel}</p>

                <div className="mt-4 border-l-2 border-[#D96514] pl-3">
                  <p className="text-xs leading-relaxed text-neutral-700">{activeHotspot.specs}</p>
                </div>
              </div>

              {/* Engineering highlights */}
              <div className="mt-6 space-y-3 border-t border-neutral-200 pt-4">
                <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#141517] mt-0.5" />
                  <span>
                    <strong>Self-Conforming Spring Hinge:</strong> Distributes clamping force to under 1.2 Newtons across the temples to eliminate focal headache pressure.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#141517] mt-0.5" />
                  <span>
                    <strong>Hair Penetration Fingers:</strong> Specialized comb geometry parted through hair without snagging, establishing direct ionic scalp contact.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-neutral-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#141517] mt-0.5" />
                  <span>
                    <strong>Hermetic Polycarbonate Shell:</strong> Ultrasonic-welded pod protects the 24-bit ADC from sweat vapor and electrostatic discharge (ESD ±8 kV).
                  </span>
                </div>
              </div>
            </div>

            {/* CAD asset download / partner notice */}
            <div className="mt-6 border-t border-neutral-200 pt-4 bg-[#FAF9F5] p-3 border border-neutral-300">
              <div className="flex items-center justify-between font-mono text-xs font-semibold text-[#141517]">
                <span>CAD RELEASE REPOSITORY</span>
                <span className="text-[#D96514]">STEP / STL / DXF</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-600">
                Complete mechanical CAD solid models and electrode mounting jigs are released to certified research institutions and early-access developer partners.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <a
                  href="#waitlist"
                  className="inline-flex items-center gap-1.5 border border-[#141517] bg-white px-2.5 py-1 font-mono text-xs font-medium text-[#141517] hover:bg-neutral-100 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> REQUEST STEP ARCHIVE
                </a>
                <span className="font-mono text-[10px] text-neutral-500">REV 3.2.1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
