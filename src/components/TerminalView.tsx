import React, { useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Sparkles } from 'lucide-react';

interface TerminalViewProps {
  logs: string[];
  onCommand?: (cmd: string) => void;
  waitingInput?: boolean;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  logs,
  onCommand,
  waitingInput = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Strip or parse ANSI escape codes into colored HTML spans
  const parseAnsi = (text: string) => {
    const parts = text.split(/(\x1b\[[0-9;]*m)/g);
    let currentColor = '';
    let isBold = false;

    return parts.map((part, i) => {
      if (part.startsWith('\x1b[')) {
        if (part === '\x1b[0m') {
          currentColor = '';
          isBold = false;
        } else if (part === '\x1b[1m') {
          isBold = true;
        } else if (part === '\x1b[31m') {
          currentColor = 'text-red-400';
        } else if (part === '\x1b[32m') {
          currentColor = 'text-emerald-400';
        } else if (part === '\x1b[33m') {
          currentColor = 'text-amber-400';
        }
        return null;
      }
      return (
        <span
          key={i}
          className={`${currentColor} ${isBold ? 'font-bold' : ''}`}
        >
          {part}
        </span>
      );
    });
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-neutral-400 text-xs font-semibold ml-2 flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-neutral-400" />
            pokdengp.ts — Console Output
          </span>
        </div>
        <span className="text-[10px] text-neutral-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          ts-node pokdengp.ts
        </span>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="p-4 flex-1 overflow-y-auto space-y-1 bg-neutral-950 text-neutral-300 leading-relaxed font-mono"
      >
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap break-all">
            {parseAnsi(log)}
          </div>
        ))}

        {waitingInput && (
          <div className="flex items-center gap-2 pt-2 text-amber-400 font-bold animate-pulse">
            <span>&gt; Would you like to draw a 3rd card? (y/n):</span>
            <div className="flex gap-2">
              <button
                onClick={() => onCommand?.('y')}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded border border-amber-500/40 text-[11px]"
              >
                [Y] Yes (Draw)
              </button>
              <button
                onClick={() => onCommand?.('n')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 text-[11px]"
              >
                [N] No (Stay)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
