import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  GameState,
  createDeck,
  impureShuffleDeck,
  initializeGame,
  drawPlayerCard,
  stayPlayer,
  dealerAutomatedTurn,
  calculateScore,
  calculateDeng,
  getHandCategory,
  renderPlayerSummary,
  ANSI,
} from './core/pokdengCore';
import { PlayingCard } from './components/PlayingCard';
import { Chip } from './components/Chip';
import { FpInspector } from './components/FpInspector';
import { TerminalView } from './components/TerminalView';
import { RulesModal } from './components/RulesModal';
import { sounds } from './utils/audio';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  Coins,
  Cpu,
  Terminal,
  Play,
  ArrowRight,
  ShieldAlert,
  Home,
  PlusCircle,
  Zap,
  Hand,
  Sliders,
  X,
} from 'lucide-react';

export type AppScreen = 'menu' | 'table';

export const App: React.FC = () => {
  // Navigation: 'menu' (หน้าเมนูหลัก) vs 'table' (หน้าเล่นเกมแบบครบวงจร)
  const [screen, setScreen] = useState<AppScreen>('menu');

  // Round phase within table:
  // 'betting' (วางเดิมพัน) -> 'playing' (แจกไพ่/เลือกจั่ว/อยู่) -> 'showdown' (เปิดไพ่ตัดสิน) -> 'result' (สรุปผล)
  const [tablePhase, setTablePhase] = useState<'betting' | 'playing' | 'showdown' | 'result'>('betting');

  // Player Financials & Stats
  const [balance, setBalance] = useState<number>(1000);
  const [currentBet, setCurrentBet] = useState<number>(50);
  const [lastRoundResult, setLastRoundResult] = useState<{
    payout: number;
    winner: string;
    reason: string;
    playerDeng: number;
    dealerDeng: number;
  } | null>(null);

  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    bestStreak: 0,
    biggestWin: 0,
    totalRounds: 0,
  });

  // Settings & Modals
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showFpInspector, setShowFpInspector] = useState<boolean>(false);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);

  // Core Game State and Immutable History
  const [history, setHistory] = useState<GameState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Flip Animation States
  const [playerFlipped, setPlayerFlipped] = useState<boolean[]>([false, false]);
  const [dealerFlipped, setDealerFlipped] = useState<boolean[]>([false, false]);

  const timersRef = useRef<number[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Sound synchronization
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  const currentState: GameState | null = history[historyIndex] ?? null;

  // Terminal logging helper
  const logToTerminal = useCallback((text: string) => {
    setTerminalLogs((prev) => [...prev, text]);
  }, []);

  // Compute financial changes & stats
  const finalizeRoundOutcome = useCallback((finalState: GameState, betAmount: number) => {
    const pDeng = calculateDeng(finalState.player.hand);
    const dDeng = calculateDeng(finalState.dealer.hand);

    let netPayout = 0;
    if (finalState.winner === 'Player') {
      netPayout = betAmount * pDeng;
      setBalance((b) => b + netPayout);
      setStats((s) => {
        const nextStreak = s.streak + 1;
        return {
          ...s,
          wins: s.wins + 1,
          totalRounds: s.totalRounds + 1,
          streak: nextStreak,
          bestStreak: Math.max(s.bestStreak, nextStreak),
          biggestWin: Math.max(s.biggestWin, netPayout),
        };
      });

      if (getHandCategory(finalState.player.hand).type === 'Pok9') {
        sounds.playPok();
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
      } else {
        sounds.playWin();
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      }
    } else if (finalState.winner === 'Dealer') {
      netPayout = -betAmount * dDeng;
      setBalance((b) => Math.max(0, b - betAmount * dDeng));
      setStats((s) => ({
        ...s,
        losses: s.losses + 1,
        totalRounds: s.totalRounds + 1,
        streak: 0,
      }));
      sounds.playLose();
    } else {
      setStats((s) => ({
        ...s,
        draws: s.draws + 1,
        totalRounds: s.totalRounds + 1,
      }));
    }

    setLastRoundResult({
      payout: netPayout,
      winner: finalState.winner ?? 'Draw',
      reason: finalState.reason ?? '',
      playerDeng: pDeng,
      dealerDeng: dDeng,
    });

    logToTerminal(`${ANSI.BOLD}${ANSI.GREEN}==========================================${ANSI.RESET}`);
    logToTerminal(`${ANSI.BOLD}RESULT: ${finalState.reason}${ANSI.RESET}`);
    if (netPayout > 0) {
      logToTerminal(`${ANSI.BOLD}${ANSI.GREEN}Payout: +${netPayout} chips (${pDeng} Deng)${ANSI.RESET}`);
    } else if (netPayout < 0) {
      logToTerminal(`${ANSI.BOLD}${ANSI.RED}Loss: ${netPayout} chips (${dDeng} Deng)${ANSI.RESET}`);
    } else {
      logToTerminal(`${ANSI.BOLD}Tie: Bet returned${ANSI.RESET}`);
    }
    logToTerminal(`${ANSI.BOLD}${ANSI.GREEN}==========================================${ANSI.RESET}\n`);
  }, [logToTerminal]);

  // Deal cards with smooth auto-reveal
  const handleDealHand = useCallback((betAmount: number = currentBet) => {
    clearAllTimers();
    let effectiveBet = betAmount;
    if (effectiveBet > balance) {
      effectiveBet = balance > 0 ? balance : 50;
      setCurrentBet(effectiveBet);
    }
    if (balance <= 0) {
      setBalance(500);
      effectiveBet = 50;
      setCurrentBet(50);
    }

    sounds.playCardDeal();

    // 1. Shuffling (Impure Shell)
    const deck = impureShuffleDeck(createDeck());

    // 2. Pure Core: Initialize Game
    const initialState = initializeGame(deck);

    setHistory([initialState]);
    setHistoryIndex(0);
    setPlayerFlipped([false, false]);
    setDealerFlipped([false, false]);
    setTablePhase('playing');
    setLastRoundResult(null);

    logToTerminal(`\n${ANSI.BOLD}${ANSI.GREEN}==========================================${ANSI.RESET}`);
    logToTerminal(`${ANSI.BOLD}${ANSI.GREEN}       NEW ROUND (Bet: ${effectiveBet})       ${ANSI.RESET}`);
    logToTerminal(`${ANSI.BOLD}${ANSI.GREEN}==========================================${ANSI.RESET}`);
    logToTerminal(renderPlayerSummary(initialState.player));

    // Staggered Flip for Player's cards
    const t1 = window.setTimeout(() => {
      sounds.playCardDeal();
      setPlayerFlipped([true, false]);
    }, 200);

    const t2 = window.setTimeout(() => {
      sounds.playCardDeal();
      setPlayerFlipped([true, true]);

      // If initial Pok (8 or 9), proceed directly to showdown reveal
      if (initialState.phase === 'Showdown') {
        logToTerminal(`${ANSI.BOLD}${ANSI.RED}⚡ POK DETECTED!${ANSI.RESET}`);
        setTablePhase('showdown');

        const t3 = window.setTimeout(() => {
          sounds.playCardDeal();
          setDealerFlipped([true, false]);
        }, 450);

        const t4 = window.setTimeout(() => {
          sounds.playCardDeal();
          setDealerFlipped([true, true]);
          setTablePhase('result');
          finalizeRoundOutcome(initialState, effectiveBet);
        }, 850);

        timersRef.current.push(t3, t4);
      }
    }, 450);

    timersRef.current.push(t1, t2);
  }, [balance, currentBet, finalizeRoundOutcome, logToTerminal]);

  // Player action: Draw 3rd Card
  const handlePlayerDraw = () => {
    if (!currentState || currentState.phase !== 'PlayerTurn') return;
    clearAllTimers();
    sounds.playCardDeal();
    logToTerminal(`> Player chooses to DRAW 3rd card.`);

    const afterPlayerDraw = drawPlayerCard(currentState);
    const finalShowdown = dealerAutomatedTurn(afterPlayerDraw);

    const newHistory = [...history, afterPlayerDraw, finalShowdown];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Player 3rd card flips open
    setPlayerFlipped([true, true, true]);
    setTablePhase('showdown');

    // Reveal dealer cards sequentially
    const dealerCardsCount = finalShowdown.dealer.hand.cards.length;
    const t1 = window.setTimeout(() => {
      sounds.playCardDeal();
      setDealerFlipped([true, false, false]);
    }, 350);

    const t2 = window.setTimeout(() => {
      sounds.playCardDeal();
      setDealerFlipped([true, true, false]);
      if (dealerCardsCount === 2) {
        setTablePhase('result');
        finalizeRoundOutcome(finalShowdown, currentBet);
      }
    }, 750);

    timersRef.current.push(t1, t2);

    if (dealerCardsCount > 2) {
      const t3 = window.setTimeout(() => {
        sounds.playCardDeal();
        setDealerFlipped([true, true, true]);
        setTablePhase('result');
        finalizeRoundOutcome(finalShowdown, currentBet);
      }, 1150);
      timersRef.current.push(t3);
    }
  };

  // Player action: Stay
  const handlePlayerStay = () => {
    if (!currentState || currentState.phase !== 'PlayerTurn') return;
    clearAllTimers();
    sounds.playChip();
    logToTerminal(`> Player chooses to STAY.`);

    const afterStay = stayPlayer(currentState);
    const finalShowdown = dealerAutomatedTurn(afterStay);

    const newHistory = [...history, afterStay, finalShowdown];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setTablePhase('showdown');

    // Reveal dealer cards sequentially
    const dealerCardsCount = finalShowdown.dealer.hand.cards.length;
    const t1 = window.setTimeout(() => {
      sounds.playCardDeal();
      setDealerFlipped([true, false, false]);
    }, 300);

    const t2 = window.setTimeout(() => {
      sounds.playCardDeal();
      setDealerFlipped([true, true, false]);
      if (dealerCardsCount === 2) {
        setTablePhase('result');
        finalizeRoundOutcome(finalShowdown, currentBet);
      }
    }, 650);

    timersRef.current.push(t1, t2);

    if (dealerCardsCount > 2) {
      const t3 = window.setTimeout(() => {
        sounds.playCardDeal();
        setDealerFlipped([true, true, true]);
        setTablePhase('result');
        finalizeRoundOutcome(finalShowdown, currentBet);
      }, 1050);
      timersRef.current.push(t3);
    }
  };

  // Manual tap to flip if user wants to peek
  const togglePlayerCard = (i: number) => {
    sounds.playCardDeal();
    setPlayerFlipped((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  const toggleDealerCard = (i: number) => {
    sounds.playCardDeal();
    setDealerFlipped((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  // Free reload when balance is exhausted
  const handleReloadChips = () => {
    sounds.playWin();
    setBalance((b) => b + 1000);
  };

  // Format badges for Player & Dealer hands
  const getHandBadge = (state: GameState, isPlayer: boolean) => {
    const hand = isPlayer ? state.player.hand : state.dealer.hand;
    const cat = getHandCategory(hand);
    const deng = calculateDeng(hand);
    const score = calculateScore(hand);

    switch (cat.type) {
      case 'Pok9':
        return {
          title: 'ป๊อก 9 (Pok 9)',
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/50 shadow-red-500/20',
          deng,
          score,
        };
      case 'Pok8':
        return {
          title: 'ป๊อก 8 (Pok 8)',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20',
          deng,
          score,
        };
      case 'Tong':
        return {
          title: `ตอง ${cat.value} (Tong)`,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20',
          deng,
          score,
        };
      case 'SamLueang':
        return {
          title: 'สามเหลือง (Sam Lueang)',
          badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-yellow-500/20',
          deng,
          score,
        };
      default:
        return {
          title: `${score} แต้ม (${score} Pts)`,
          badgeColor: 'bg-neutral-800 text-neutral-200 border-neutral-700',
          deng,
          score,
        };
    }
  };

  const isPlayerAllFlipped = currentState
    ? currentState.player.hand.cards.every((_, i) => playerFlipped[i])
    : false;

  const isDealerAllFlipped = currentState
    ? currentState.dealer.hand.cards.every((_, i) => dealerFlipped[i])
    : false;

  const playerBadge = currentState ? getHandBadge(currentState, true) : null;
  const dealerBadge = currentState ? getHandBadge(currentState, false) : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950">
      
      {/* ============================================================ */}
      {/* RESPONSIVE TOP BAR (No text truncation on small mobile)      */}
      {/* ============================================================ */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md px-2.5 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => setScreen('menu')}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-md flex items-center justify-center font-cinzel font-black text-neutral-950 text-xs sm:text-sm hover:scale-105 transition cursor-pointer shrink-0"
            title="กลับสู่หน้าเมนูหลัก"
          >
            ป๊อก
          </button>
          <div className="flex items-baseline gap-1 sm:gap-1.5 cursor-pointer" onClick={() => setScreen('menu')}>
            <span className="font-bold text-sm sm:text-base tracking-tight sm:tracking-wide">Pokdeng</span>
            <span className="text-amber-400 text-xs sm:text-sm">ป๊อกเด้ง</span>
          </div>
        </div>

        {/* Center: Chip Counter & Streak */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-neutral-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-neutral-800 text-[11px] sm:text-xs shadow-inner">
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-neutral-400 hidden xs:inline sm:inline">ชิป:</span>
            <span className="font-bold font-mono text-amber-300">{balance.toLocaleString()}</span>
          </div>

          {stats.streak > 1 && (
            <div className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 sm:py-1 rounded-full border border-red-500/30 text-[10px] sm:text-xs text-red-400 font-semibold animate-pulse shrink-0">
              <Flame className="w-3 h-3 text-red-400 shrink-0" />
              <span>{stats.streak} ติด</span>
            </div>
          )}
        </div>

        {/* Right: Action Buttons (Touch-friendly, compact on mobile) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* CLI Terminal Switch */}
          <button
            onClick={() => setShowTerminal((v) => !v)}
            className={`p-1.5 sm:p-2 rounded-xl text-xs transition border flex items-center gap-1 cursor-pointer shrink-0 ${
              showTerminal
                ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border-neutral-800'
            }`}
            title="คอนโซล CLI"
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline font-mono">CLI</span>
          </button>

          {/* FP Core Inspector Switch */}
          <button
            onClick={() => setShowFpInspector((v) => !v)}
            className={`p-1.5 sm:p-2 rounded-xl text-xs transition border flex items-center gap-1 cursor-pointer shrink-0 ${
              showFpInspector
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border-neutral-800'
            }`}
            title="ตรวจสอบ Pure Functional Core"
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">FP</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer shrink-0"
            title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          {/* Rules Guide */}
          <button
            onClick={() => setShowRules(true)}
            className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer shrink-0"
            title="กติกาการเล่น"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER (Responsive across Phone, Tablet, Laptop)      */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto w-full">
          
          {/* ============================================================ */}
          {/* SCREEN 1: เมนูหลัก (MAIN MENU)                               */}
          {/* ============================================================ */}
          {screen === 'menu' && (
            <div className="w-full max-w-lg bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-7 md:p-9 shadow-2xl backdrop-blur-md flex flex-col items-center text-center animate-fade-in relative overflow-hidden my-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/20 mb-3 flex items-center justify-center">
                <div className="w-full h-full bg-neutral-950 rounded-xl flex items-center justify-center">
                  <span className="font-cinzel text-2xl sm:text-3xl font-black text-amber-400">ป๊อก</span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-neutral-100">
                POKDENG <span className="text-amber-400">ป๊อกเด้ง</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-sm px-2">
                เกมไพ่ป๊อกเด้งไทยแบบต้นตำรับ เล่นง่าย โหลดไว ปรับขนาดหน้าจอรองรับทุกอุปกรณ์
              </p>

              <div className="w-full bg-neutral-950/70 border border-neutral-800 rounded-2xl p-3 sm:p-4 my-4 sm:my-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-[10px] sm:text-xs text-neutral-400">ยอดชิปของคุณ</div>
                    <div className="text-base sm:text-xl font-black font-mono text-amber-300">
                      {balance.toLocaleString()} ชิป
                    </div>
                  </div>
                </div>

                {balance <= 50 ? (
                  <button
                    onClick={handleReloadChips}
                    className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>รับชิปฟรี</span>
                  </button>
                ) : (
                  <span className="text-[10px] sm:text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                    พร้อมเดิมพัน
                  </span>
                )}
              </div>

              {/* 1-Click Play Button */}
              <button
                onClick={() => {
                  sounds.playChip();
                  setScreen('table');
                  setTablePhase('betting');
                }}
                className="w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-2xl font-black text-sm sm:text-base md:text-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 shadow-xl shadow-amber-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
                <span>เข้าสู่โต๊ะเล่น (Play Now)</span>
              </button>

              <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                <button
                  onClick={() => setShowRules(true)}
                  className="py-2.5 px-2 sm:px-3 rounded-xl font-semibold text-xs sm:text-sm bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>กติกาและแต้ม</span>
                </button>
                <button
                  onClick={() => setShowTerminal(true)}
                  className="py-2.5 px-2 sm:px-3 rounded-xl font-semibold text-xs sm:text-sm bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>คอนโซล CLI</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="w-full mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-neutral-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-neutral-500">ชนะ / แพ้</div>
                  <div className="font-bold text-neutral-200 mt-0.5">{stats.wins} / {stats.losses}</div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500">อัตราชนะ</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {stats.totalRounds > 0 ? `${Math.round((stats.wins / stats.totalRounds) * 100)}%` : '0%'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500">ชนะสูงสุด</div>
                  <div className="font-bold text-amber-300 mt-0.5">+{stats.biggestWin}</div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: หน้าโต๊ะไพ่ RESPONSIVE ไม่มีการทับซ้อน                */}
          {/* ============================================================ */}
          {screen === 'table' && (
            <div className="w-full max-w-4xl felt-bg table-rim rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 md:p-6 flex flex-col justify-between min-h-[490px] sm:min-h-[550px] md:min-h-[620px] relative border border-emerald-600/30 animate-fade-in my-auto">
              
              {/* Table Top Sub-bar */}
              <div className="flex items-center justify-between border-b border-emerald-700/30 pb-2 text-xs">
                <button
                  onClick={() => setScreen('menu')}
                  className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-neutral-900/60 transition cursor-pointer shrink-0"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="text-[11px] sm:text-xs">เมนูหลัก</span>
                </button>

                {/* Status Indicator */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-950/60 border border-neutral-700/50">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    tablePhase === 'result' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`} />
                  <span className="text-neutral-200 text-[10px] sm:text-xs font-medium whitespace-nowrap">
                    {tablePhase === 'betting' && 'เลือกชิปแล้วกดแจกไพ่'}
                    {tablePhase === 'playing' && 'ตาคุณ (จั่ว หรือ อยู่)'}
                    {tablePhase === 'showdown' && 'กำลังเปิดไพ่...'}
                    {tablePhase === 'result' && 'ผลการตัดสิน'}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-neutral-950/70 px-2 sm:px-2.5 py-1 rounded-full border border-neutral-700 text-[11px] sm:text-xs shrink-0">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span className="text-neutral-400 hidden xs:inline">เดิมพัน:</span>
                  <strong className="text-amber-300 font-mono">{currentBet}</strong>
                </div>
              </div>

              {/* DEALER SECTION (Always fits comfortably) */}
              <div className="flex flex-col items-center mt-1.5 sm:mt-2">
                <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2 bg-neutral-950/70 backdrop-blur-md px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-neutral-700/80 shadow-md">
                  <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-[11px] sm:text-xs text-neutral-200 whitespace-nowrap">
                    DEALER (เจ้ามือ)
                  </span>
                  {isDealerAllFlipped && dealerBadge && (
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${dealerBadge.badgeColor} whitespace-nowrap`}>
                      {dealerBadge.title} {dealerBadge.deng > 1 ? `(${dealerBadge.deng} เด้ง)` : ''}
                    </span>
                  )}
                </div>

                {/* Dealer Cards Container */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 min-h-[110px] sm:min-h-[130px] md:min-h-[150px] w-full">
                  {currentState ? (
                    currentState.dealer.hand.cards.map((card, i) => (
                      <PlayingCard
                        key={i}
                        card={card}
                        hidden={!dealerFlipped[i]}
                        delayIndex={i}
                        size="md"
                        interactive={!dealerFlipped[i]}
                        onClick={() => toggleDealerCard(i)}
                        highlight={isDealerAllFlipped && (dealerBadge?.title.includes('ป๊อก') || dealerBadge?.title.includes('ตอง'))}
                      />
                    ))
                  ) : (
                    <>
                      <PlayingCard hidden size="md" />
                      <PlayingCard hidden size="md" />
                    </>
                  )}
                </div>
              </div>

              {/* TABLE CENTER: Dynamic Overlays & Verdicts (NO overlap) */}
              <div className="my-1.5 sm:my-2 flex flex-col items-center justify-center relative min-h-[75px] sm:min-h-[95px] w-full px-2">
                {/* Casino Watermark */}
                <div className="absolute pointer-events-none select-none flex flex-col items-center opacity-10">
                  <span className="font-cinzel text-2xl sm:text-4xl md:text-5xl font-black text-amber-300 tracking-widest">
                    POKDENG
                  </span>
                </div>

                {/* RESULT OVERLAY BANNER */}
                {tablePhase === 'result' && currentState && (
                  <div className="z-20 animate-fade-in bg-neutral-950/95 border-2 border-amber-400/90 rounded-2xl p-2.5 sm:p-4 md:px-6 shadow-2xl text-center backdrop-blur-md max-w-[92vw] sm:max-w-md w-full">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-800 text-[10px] sm:text-xs text-neutral-400 font-mono">
                      <span>VERDICT</span>
                      {lastRoundResult && (
                        <span className={`font-bold ${lastRoundResult.payout > 0 ? 'text-emerald-400' : lastRoundResult.payout < 0 ? 'text-red-400' : 'text-amber-300'}`}>
                          {lastRoundResult.payout > 0 ? `+${lastRoundResult.payout} ชิป` : lastRoundResult.payout < 0 ? `${lastRoundResult.payout} ชิป` : 'เสมอ (คืนทุน)'}
                        </span>
                      )}
                    </div>

                    <div className="text-base sm:text-lg md:text-xl font-black font-cinzel text-neutral-100 flex items-center justify-center gap-1.5 mt-1">
                      {currentState.winner === 'Player' && (
                        <>
                          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                          <span className="text-emerald-400">YOU WIN! (คุณชนะ)</span>
                        </>
                      )}
                      {currentState.winner === 'Dealer' && (
                        <span className="text-red-400">DEALER WINS (เจ้ามือชนะ)</span>
                      )}
                      {currentState.winner === 'Draw' && (
                        <span className="text-amber-300">DRAW! (เสมอกัน)</span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-neutral-300 mt-1 line-clamp-2 px-1">
                      {currentState.reason}
                    </p>

                    {/* 1-CLICK ACTION BUTTONS (Fully responsive, no text clipping) */}
                    <div className="mt-2.5 flex items-center justify-center gap-2 w-full">
                      <button
                        onClick={() => handleDealHand(currentBet)}
                        className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                        <span>เล่นต่อ ({currentBet})</span>
                      </button>

                      <button
                        onClick={() => setTablePhase('betting')}
                        className="py-2 sm:py-2.5 px-2.5 sm:px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs sm:text-sm rounded-xl border border-neutral-700 transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Sliders className="w-3.5 h-3.5 inline mr-1" />
                        <span>ปรับเดิมพัน</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Showdown Tension Indicator */}
                {tablePhase === 'showdown' && (
                  <div className="z-10 bg-neutral-950/85 border border-amber-500/50 px-3.5 py-1.5 rounded-xl text-xs text-amber-300 flex items-center gap-1.5 shadow-xl backdrop-blur-md animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    <span>กำลังเปิดลุ้นแต้มไพ่...</span>
                  </div>
                )}
              </div>

              {/* PLAYER SECTION */}
              <div className="flex flex-col items-center">
                {/* Player Cards Container */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 min-h-[110px] sm:min-h-[130px] md:min-h-[150px] w-full">
                  {currentState ? (
                    currentState.player.hand.cards.map((card, i) => (
                      <PlayingCard
                        key={i}
                        card={card}
                        hidden={!playerFlipped[i]}
                        delayIndex={i}
                        size="md"
                        interactive={!playerFlipped[i]}
                        onClick={() => togglePlayerCard(i)}
                        highlight={
                          isPlayerAllFlipped &&
                          (playerBadge?.title.includes('ป๊อก') ||
                            playerBadge?.title.includes('ตอง') ||
                            (playerBadge?.deng ?? 1) > 1)
                        }
                      />
                    ))
                  ) : (
                    <>
                      <PlayingCard hidden size="md" />
                      <PlayingCard hidden size="md" />
                    </>
                  )}
                </div>

                {/* Player Status Badge */}
                <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 bg-neutral-950/70 backdrop-blur-md px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-neutral-700/80 shadow-md">
                  <span className="font-semibold text-[11px] sm:text-xs text-neutral-200 whitespace-nowrap">
                    PLAYER (คุณ)
                  </span>
                  {isPlayerAllFlipped && playerBadge && (
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full border shadow-sm ${playerBadge.badgeColor} whitespace-nowrap`}>
                        {playerBadge.title}
                      </span>
                      {playerBadge.deng > 1 && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">
                          {playerBadge.deng} เด้ง
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================ */}
              {/* BOTTOM CONTROLS (Responsive wrap, no cutoffs)                */}
              {/* ============================================================ */}
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-emerald-600/30 flex flex-col sm:flex-row items-center justify-between gap-2">
                
                {/* STAGE A: BETTING PHASE */}
                {tablePhase === 'betting' && (
                  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
                    {/* Chips selector (horizontal scrollable on ultra-narrow phones) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 justify-center overflow-x-auto max-w-full py-0.5">
                      <span className="text-[11px] sm:text-xs text-neutral-300 font-semibold mr-0.5 whitespace-nowrap">ชิป:</span>
                      {[10, 50, 100, 500, 1000].map((val) => (
                        <Chip
                          key={val}
                          value={val}
                          isSelected={currentBet === val}
                          disabled={val > balance}
                          onClick={() => {
                            sounds.playChip();
                            setCurrentBet(val);
                          }}
                        />
                      ))}
                    </div>

                    {/* Deal Button */}
                    <button
                      onClick={() => handleDealHand(currentBet)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                      <span>แจกไพ่ ({currentBet})</span>
                    </button>
                  </div>
                )}

                {/* STAGE B: PLAYING PHASE (Draw vs Stay) */}
                {tablePhase === 'playing' && currentState?.phase === 'PlayerTurn' && (
                  <div className="w-full flex items-center justify-between gap-2">
                    <div className="text-[11px] sm:text-xs text-neutral-300 shrink-0">
                      แต้ม: <strong className="text-amber-400 font-bold">{calculateScore(currentState.player.hand)}</strong>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <button
                        onClick={handlePlayerDraw}
                        className="flex-1 sm:flex-none px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>จั่วใบที่ 3</span>
                      </button>

                      <button
                        onClick={handlePlayerStay}
                        className="flex-1 sm:flex-none px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>อยู่ (Stay)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STAGE C: SHOWDOWN / RESULT PHASE */}
                {(tablePhase === 'showdown' || tablePhase === 'result') && (
                  <div className="w-full flex items-center justify-between gap-2">
                    <div className="text-[10px] sm:text-xs text-neutral-400">
                      เดิมพัน: <strong className="text-neutral-200">{currentBet} ชิป</strong>
                    </div>

                    <button
                      onClick={() => handleDealHand(currentBet)}
                      className="px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>แจกตาถัดไป</span>
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* FP Inspector Drawer (Responsive on desktop / full-screen drawer on mobile) */}
        {showFpInspector && currentState && (
          <div className="w-full lg:w-96 p-2.5 sm:p-4 border-t lg:border-t-0 lg:border-l border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md overflow-hidden flex flex-col z-30 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 lg:hidden">
              <span className="font-bold text-xs text-neutral-200">FP Core Inspector</span>
              <button onClick={() => setShowFpInspector(false)} className="p-1 text-neutral-400 hover:text-neutral-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <FpInspector
              history={history}
              currentStepIndex={historyIndex}
              onSelectStep={(idx) => setHistoryIndex(idx)}
              liveState={currentState}
            />
          </div>
        )}

        {/* Retro Terminal Simulator Modal */}
        {showTerminal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-neutral-950/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl h-[80vh] flex flex-col">
              <TerminalView
                logs={terminalLogs}
                waitingInput={currentState?.phase === 'PlayerTurn' && tablePhase === 'playing'}
                onCommand={(cmd) => {
                  if (cmd === 'y') handlePlayerDraw();
                  if (cmd === 'n') handlePlayerStay();
                }}
              />
              <button
                onClick={() => setShowTerminal(false)}
                className="mt-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold self-center px-6 transition cursor-pointer"
              >
                ปิดหน้าต่าง CLI
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Rules & Guide Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};

export default App;
