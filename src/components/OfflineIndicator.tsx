import { FC } from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 lg:bottom-4 left-4 z-50 flex items-center gap-2 border border-[#141517] bg-[#141517] px-3 py-1.5 font-mono text-[11px] font-semibold text-amber-300 shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 text-[#D96514] animate-pulse" />
      <span>Offline Mode — Cached app &amp; simulation active</span>
    </div>
  );
};
