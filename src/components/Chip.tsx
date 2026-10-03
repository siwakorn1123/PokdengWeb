import React from 'react';

interface ChipProps {
  value: number;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  count?: number;
}

const CHIP_STYLES: Record<number, { bg: string; border: string; text: string; ring: string }> = {
  10: {
    bg: 'from-blue-600 to-blue-800',
    border: 'border-blue-300',
    text: 'text-blue-100',
    ring: 'ring-blue-400',
  },
  50: {
    bg: 'from-emerald-600 to-emerald-800',
    border: 'border-emerald-300',
    text: 'text-emerald-100',
    ring: 'ring-emerald-400',
  },
  100: {
    bg: 'from-red-600 to-red-800',
    border: 'border-red-300',
    text: 'text-red-100',
    ring: 'ring-red-400',
  },
  500: {
    bg: 'from-purple-600 to-purple-800',
    border: 'border-purple-300',
    text: 'text-purple-100',
    ring: 'ring-purple-400',
  },
  1000: {
    bg: 'from-amber-500 to-amber-700',
    border: 'border-amber-200',
    text: 'text-amber-100',
    ring: 'ring-amber-300',
  },
};

export const Chip: React.FC<ChipProps> = ({
  value,
  isSelected = false,
  disabled = false,
  onClick,
  count,
}) => {
  const style = CHIP_STYLES[value] || CHIP_STYLES[100];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative group shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full p-0.5 sm:p-1 bg-gradient-to-br ${style.bg} border-2 ${
        style.border
      } shadow-md sm:shadow-lg transition-all duration-200 transform cursor-pointer ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : isSelected
          ? 'scale-110 -translate-y-1 sm:-translate-y-2 ring-3 sm:ring-4 ' + style.ring + ' shadow-amber-500/40 z-10'
          : 'hover:scale-105 hover:-translate-y-0.5 active:scale-95'
      }`}
    >
      {/* Outer dashed pattern */}
      <div className="absolute inset-0.5 rounded-full border border-dashed border-white/60 pointer-events-none" />

      {/* Chip center */}
      <div className="w-full h-full rounded-full bg-neutral-900/60 flex flex-col items-center justify-center border border-white/30 backdrop-blur-xs">
        <span className={`font-cinzel font-black text-[10px] sm:text-xs md:text-sm ${style.text} tracking-tight`}>
          {value >= 1000 ? `${value / 1000}k` : value}
        </span>
      </div>

      {count !== undefined && count > 1 && (
        <span className="absolute -top-1 -right-1 bg-neutral-950 text-amber-300 text-[9px] font-bold px-1 py-0.2 rounded-full border border-amber-500/50 shadow">
          x{count}
        </span>
      )}
    </button>
  );
};
