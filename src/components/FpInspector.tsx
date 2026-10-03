import React, { useState } from 'react';
import { GameState, getHandCategory, calculateScore, calculateDeng, getCategoryRank } from '../core/pokdengCore';
import { Code2, History, ChevronRight, CheckCircle2, Cpu } from 'lucide-react';

interface FpInspectorProps {
  history: GameState[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  liveState: GameState;
}

export const FpInspector: React.FC<FpInspectorProps> = ({
  history,
  currentStepIndex,
  onSelectStep,
  liveState,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'pure_functions' | 'state_json'>('timeline');
  const inspectedState = history[currentStepIndex] || liveState;

  const playerCat = getHandCategory(inspectedState.player.hand);
  const dealerCat = getHandCategory(inspectedState.dealer.hand);
  const playerScore = calculateScore(inspectedState.player.hand);
  const dealerScore = calculateScore(inspectedState.dealer.hand);
  const playerDeng = calculateDeng(inspectedState.player.hand);
  const dealerDeng = calculateDeng(inspectedState.dealer.hand);

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col h-full text-xs md:text-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-neutral-950/70 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-100 flex items-center gap-2">
              FP Engine Inspector
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Pure Core
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">Immutable State & Deterministic Reductions</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === 'timeline'
                ? 'bg-neutral-800 text-amber-400 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Timeline ({history.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pure_functions')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === 'pure_functions'
                ? 'bg-neutral-800 text-amber-400 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              Pure Reducers
            </span>
          </button>
          <button
            onClick={() => setActiveTab('state_json')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === 'state_json'
                ? 'bg-neutral-800 text-amber-400 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="font-mono text-[11px]">JSON</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Time-Travel Debugging:</strong> Every state transition yields a fresh snapshot with zero in-place mutations. Select any step below:
              </span>
            </div>

            {/* Steps bar */}
            <div className="space-y-2">
              {history.map((state, idx) => {
                const isSelected = idx === currentStepIndex;
                const isLive = idx === history.length - 1;

                return (
                  <button
                    key={idx}
                    onClick={() => onSelectStep(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-neutral-100 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-neutral-950/40 border-neutral-800/70 text-neutral-300 hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {idx}
                      </span>
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-2">
                          <span>Phase: <code className="text-amber-300">{state.phase}</code></span>
                          {isLive && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Player: {state.player.hand.cards.length} cards ({calculateScore(state.player.hand)} pts) | Dealer: {state.dealer.hand.cards.length} cards
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'pure_functions' && (
          <div className="space-y-4">
            <div className="bg-neutral-950/70 rounded-xl p-3 border border-neutral-800 space-y-2 font-mono text-xs">
              <div className="text-neutral-400 font-sans font-semibold text-xs flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <span>Evaluated Pure Reducers (Current Step: {inspectedState.phase})</span>
                <span className="text-emerald-400">Deterministic</span>
              </div>

              {/* Player reduction */}
              <div className="pt-1">
                <span className="text-neutral-500">// 1. calculateScore(player.hand)</span>
                <div className="text-neutral-200">
                  Cards: [{inspectedState.player.hand.cards.map(c => `${c.value}${c.suit[0]}`).join(', ')}]
                </div>
                <div className="text-amber-300">
                  &gt; Hand Score: <strong className="text-emerald-400">{playerScore}</strong> (sum % 10)
                </div>
              </div>

              {/* Category reduction */}
              <div className="pt-2 border-t border-neutral-800/60">
                <span className="text-neutral-500">// 2. getHandCategory(player.hand)</span>
                <div className="text-neutral-200">
                  Category: <span className="text-amber-400 font-bold">{playerCat.type}</span> (Rank: {getCategoryRank(playerCat)})
                </div>
                <div className="text-neutral-200">
                  Deng Multiplier: <span className="text-cyan-400 font-bold">{playerDeng}x</span>
                </div>
              </div>

              {/* Dealer reduction */}
              <div className="pt-2 border-t border-neutral-800/60">
                <span className="text-neutral-500">// 3. calculateScore(dealer.hand)</span>
                <div className="text-neutral-200">
                  Cards: [{inspectedState.dealer.hand.cards.map(c => `${c.value}${c.suit[0]}`).join(', ')}]
                </div>
                <div className="text-neutral-200">
                  Score: <strong className="text-emerald-400">{dealerScore}</strong> | Category: <span className="text-amber-400">{dealerCat.type}</span> | Deng: {dealerDeng}x
                </div>
              </div>

              {/* Dealer automated logic */}
              <div className="pt-2 border-t border-neutral-800/60">
                <span className="text-neutral-500">// 4. dealerAutomatedTurn rule</span>
                <div className="text-neutral-300">
                  {dealerScore < 5 ? (
                    <span className="text-amber-400">Score ({dealerScore}) &lt; 5 &rarr; Dealer MUST DRAW 3rd card</span>
                  ) : (
                    <span className="text-emerald-400">Score ({dealerScore}) &ge; 5 &rarr; Dealer STAYS</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400">
              <strong className="text-neutral-200">FP Design Note:</strong> No global variables or external state are accessed during these calculations. Given the same card sequence, output is guaranteed to be 100% reproducible.
            </div>
          </div>
        )}

        {activeTab === 'state_json' && (
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 font-mono text-[11px] overflow-x-auto text-emerald-400 max-h-72">
            <pre>{JSON.stringify(inspectedState, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
