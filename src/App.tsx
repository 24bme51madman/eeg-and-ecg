import { useState, FC } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WhyItMatters } from './components/WhyItMatters';
import { PipelineSequence } from './components/PipelineSequence';
import { BrainwaveBands } from './components/BrainwaveBands';
import { CadHardwareSection } from './components/CadHardwareSection';
import { TechSpecs } from './components/TechSpecs';
import { UseCases } from './components/UseCases';
import { SessionDownloadModal } from './components/SessionDownloadModal';
import { CognitiveAlertSidebar } from './components/CognitiveAlertSidebar';
import { BrainwaveBandId } from './types';
import { HardwareConnectionProvider } from './context/HardwareConnectionContext';
import { CognitiveAlertProvider } from './context/CognitiveAlertContext';

export default function App() {
  const [selectedBandForTrace, setSelectedBandForTrace] = useState<BrainwaveBandId | 'all'>('all');

  const handleSelectBand = (bandId: BrainwaveBandId | 'all') => {
    setSelectedBandForTrace(bandId);
  };

  return (
    <HardwareConnectionProvider>
      <CognitiveAlertProvider>
        <div className="min-h-screen bg-[#F6F5F0] text-[#141517] selection:bg-[#E06915] selection:text-white">
          {/* Precision Lab Masthead */}
          <Header />

          {/* Main Page Content */}
          <main>
            {/* 1. Hero with live Oscilloscope chart-recorder trace in Signal Amber & Cad Schematic preview */}
            <Hero />

            {/* 2. Why this matters: Concrete physiological case without filler */}
            <WhyItMatters />

            {/* 3. How it works: Sequential pipeline (Wear -> Capture EEG -> AI analysis -> Insights) */}
            <PipelineSequence />

            {/* 4. Brainwave bands: Data-panel style breakdown (delta, theta, alpha, beta, gamma) */}
            <BrainwaveBands onSelectBandForTrace={handleSelectBand} />

            {/* 5. Physical Hardware & CAD architecture (STEP/STL/DXF 42g halo) */}
            <CadHardwareSection />

            {/* 6. Technical Specifications: Structured instrument data sheet */}
            <TechSpecs />

            {/* 7. Use cases: Individual focus/fatigue, research LSL, enterprise vigilance */}
            <UseCases />
          </main>

          {/* Persistent Cognitive Alert Sidebar & Sentinel */}
          <CognitiveAlertSidebar />

          {/* Global Modals */}
          <SessionDownloadModal />
        </div>
      </CognitiveAlertProvider>
    </HardwareConnectionProvider>
  );
}

