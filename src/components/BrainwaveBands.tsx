import { FC, useState } from 'react';
import { BRAINWAVE_BANDS } from '../data/specsData';
import { BrainwaveBandId } from '../types';
import { useHardwareConnection } from '../context/HardwareConnectionContext';
import { Radio, RefreshCw, Zap, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BrainwaveBandsProps {
  onSelectBandForTrace?: (bandId: BrainwaveBandId | 'all') => void;
}

export const BrainwaveBands: FC<BrainwaveBandsProps> = ({ onSelectBandForTrace }) => {
  const [activeBandId, setActiveBandId] = useState<BrainwaveBandId>('alpha');
  const {
    hardwareData,
    esp32Reachable,
    lastEsp32PollTime,
    getHardwareData,
    injectMockHardwareData,
  } = useHardwareConnection();

  const selectedBand = BRAINWAVE_BANDS.find((b) => b.id === activeBandId) || BRAINWAVE_BANDS[2];

  const handleBandClick = (bandId: BrainwaveBandId) => {
    setActiveBandId(bandId);
    if (onSelectBandForTrace) {
      onSelectBandForTrace(bandId);
    }
  };

  return (
    <section id="brainwave-bands" className="w-full border-b border-neutral-300 bg-[#FAF9F5] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-2 border-b border-neutral-300 pb-4 md:flex-row md:items-baseline">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 bg-[#D96514]" />
              <span>SEC 04 // SPECTRAL SPECTROGRAM</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#141517] sm:text-3xl">
              Cortical Frequency Bands
            </h2>
          </div>
          <div className="font-mono text-xs text-neutral-500">
            DECOMPOSITION: CONTINUOUS MORLET WAVELETS // 0.5 TO 100 HZ
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-neutral-700">
          Raw voltage potentials are continuously decomposed into standardized spectral bands. 
          Our embedded model analyzes power spectral density (PSD), inter-electrode phase coherence, and asymmetry ratios across the five clinical frequency windows.
        </p>

        {/* ESP32 Hardware Live Ingestion Stream (http://192.168.4.1/data @ 400ms) */}
        <div className="mt-6 border border-neutral-300 bg-white p-4">
          <div className="flex flex-col justify-between gap-3 border-b border-neutral-200 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  esp32Reachable
                    ? 'bg-emerald-600 animate-pulse'
                    : 'bg-[#D96514] animate-ping'
                }`}
              />
              <span className="font-mono text-xs font-bold text-[#141517]">
                HARDWARE POLLER // http://192.168.4.1/data (400ms INTERVAL)
              </span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 font-semibold ${
                  esp32Reachable
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {esp32Reachable ? 'ESP32 AP CONNECTED' : 'POLLING AP...'}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => getHardwareData()}
                className="inline-flex items-center gap-1 border border-neutral-300 bg-[#FAF9F5] px-2 py-1 text-neutral-800 hover:border-neutral-500"
                title="Trigger immediate fetch from http://192.168.4.1/data"
              >
                <RefreshCw className="h-3 w-3" />
                <span>POLL NOW</span>
              </button>
              <button
                type="button"
                onClick={() => injectMockHardwareData()}
                className="inline-flex items-center gap-1 border border-neutral-300 bg-white px-2 py-1 text-neutral-800 hover:border-[#D96514] hover:text-[#D96514]"
                title="Test UI with sample payload when ESP32 Wi-Fi is offline"
              >
                <Zap className="h-3 w-3 text-[#D96514]" />
                <span>TEST SAMPLE PAYLOAD</span>
              </button>
            </div>
          </div>

          {/* Real-time Hardware Metrics Grid with explicit document IDs */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-6 font-mono text-xs">
            <div className="border border-neutral-200 bg-[#FAF9F5] p-2.5">
              <div className="text-[10px] text-neutral-500 font-semibold">DELTA (0.5-4 Hz)</div>
              <div className="mt-1 text-lg font-bold text-[#141517]">
                <span id="deltaValue">
                  {hardwareData ? hardwareData.delta.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] font-normal text-neutral-400 ml-1">μV²</span>
              </div>
            </div>

            <div className="border border-neutral-200 bg-[#FAF9F5] p-2.5">
              <div className="text-[10px] text-neutral-500 font-semibold">THETA (4-8 Hz)</div>
              <div className="mt-1 text-lg font-bold text-[#141517]">
                <span id="thetaValue">
                  {hardwareData ? hardwareData.theta.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] font-normal text-neutral-400 ml-1">μV²</span>
              </div>
            </div>

            <div className="border border-neutral-200 bg-[#FAF9F5] p-2.5 border-l-2 border-l-[#D96514]">
              <div className="text-[10px] text-[#D96514] font-semibold">ALPHA (8-13 Hz)</div>
              <div className="mt-1 text-lg font-bold text-[#141517]">
                <span id="alphaValue">
                  {hardwareData ? hardwareData.alpha.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] font-normal text-neutral-400 ml-1">μV²</span>
              </div>
            </div>

            <div className="border border-neutral-200 bg-[#FAF9F5] p-2.5">
              <div className="text-[10px] text-neutral-500 font-semibold">BETA (13-30 Hz)</div>
              <div className="mt-1 text-lg font-bold text-[#141517]">
                <span id="betaValue">
                  {hardwareData ? hardwareData.beta.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] font-normal text-neutral-400 ml-1">μV²</span>
              </div>
            </div>

            <div className="border border-neutral-200 bg-[#FAF9F5] p-2.5">
              <div className="text-[10px] text-neutral-500 font-semibold">RAW BIOPOTENTIAL</div>
              <div className="mt-1 text-lg font-bold text-[#141517]">
                <span id="rawValue">
                  {hardwareData ? hardwareData.raw.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] font-normal text-neutral-400 ml-1">μV</span>
              </div>
            </div>

            <div className="border border-neutral-200 bg-[#FAF9F5] p-2.5">
              <div className="text-[10px] text-neutral-500 font-semibold">LEADS CONTACT</div>
              <div className="mt-1 flex items-center gap-1 text-xs font-bold">
                <span
                  id="leadsOffValue"
                  className={hardwareData?.leadsOff ? 'text-rose-600' : 'text-emerald-700'}
                >
                  {hardwareData ? (hardwareData.leadsOff ? 'LEADS OFF' : 'COUPLED') : 'STANDBY'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data-Panel Style Breakdown Table / Sheet */}
        <div className="mt-6 border border-neutral-300 bg-white">
          {/* Table Header */}
          <div className="hidden border-b border-neutral-300 bg-[#EFECE5] px-4 py-2.5 font-mono text-xs font-semibold text-[#141517] sm:grid sm:grid-cols-12 gap-2">
            <div className="col-span-2">BAND // SYMBOL</div>
            <div className="col-span-2">FREQUENCY RANGE</div>
            <div className="col-span-2">TYPICAL AMPLITUDE</div>
            <div className="col-span-3">NEUROLOGICAL STATE</div>
            <div className="col-span-3">AI CLASSIFICATION ROLE</div>
          </div>

          {/* Table Rows with Ruled Lab Dividers */}
          <div className="divide-y divide-neutral-200">
            {BRAINWAVE_BANDS.map((band) => {
              const isActive = band.id === activeBandId;
              return (
                <div
                  key={band.id}
                  onClick={() => handleBandClick(band.id)}
                  className={`p-4 transition-colors cursor-pointer sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 ${
                    isActive ? 'bg-[#FAF9F5] border-l-4 border-l-[#D96514]' : 'hover:bg-neutral-50'
                  }`}
                >
                  {/* Name & Symbol */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#141517]">
                      {band.name}
                    </span>
                    <span className="font-mono text-xs text-[#D96514] font-semibold border border-neutral-300 px-1.5 py-0.2 bg-white">
                      {band.symbol}
                    </span>
                  </div>

                  {/* Range */}
                  <div className="col-span-2 mt-1 sm:mt-0 font-mono text-xs font-semibold text-[#141517]">
                    <span className="sm:hidden text-neutral-500 font-normal">RANGE: </span>
                    {band.rangeHz}
                  </div>

                  {/* Amplitude */}
                  <div className="col-span-2 mt-1 sm:mt-0 font-mono text-xs text-neutral-700">
                    <span className="sm:hidden text-neutral-500 font-normal">AMP: </span>
                    {band.amplitudeMicrovolts}
                  </div>

                  {/* Cortical State */}
                  <div className="col-span-3 mt-1 sm:mt-0 text-xs text-neutral-800">
                    <span className="sm:hidden text-neutral-500 font-mono">STATE: </span>
                    {band.corticalState}
                  </div>

                  {/* Classification Role */}
                  <div className="col-span-3 mt-1 sm:mt-0 font-mono text-[11px] text-[#D96514] font-medium">
                    <span className="sm:hidden text-neutral-500 font-normal">ROLE: </span>
                    {band.classificationRole}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Selected Band Inspector Card */}
        <div className="mt-6 border border-neutral-300 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold text-[#141517]">BAND DETAIL:</span>
              <span className="text-[#D96514] font-semibold uppercase">{selectedBand.name} ({selectedBand.rangeHz})</span>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              CLICK ANY ROW ABOVE TO INSPECT PHYSIOLOGY
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <h4 className="text-sm font-bold text-[#141517]">Cortical Mechanism & Genesis</h4>
              <p className="mt-1 text-xs leading-relaxed text-neutral-700">
                {selectedBand.description}
              </p>

              <h4 className="mt-4 text-sm font-bold text-[#141517]">Characteristic Signal Morphology</h4>
              <p className="mt-1 font-mono text-xs text-neutral-700 bg-[#FAF9F5] p-2.5 border border-neutral-200">
                PATTERN: {selectedBand.signalPattern}
              </p>
            </div>

            <div className="md:col-span-5 border-t border-neutral-200 pt-4 md:border-t-0 md:border-l md:pl-6">
              <h4 className="font-mono text-xs font-semibold text-neutral-800 uppercase">
                MODEL WEIGHT & FEATURE SIGNIFICANCE
              </h4>
              <div className="mt-3 space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-neutral-600 text-[11px]">
                    <span>COGNITIVE LOAD COUPLING</span>
                    <span className="text-[#141517] font-semibold">
                      {selectedBand.id === 'theta' ? '92% (PRIMARY)' : selectedBand.id === 'alpha' ? '84% (INVERSE)' : selectedBand.id === 'beta' ? '68%' : '24%'}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-neutral-200">
                    <div
                      className="h-1.5 bg-[#D96514]"
                      style={{
                        width:
                          selectedBand.id === 'theta'
                            ? '92%'
                            : selectedBand.id === 'alpha'
                            ? '84%'
                            : selectedBand.id === 'beta'
                            ? '68%'
                            : '24%'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-600 text-[11px]">
                    <span>STRESS & ANXIETY COUPLING</span>
                    <span className="text-[#141517] font-semibold">
                      {selectedBand.id === 'beta' ? '96% (HIGH-BETA)' : selectedBand.id === 'alpha' ? '74% (ASYMMETRY)' : '18%'}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-neutral-200">
                    <div
                      className="h-1.5 bg-[#141517]"
                      style={{
                        width:
                          selectedBand.id === 'beta'
                            ? '96%'
                            : selectedBand.id === 'alpha'
                            ? '74%'
                            : '18%'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <a
                  href="#waveform-recorder-panel"
                  onClick={() => onSelectBandForTrace && onSelectBandForTrace(selectedBand.id)}
                  className="inline-flex items-center gap-1 font-mono text-xs text-[#D96514] hover:underline"
                >
                  <span>› View isolated {selectedBand.name} trace in live recorder</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
