import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WhyItMatters } from './components/WhyItMatters';
import { PipelineSequence } from './components/PipelineSequence';
import { BrainwaveBands } from './components/BrainwaveBands';
import { CadHardwareSection } from './components/CadHardwareSection';
import { TechSpecs } from './components/TechSpecs';
import { UseCases } from './components/UseCases';
import { ReportsWorkspace } from './components/ReportsWorkspace';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SessionDownloadModal } from './components/SessionDownloadModal';
import { CognitiveAlertSidebar } from './components/CognitiveAlertSidebar';
import { AppTab, BrainwaveBandId } from './types';
import { HardwareConnectionProvider } from './context/HardwareConnectionContext';
import { CognitiveAlertProvider } from './context/CognitiveAlertContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('monitor');
  const [selectedBandForTrace, setSelectedBandForTrace] = useState<BrainwaveBandId | 'all'>('all');

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBand = (bandId: BrainwaveBandId | 'all') => {
    setSelectedBandForTrace(bandId);
    setActiveTab('monitor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <HardwareConnectionProvider>
      <CognitiveAlertProvider>
        <div className="min-h-screen bg-[#F6F5F0] text-[#141517] selection:bg-[#E06915] selection:text-white flex flex-col">
          {/* App Top Bar */}
          <Header activeTab={activeTab} onSelectTab={handleSelectTab} />

          {/* Main App Workspace */}
          <main className="flex-1 pb-20 lg:pb-8">
            {activeTab === 'monitor' && <Hero selectedBand={selectedBandForTrace} />}

            {activeTab === 'bands' && (
              <>
                <BrainwaveBands onSelectBandForTrace={handleSelectBand} />
                <WhyItMatters />
              </>
            )}

            {activeTab === 'device' && (
              <>
                <PipelineSequence />
                <CadHardwareSection />
                <TechSpecs />
              </>
            )}

            {activeTab === 'reports' && (
              <>
                <ReportsWorkspace />
                <UseCases />
              </>
            )}
          </main>

          {/* Mobile App Bottom Navigation */}
          <MobileBottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />

          {/* Offline Mode Toast */}
          <OfflineIndicator />

          {/* Persistent Cognitive Alert Sidebar & Sentinel */}
          <CognitiveAlertSidebar />

          {/* Global Modals */}
          <SessionDownloadModal />
        </div>
      </CognitiveAlertProvider>
    </HardwareConnectionProvider>
  );
}


