import { FC, useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Suppress install CTA when already launched in standalone app mode
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        id="pwa-install-app-btn"
        type="button"
        onClick={handleInstallClick}
        title={
          isInstallable
            ? 'Install Kortex-Kare as a standalone desktop or mobile app'
            : 'Install Kortex-Kare on your device home screen or desktop'
        }
        className={`h-8 inline-flex items-center gap-1.5 border border-[#D96514] bg-[#D96514] text-white font-mono text-xs font-semibold transition-colors hover:bg-[#b8520e] focus:outline-none focus:ring-2 focus:ring-[#D96514] ${
          compact ? 'px-2' : 'px-2.5'
        }`}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span className={compact ? 'hidden sm:inline' : ''}>
          {isIOS ? 'INSTALL APP' : 'GET APP'}
        </span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
        >
          <div className="w-full max-w-md border-2 border-[#141517] bg-[#FAF9F5] p-5 shadow-2xl font-sans">
            <div className="flex items-start justify-between border-b border-neutral-300 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center bg-[#141517] text-[#D96514]">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h3
                    id="pwa-install-guide-title"
                    className="font-mono text-sm font-bold text-[#141517] uppercase"
                  >
                    Install Kortex-Kare App
                  </h3>
                  <p className="font-mono text-[11px] text-neutral-500">
                    Standalone Desktop &amp; Mobile App Mode
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="border border-neutral-300 bg-white p-1 text-neutral-600 hover:border-[#141517] hover:text-[#141517]"
                aria-label="Close install instructions"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <p className="font-medium text-[#141517]">
                  Add Kortex-Kare directly to your iPhone or iPad Home Screen:
                </p>
                <ol className="space-y-2.5 border border-neutral-300 bg-white p-3.5 font-mono text-xs">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#141517] text-white font-bold">
                      1
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Tap the <Share className="inline h-3.5 w-3.5 text-[#D96514]" />{' '}
                      <strong>Share</strong> icon in Safari&apos;s toolbar.
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#141517] text-white font-bold">
                      2
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Scroll down and tap{' '}
                      <PlusSquare className="inline h-3.5 w-3.5 text-[#D96514]" />{' '}
                      <strong>Add to Home Screen</strong>.
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#141517] text-white font-bold">
                      3
                    </span>
                    <span>
                      Tap <strong>Add</strong> — Kortex-Kare opens full-screen like a native app.
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <p className="font-medium text-[#141517]">
                  Install Kortex-Kare as a standalone application window:
                </p>
                <ol className="space-y-2.5 border border-neutral-300 bg-white p-3.5 font-mono text-xs">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#141517] text-white font-bold">
                      1
                    </span>
                    <span>
                      Open this app directly in its own browser tab (if viewing inside an embedded preview frame).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#141517] text-white font-bold">
                      2
                    </span>
                    <span>
                      In Chrome / Edge / Android, click the{' '}
                      <strong>Install App</strong> icon in the address bar or browser menu (<strong>⋮ → Install Kortex-Kare</strong>).
                    </span>
                  </li>
                </ol>
                <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-2.5 font-mono text-[11px] text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Offline caching and standalone launch are active via Service Worker.</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full border border-[#141517] bg-[#141517] py-2 font-mono text-xs font-bold text-white hover:bg-[#D96514] hover:border-[#D96514] transition-colors"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
};
