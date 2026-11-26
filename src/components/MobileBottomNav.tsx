import { FC } from 'react';
import { Activity, Waves, Cpu, FileText } from 'lucide-react';
import { AppTab } from '../types';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: typeof Activity }[] = [
  { id: 'monitor', label: 'Monitor', icon: Activity },
  { id: 'bands', label: 'Bands', icon: Waves },
  { id: 'device', label: 'Device', icon: Cpu },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export const MobileBottomNav: FC<MobileBottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      aria-label="App Navigation"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-neutral-300 bg-[#F6F5F0]/95 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 font-mono">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                isActive
                  ? 'text-[#D96514] bg-white border-t-2 border-[#D96514]'
                  : 'text-neutral-600 hover:text-[#141517]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#D96514]' : 'text-neutral-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
