/**
 * POKDENG CORE - Strictly adhering to Functional Programming (FP) Principles.
 * 
 * DESIGN PARADIGM: "Functional Core, Imperative Shell"
 * - The "Functional Core" comprises pure functions, type definitions, and immutable state updates.
 * - The "Imperative Shell" handles side effects such as I/O reading/writing and random shuffling.
 */

// ============================================================================
// 1. DATA TYPES AND INTERFACES (Strong Typing & Immutability)
// ============================================================================

export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type FaceValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  readonly suit: Suit;
  readonly value: FaceValue;
}

export interface Hand {
  readonly cards: readonly Card[];
}

export interface Player {
  readonly name: string;
  readonly hand: Hand;
  readonly isDealer: boolean;
}

export type GamePhase = 'Dealing' | 'PlayerTurn' | 'DealerTurn' | 'Showdown';

export interface GameState {
  readonly deck: readonly Card[];
  readonly player: Player;
  readonly dealer: Player;
  readonly phase: GamePhase;
  readonly winner?: string;
  readonly reason?: string;
}

export type HandCategory =
  | { readonly type: 'Pok9' }
  | { readonly type: 'Pok8' }
  | { readonly type: 'Tong'; readonly value: FaceValue }
  | { readonly type: 'SamLueang' }
  | { readonly type: 'Normal'; readonly score: number };

export type DengMultiplier = 1 | 2 | 3;

// ============================================================================
// 2. FUNCTIONAL CORE (Pure Functions with zero side effects)
// ============================================================================

/**
 * Pure Function: Calculates the numeric value of a single card.
 * Rule: J, Q, K, 10 are worth 0. Ace is 1. Others are face value.
 */
export const getCardValue = (card: Card): number => {
  switch (card.value) {
    case 'A': return 1;
    case '10':
    case 'J':
    case 'Q':
    case 'K': return 0;
    default: return parseInt(card.value, 10);
  }
};

/**
 * Pure Function: Computes the basic score (0-9) of a hand using modulo 10.
 * FP Concept: Declarative reduction (reduce) instead of imperative for-loops.
 */
export const calculateScore = (hand: Hand): number => {
  const sum = hand.cards.reduce((acc, card) => acc + getCardValue(card), 0);
  return sum % 10;
};

/**
 * Pure Function: Determines if a hand is a "Pok" (initial 2-card hand of 8 or 9).
 */
export const isPok = (hand: Hand): boolean => {
  if (hand.cards.length !== 2) return false;
  const score = calculateScore(hand);
  return score === 8 || score === 9;
};

/**
 * Pure Function: Identifies the category of the hand (Pok, Tong, Sam Lueang, Normal).
 * Uses pattern-matching style rules based on hand state.
 */
export const getHandCategory = (hand: Hand): HandCategory => {
  const score = calculateScore(hand);

  // Poks are only possible with exactly 2 cards
  if (hand.cards.length === 2) {
    if (score === 9) return { type: 'Pok9' };
    if (score === 8) return { type: 'Pok8' };
  }

  // Special 3-card hands
  if (hand.cards.length === 3) {
    const [c1, c2, c3] = hand.cards;
    
    // Tong (Three of a kind)
    if (c1.value === c2.value && c2.value === c3.value) {
      return { type: 'Tong', value: c1.value };
    }
    
    // Sam Lueang (Three face cards J, Q, K)
    const isFace = (c: Card) => ['J', 'Q', 'K'].includes(c.value);
    if (isFace(c1) && isFace(c2) && isFace(c3)) {
      return { type: 'SamLueang' };
    }
  }

  return { type: 'Normal', score };
};

/**
 * Pure Function: Calculates the Deng multiplier (1, 2, or 3).
 * - 2 Deng: 2 cards with matching suits OR matching values.
 * - 3 Deng: 3 cards with matching suits.
 */
export const calculateDeng = (hand: Hand): DengMultiplier => {
  const cards = hand.cards;
  if (cards.length === 2) {
    const [c1, c2] = cards;
    if (c1.suit === c2.suit || c1.value === c2.value) {
      return 2;
    }
  } else if (cards.length === 3) {
    const [c1, c2, c3] = cards;
    if (c1.suit === c2.suit && c2.suit === c3.suit) {
      return 3;
    }
  }
  return 1;
};

/**
 * Pure Function: Maps a hand category to a ranking score for sorting/comparing.
 */
