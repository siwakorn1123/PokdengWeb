import React from 'react';
import { Card, Suit } from '../core/pokdengCore';
import { Eye } from 'lucide-react';

interface PlayingCardProps {
  card?: Card;
  hidden?: boolean;
  highlight?: boolean;
  delayIndex?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  hintText?: string;
}

const SUIT_ICONS: Record<Suit, { symbol: string; color: string; label: string }> = {
  Hearts: { symbol: '♥', color: 'text-red-600', label: 'Hearts (โพแดง)' },
  Diamonds: { symbol: '♦', color: 'text-red-500', label: 'Diamonds (ข้าวหลามตัด)' },
  Clubs: { symbol: '♣', color: 'text-neutral-900', label: 'Clubs (ดอกจิก)' },
  Spades: { symbol: '♠', color: 'text-neutral-950', label: 'Spades (โพดำ)' },
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  hidden = false,
  highlight = false,
  delayIndex = 0,
  size = 'md',
  interactive = false,
  onClick,
  hintText,
}) => {
  // Mobile-first responsive sizing to guarantee no overflow on small phone screens
  const sizeClasses = {
    sm: 'w-14 h-20 sm:w-16 sm:h-24 text-[10px] sm:text-xs rounded-lg',
    md: 'w-[74px] h-[108px] sm:w-[88px] sm:h-[128px] md:w-28 md:h-40 text-xs sm:text-sm md:text-base rounded-xl',
    lg: 'w-22 h-32 sm:w-28 sm:h-40 md:w-34 md:h-48 text-sm sm:text-base rounded-2xl',
  }[size];

  const suit = card?.suit || 'Spades';
  const value = card?.value || 'A';
  const suitInfo = SUIT_ICONS[suit];
  const isRed = suit === 'Hearts' || suit === 'Diamonds';

  return (
    <div
      className={`perspective-1000 inline-block select-none shrink-0 ${
        interactive ? 'cursor-pointer group' : ''
      }`}
      onClick={interactive ? onClick : undefined}
      style={{ animationDelay: `${delayIndex * 80}ms` }}
    >
      <div
        className={`${sizeClasses} relative preserve-3d transition-transform duration-500 ease-out ${
          hidden ? 'rotate-y-180' : ''
        } ${
          highlight
            ? 'ring-3 sm:ring-4 ring-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.6)] -translate-y-1 sm:-translate-y-2'
            : interactive && hidden
            ? 'hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-amber-500/30 shadow-md sm:shadow-xl'
            : 'shadow-md sm:shadow-xl'
        }`}
      >
        {/* ============================================================ */}
        {/* FRONT FACE (Face Up)                                         */}
        {/* ============================================================ */}
        <div
          className={`absolute inset-0 backface-hidden rounded-xl border ${
            highlight ? 'border-amber-400' : 'border-neutral-300'
          } bg-gradient-to-b from-stone-50 via-white to-stone-100 ${
            isRed ? 'text-red-600' : 'text-neutral-900'
          } flex flex-col justify-between p-1.5 sm:p-2 md:p-2.5 shadow-sm`}
        >
          {/* Top Left Value & Suit */}
          <div className="flex flex-col items-center leading-none self-start">
            <span className="font-bold font-mono text-xs sm:text-sm md:text-base tracking-tighter">{value}</span>
            <span className="text-[10px] sm:text-xs md:text-sm -mt-0.5">{suitInfo.symbol}</span>
          </div>

          {/* Center Art / Big Symbol */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {['J', 'Q', 'K'].includes(value) ? (
              <div className="flex flex-col items-center opacity-85">
                <span className="text-xl sm:text-2xl md:text-4xl">{suitInfo.symbol}</span>
                <span className="text-[8px] sm:text-[10px] md:text-xs font-cinzel font-black tracking-widest uppercase mt-0.5 text-neutral-500">
                  {value === 'K' ? 'King' : value === 'Q' ? 'Queen' : 'Jack'}
                </span>
              </div>
            ) : (
              <span className="text-2xl sm:text-3xl md:text-4xl opacity-90">{suitInfo.symbol}</span>
            )}
          </div>

          {/* Bottom Right Inverted Value & Suit */}
          <div className="flex flex-col items-center leading-none self-end rotate-180">
            <span className="font-bold font-mono text-xs sm:text-sm md:text-base tracking-tighter">{value}</span>
            <span className="text-[10px] sm:text-xs md:text-sm -mt-0.5">{suitInfo.symbol}</span>
          </div>

          {/* Gloss overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40 pointer-events-none rounded-xl" />
        </div>

        {/* ============================================================ */}
        {/* BACK FACE (Face Down)                                        */}
        {/* ============================================================ */}
        <div
          className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-red-900 via-red-950 to-neutral-950 flex items-center justify-center p-1 sm:p-1.5 shadow-md overflow-hidden ${
            interactive ? 'group-hover:border-amber-400 transition' : ''
          }`}
        >
          {/* Intricate card back pattern */}
          <div className="w-full h-full border border-amber-500/30 rounded-lg flex flex-col items-center justify-center bg-red-950/80 relative">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:6px_6px] sm:[background-size:8px_8px]" />
            
            <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full border border-amber-500/60 flex items-center justify-center bg-red-900/60 shadow-inner z-10">
              <span className="font-cinzel text-amber-400 font-black text-[10px] sm:text-xs md:text-sm tracking-widest">
                PD
              </span>
            </div>

            {interactive && (
              <div className="absolute bottom-1 flex items-center gap-0.5 text-[8px] sm:text-[9px] md:text-[10px] text-amber-300 font-bold px-1 py-0.2 rounded bg-black/70 backdrop-blur-xs border border-amber-500/40">
                <Eye className="w-2.5 h-2.5" />
                <span>{hintText || 'เปิด'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
