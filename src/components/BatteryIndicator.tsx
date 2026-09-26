import { FC, useState, useRef, useEffect } from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Zap,
  Check,
  AlertTriangle,
  RefreshCw,
  Power,
  ChevronDown,
  X,
  Radio,
} from 'lucide-react';
import { useHardwareConnection } from '../context/HardwareConnectionContext';

interface BatteryIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const BatteryIndicator: FC<BatteryIndicatorProps> = ({ className = '' }) => {
  const {
    batteryLevel,
    isCharging = false,
    status,
    latestPacket,
    updateBatteryLevel,
    toggleCharging,
  } = useHardwareConnection();

  const [isOpen, setIsOpen] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Derived metrics based on Kortex-Kare 240 mAh LiPo specs
  const clampedLevel = Math.max(0, Math.min(100, Math.round(batteryLevel)));
  const estimatedHours = (clampedLevel * 0.165).toFixed(1);
  const estimatedVoltage = (3.45 + (clampedLevel / 100) * 0.75).toFixed(2);
  const isCritical = clampedLevel < 20;
  const isMedium = clampedLevel >= 20 && clampedLevel < 60;
  const isHigh = clampedLevel >= 60;

  // Color schemes
  const getStatusColor = () => {
    if (isCharging) return 'text-emerald-700 bg-emerald-50 border-emerald-500/40';
    if (isCritical) return 'text-rose-700 bg-rose-50 border-rose-500/50';
    if (isMedium) return 'text-[#D96514] bg-amber-50 border-amber-500/40';
    return 'text-emerald-800 bg-emerald-50/70 border-emerald-600/30';
  };

  const getBarColor = () => {
    if (isCharging) return 'bg-emerald-500';
    if (isCritical) return 'bg-rose-600';
    if (isMedium) return 'bg-[#D96514]';
    return 'bg-emerald-600';
  };

  const renderIcon = () => {
    if (isCharging) {
      return <BatteryCharging className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />;
    }
    if (clampedLevel >= 80) {
      return <BatteryFull className="h-3.5 w-3.5 text-emerald-700" />;
    }
    if (clampedLevel >= 40) {
      return <BatteryMedium className="h-3.5 w-3.5 text-neutral-700" />;
    }
    if (clampedLevel >= 20) {
      return <BatteryLow className="h-3.5 w-3.5 text-[#D96514]" />;
    }
    return <BatteryWarning className="h-3.5 w-3.5 text-rose-600 animate-pulse" />;
  };

  const handlePresetSelect = async (level: number) => {
    if (updateBatteryLevel) {
      await updateBatteryLevel(level, true);
      setBroadcastNotice(`Telemetry updated: ${level}% streamed to global host`);
      setTimeout(() => setBroadcastNotice(null), 3000);
    }
  };