export const getCategoryRank = (cat: HandCategory): number => {
  switch (cat.type) {
    case 'Pok9': return 5;
    case 'Pok8': return 4;
    case 'Tong': return 3;
    case 'SamLueang': return 2;
    case 'Normal': return 1;
  }
};

/**
 * Pure Function: Compares two hands.
 * Returns: Positive number if hand1 wins, negative if hand2 wins, 0 if draw.
 */
export const compareHands = (hand1: Hand, hand2: Hand): number => {
  const cat1 = getHandCategory(hand1);
  const cat2 = getHandCategory(hand2);
  const r1 = getCategoryRank(cat1);
  const r2 = getCategoryRank(cat2);

  if (r1 !== r2) {
    return r1 - r2;
  }

  // If both are Normal, compare the scores modulo 10
  if (cat1.type === 'Normal' && cat2.type === 'Normal') {
    return cat1.score - cat2.score;
  }

  // Within the same special category (e.g. both Pok 9, or both Tong), it's a draw.
  return 0;
};

/**
 * Pure Function: Generates a standard deck of 52 cards.
 * FP Concept: Pure declarative generation (mapping suit & value combinations).
 */
export const createDeck = (): readonly Card[] => {
  const suits: readonly Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const values: readonly FaceValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  return suits.flatMap(suit =>
    values.map(value => ({ suit, value }))
  );
};

/**
 * Pure Function: Deals initial 2 cards to each player and transitions the state.
 * Deals sequentially: Player 1st card, Dealer 1st, Player 2nd, Dealer 2nd.
 */
export const initializeGame = (shuffledDeck: readonly Card[]): GameState => {
  const p1 = shuffledDeck[0];
  const d1 = shuffledDeck[1];
  const p2 = shuffledDeck[2];
  const d2 = shuffledDeck[3];
  const remainingDeck = shuffledDeck.slice(4);

  const player: Player = {
    name: 'Player',
    hand: { cards: [p1, p2] },
    isDealer: false,
  };

  const dealer: Player = {
    name: 'Dealer',
    hand: { cards: [d1, d2] },
    isDealer: true,
  };

  // Immediate Pok Check (Rule: If player or dealer has Pok, game ends immediately)
  if (isPok(player.hand) || isPok(dealer.hand)) {
    return determineWinner({
      deck: remainingDeck,
      player,
      dealer,
      phase: 'Showdown',
    });
  }

  return {
    deck: remainingDeck,
    player,
    dealer,
    phase: 'PlayerTurn',
  };
};

/**
 * Pure Function: Progresses the game state when the player decides to draw a card.
 */
export const drawPlayerCard = (state: GameState): GameState => {
  if (state.phase !== 'PlayerTurn') return state;

  const nextCard = state.deck[0];
  const remainingDeck = state.deck.slice(1);

  const updatedPlayer: Player = {
    ...state.player,
    hand: { cards: [...state.player.hand.cards, nextCard] },
  };

  return {
    ...state,
    deck: remainingDeck,
    player: updatedPlayer,
    phase: 'DealerTurn',
  };
};

/**
 * Pure Function: Progresses the game state when the player decides to stay.
 */
export const stayPlayer = (state: GameState): GameState => {
  if (state.phase !== 'PlayerTurn') return state;

  return {
    ...state,
    phase: 'DealerTurn',
  };
};

/**
 * Pure Function: Dealer automated rules.
 * Rule: Dealer draws a 3rd card if initial score is less than 5.
 */
export const dealerAutomatedTurn = (state: GameState): GameState => {
  if (state.phase !== 'DealerTurn') return state;

  const dealerScore = calculateScore(state.dealer.hand);

  if (dealerScore < 5) {
    const nextCard = state.deck[0];
    const remainingDeck = state.deck.slice(1);

    const updatedDealer: Player = {
      ...state.dealer,
      hand: { cards: [...state.dealer.hand.cards, nextCard] },
    };

    return determineWinner({
      ...state,
      deck: remainingDeck,
      dealer: updatedDealer,
      phase: 'Showdown',
    });
  }

  // Dealer stays
  return determineWinner({
    ...state,
    phase: 'Showdown',
  });
};

/**
 * Pure Function: Compares hands and returns a final GameState indicating winner & reason.
 */
