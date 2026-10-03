/**
 * POKDENG - A Console-Based Thai Card Game in TypeScript
 * Strictly adhering to Functional Programming (FP) Principles.
 * 
 * Re-exports the Functional Core from src/core/pokdengCore.ts
 * and provides the Terminal CLI shell.
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

export * from './src/core/pokdengCore.js';
import {
  ANSI,
  createDeck,
  dealerAutomatedTurn,
  drawPlayerCard,
  impureShuffleDeck,
  initializeGame,
  renderPlayerSummary,
  stayPlayer,
} from './src/core/pokdengCore.js';

/**
 * Main game execution loop handling impure I/O state transitions.
 */
export const runGame = async (rl: readline.Interface): Promise<void> => {
  console.clear();
  console.log(`${ANSI.BOLD}${ANSI.GREEN}==========================================${ANSI.RESET}`);
  console.log(`${ANSI.BOLD}${ANSI.GREEN}       WELCOME TO FUNCTIONAL POKDENG      ${ANSI.RESET}`);
  console.log(`${ANSI.BOLD}${ANSI.GREEN}==========================================${ANSI.RESET}\n`);

  // Side Effect 1: Random Shuffling
  const shuffledDeck = impureShuffleDeck(createDeck());

  // Pure Entry: Initialize starting game state
  let state = initializeGame(shuffledDeck);

  // Print Initial Dealing State
  console.log(renderPlayerSummary(state.player));
  
  if (state.phase === 'Showdown') {
    // Game ended immediately due to a Pok
    console.log(`${ANSI.BOLD}${ANSI.RED}⚡ POK DETECTED! Game ends immediately!${ANSI.RESET}\n`);
    console.log(renderPlayerSummary(state.dealer));
  } else {
    // Game continues to player turn (No Poks)
    console.log(renderPlayerSummary(state.dealer, true)); // Hide dealer's hand

    // Side Effect 2: User Input
    const response = await rl.question(`${ANSI.BOLD}Would you like to draw a 3rd card? (y/n): ${ANSI.RESET}`);
    const wantDraw = response.trim().toLowerCase() === 'y';

    // Pure Transition: Apply player decision
    state = wantDraw ? drawPlayerCard(state) : stayPlayer(state);

    console.log(`\n${ANSI.BOLD}--- Player stays/draws. Dealer's Turn ---${ANSI.RESET}\n`);

    // Pure Transition: Execute dealer automated action
    state = dealerAutomatedTurn(state);

    // Show Final Hands (Showdown)
    console.log(renderPlayerSummary(state.player));
    console.log(renderPlayerSummary(state.dealer));
  }

  // Print Winner
  console.log(`${ANSI.BOLD}${ANSI.GREEN}==========================================${ANSI.RESET}`);
  console.log(`${ANSI.BOLD}RESULT: ${state.reason}`);
  console.log(`${ANSI.BOLD}${ANSI.GREEN}==========================================${ANSI.RESET}\n`);

  const playAgain = await rl.question('Play again? (y/n): ');
  if (playAgain.trim().toLowerCase() === 'y') {
    await runGame(rl);
  } else {
    console.log('\nThank you for playing Pokdeng! Goodbye.');
  }
};

// Application entry point for console execution
const main = async () => {
  const rl = readline.createInterface({ input, output });
  try {
    await runGame(rl);
  } finally {
    rl.close();
  }
};

if (typeof require !== 'undefined' && require.main === module) {
  main().catch(err => console.error('An error occurred:', err));
}