  const handleToggleCharge = () => {
    if (toggleCharging) {
      toggleCharging();
      setBroadcastNotice(
        !isCharging
          ? 'Magnetic dock connected: charging biopotential cell'
          : 'Magnetic dock disconnected: running on internal LiPo'
      );
      setTimeout(() => setBroadcastNotice(null), 3000);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Interactive Header Indicator Button */}
      <button
        id="header-battery-indicator-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-[#D96514] ${getStatusColor()} ${
          isCritical && !isCharging ? 'animate-pulse ring-1 ring-rose-400' : ''
        }`}
        title={`Headband Battery: ${clampedLevel}% (${estimatedHours}h remaining). Click for power telemetry diagnostics.`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-1">
          {renderIcon()}

          {/* Micro Segmented Gauge Graphic */}
          <div
            className="hidden sm:flex items-center relative w-4.5 h-2.5 border border-current rounded-[1px] p-[1px]"
            title={`${clampedLevel}% charged`}
          >
            <div
              className={`h-full transition-all duration-300 ${getBarColor()}`}
              style={{ width: `${clampedLevel}%` }}
            />
            {/* Terminal nub */}
            <div className="absolute -right-[3px] top-[1.5px] w-[2px] h-[4px] bg-current rounded-r-[1px]" />
          </div>
        </div>

        <span className="font-bold tracking-tight">
          {clampedLevel}%
        </span>

        {/* Live link status dot */}
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === 'connected' ? 'bg-emerald-500' : 'bg-neutral-400'
          }`}
          title={status === 'connected' ? 'Live biopotential power telemetry' : 'Cached telemetry'}
        />

        <ChevronDown
          className={`h-3 w-3 opacity-60 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Diagnostics Popover Modal */}
      {isOpen && (
        <div
          id="battery-telemetry-popover"
          className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 border border-neutral-300 bg-[#FAF9F5] p-4 shadow-xl"
          role="dialog"
          aria-label="Headband Battery Diagnostics"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#D96514]" />
              <div>
                <h4 className="font-mono text-xs font-bold text-[#141517]">
                  POWER TELEMETRY // 240mAh Li-Po
                </h4>
                <div className="font-mono text-[10px] text-neutral-500">
                  {latestPacket?.deviceId || 'kortex-headband-01'} · 3-ELECTRODE TRANSDUCER
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-800 focus:outline-none"
              title="Close telemetry view"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Primary Visual Power Gauge */}
          <div className="mt-3 border border-neutral-200 bg-white p-3.5">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-extrabold text-[#141517]">
                  {clampedLevel}%
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  ({estimatedHours} hrs left)
                </span>
              </div>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase ${
                  isCharging
                    ? 'bg-emerald-100 text-emerald-800'
                    : isCritical
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-neutral-100 text-neutral-800'
                }`}
              >
                {isCharging
                  ? 'MAGNETIC DOCK LINKED'
                  : isCritical
                    ? 'CRITICAL LOW (< 20%)'
                    : 'DISCHARGING // NOMINAL'}
              </span>
            </div>

            {/* High-Resolution Gauge Bar */}
            <div className="mt-2.5">
              <div className="relative h-3 w-full overflow-hidden bg-neutral-200 rounded-[1px]">
                <div
                  className={`h-full transition-all duration-300 ${getBarColor()}`}
                  style={{ width: `${clampedLevel}%` }}
                />
                {/* 25%, 50%, 75% tick marks */}
                <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
                  <div className="w-[1px] h-full bg-white/40 left-1/4 absolute" />
                  <div className="w-[1px] h-full bg-white/40 left-2/4 absolute" />
                  <div className="w-[1px] h-full bg-white/40 left-3/4 absolute" />
                </div>
              </div>

              <div className="mt-1 flex justify-between font-mono text-[9px] text-neutral-400">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Electrochemical & Hardware Electrical Specs Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="border border-neutral-200 bg-white p-2">
              <span className="block text-[10px] text-neutral-500">CELL VOLTAGE</span>
              <strong className="text-neutral-900">{estimatedVoltage} V</strong>
              <span className="block text-[9px] text-neutral-400">LiPo nominal: 3.70 V</span>
            </div>
            <div className="border border-neutral-200 bg-white p-2">
              <span className="block text-[10px] text-neutral-500">EST. RUNTIME</span>
              <strong className="text-neutral-900">~{estimatedHours} hours</strong>
              <span className="block text-[9px] text-neutral-400">16.5h continuous spec</span>
            </div>
            <div className="border border-neutral-200 bg-white p-2">
              <span className="block text-[10px] text-neutral-500">SYSTEM CURRENT</span>
              <strong className="text-neutral-900">14.5 mA</strong>
              <span className="block text-[9px] text-neutral-400">Delta-Sigma ADC + BLE</span>
            </div>
            <div className="border border-neutral-200 bg-white p-2">
              <span className="block text-[10px] text-neutral-500">CHASSIS THERMAL</span>
              <strong className="text-neutral-900">30.8 °C</strong>
              <span className="block text-[9px] text-emerald-600">Within nominal bounds</span>
            </div>
          </div>

          {/* Magnetic Dock & Telemetry Simulation Actions */}
          <div className="mt-3 border-t border-neutral-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-neutral-600">
                SIMULATE TELEMETRY STREAM
              </span>
              <button
                type="button"
                onClick={handleToggleCharge}
                className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 font-bold transition-colors ${
                  isCharging
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-500'
                }`}
              >
                <Zap className="h-3 w-3" />
                {isCharging ? 'DISCONNECT DOCK' : 'CONNECT POGO DOCK'}
              </button>
            </div>

            {/* Quick Test Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '98% Full', level: 98 },
                { label: '50% Nom', level: 50 },
                { label: '18% Low', level: 18 },
                { label: '8% Crit', level: 8 },
              ].map((p) => (
                <button
                  key={p.level}
                  type="button"
                  onClick={() => handlePresetSelect(p.level)}
                  className={`border px-1.5 py-1 font-mono text-[10px] text-center transition-colors ${
                    clampedLevel === p.level
                      ? 'border-[#141517] bg-[#141517] text-white font-bold'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {broadcastNotice && (
              <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-300 p-1.5">
                <Check className="h-3 w-3 flex-shrink-0" />
                <span>{broadcastNotice}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