export const determineWinner = (state: GameState): GameState => {
  const comparison = compareHands(state.player.hand, state.dealer.hand);
  const playerCat = getHandCategory(state.player.hand);
  const dealerCat = getHandCategory(state.dealer.hand);

  const getCategoryDescription = (cat: HandCategory): string => {
    switch (cat.type) {
      case 'Pok9': return 'Pok 9';
      case 'Pok8': return 'Pok 8';
      case 'Tong': return `Tong (3 of a Kind of ${cat.value}s)`;
      case 'SamLueang': return 'Sam Lueang (3 Face Cards)';
      case 'Normal': return `${cat.score} points`;
    }
  };

  const pDesc = getCategoryDescription(playerCat);
  const dDesc = getCategoryDescription(dealerCat);

  const pDeng = calculateDeng(state.player.hand);
  const dDeng = calculateDeng(state.dealer.hand);

  const pDengStr = pDeng > 1 ? ` (${pDeng} Deng)` : '';
  const dDengStr = dDeng > 1 ? ` (${dDeng} Deng)` : '';

  if (comparison > 0) {
    return {
      ...state,
      winner: 'Player',
      reason: `Player wins with ${pDesc}${pDengStr} against Dealer's ${dDesc}${dDengStr}.`,
    };
  } else if (comparison < 0) {
    return {
      ...state,
      winner: 'Dealer',
      reason: `Dealer wins with ${dDesc}${dDengStr} against Player's ${pDesc}${pDengStr}.`,
    };
  } else {
    return {
      ...state,
      winner: 'Draw',
      reason: `It's a draw! Both have ${pDesc}${pDengStr} vs ${dDesc}${dDengStr}.`,
    };
  }
};

// ============================================================================
// 3. UI RENDERING (Pure visual representation functions)
// ============================================================================

export const SUIT_SYMBOLS: Record<Suit, string> = {
  Hearts: '♥',
  Diamonds: '♦',
  Clubs: '♣',
  Spades: '♠',
};

export const ANSI = {
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  GREEN: '\x1b[32m',
  BOLD: '\x1b[1m',
  RESET: '\x1b[0m',
};

export const cardToString = (card: Card): string => {
  const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
  const color = isRed ? ANSI.RED : '';
  return `${color}${card.value}${SUIT_SYMBOLS[card.suit]}${ANSI.RESET}`;
};

export const renderHand = (hand: Hand, hide: boolean = false): string => {
  if (hide) {
    return `[ ${hand.cards.map(() => '??').join(', ')} ]`;
  }
  return `[ ${hand.cards.map(cardToString).join(', ')} ]`;
};

export const renderPlayerSummary = (player: Player, hide: boolean = false): string => {
  const handStr = renderHand(player.hand, hide);
  
  if (hide) {
    return `${ANSI.BOLD}${player.name}'s Hand:${ANSI.RESET} ${handStr} | Score: Hidden`;
  }

  const cat = getHandCategory(player.hand);
  const deng = calculateDeng(player.hand);
  const dengStr = deng > 1 ? ` (${deng} Deng)` : '';

  let catStr = '';
  switch (cat.type) {
    case 'Pok9': catStr = `${ANSI.BOLD}${ANSI.RED}Pok 9${ANSI.RESET}`; break;
    case 'Pok8': catStr = `${ANSI.BOLD}${ANSI.YELLOW}Pok 8${ANSI.RESET}`; break;
    case 'Tong': catStr = `${ANSI.BOLD}${ANSI.GREEN}Tong (3 of a Kind)${ANSI.RESET}`; break;
    case 'SamLueang': catStr = `${ANSI.BOLD}${ANSI.YELLOW}Sam Lueang (3 Face Cards)${ANSI.RESET}`; break;
    case 'Normal': catStr = `${cat.score} Points`; break;
  }

  return `${ANSI.BOLD}${player.name}'s Hand:${ANSI.RESET} ${handStr} | Score: ${catStr}${dengStr}`;
};

// ============================================================================
// 4. IMPURE UTILITIES
// ============================================================================

/**
 * Impure Function: Shuffles a deck using Fisher-Yates.
 * Relies on Math.random() (non-deterministic side effect).
 */
export const impureShuffleDeck = (deck: readonly Card[]): readonly Card[] => {
  const mutableDeck = [...deck];
  for (let i = mutableDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mutableDeck[i], mutableDeck[j]] = [mutableDeck[j], mutableDeck[i]];
  }
  return mutableDeck;
};
