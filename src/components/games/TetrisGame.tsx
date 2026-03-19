import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ROWS = 20;
const COLS = 10;
const LOCK_DELAY = 500;
const DAS_DELAY = 170;
const DAS_REPEAT = 50;
const GARBAGE_DELAY = 2000;
const BOT_MAX_HP = 20;

type Cell = string | null;
type Board = Cell[][];

/* ─── SRS Piece Data (4 rotation states each) ─── */

const PIECES_DATA: Record<string, { rotations: number[][][]; color: string }> = {
  I: {
    color: "hsl(190,90%,50%)",
    rotations: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    ],
  },
  O: {
    color: "hsl(50,90%,50%)",
    rotations: [
      [[1,1],[1,1]],
      [[1,1],[1,1]],
      [[1,1],[1,1]],
      [[1,1],[1,1]],
    ],
  },
  T: {
    color: "hsl(280,80%,55%)",
    rotations: [
      [[0,1,0],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,1],[0,1,0]],
      [[0,1,0],[1,1,0],[0,1,0]],
    ],
  },
  S: {
    color: "hsl(120,70%,45%)",
    rotations: [
      [[0,1,1],[1,1,0],[0,0,0]],
      [[0,1,0],[0,1,1],[0,0,1]],
      [[0,0,0],[0,1,1],[1,1,0]],
      [[1,0,0],[1,1,0],[0,1,0]],
    ],
  },
  Z: {
    color: "hsl(0,80%,50%)",
    rotations: [
      [[1,1,0],[0,1,1],[0,0,0]],
      [[0,0,1],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,0],[0,1,1]],
      [[0,1,0],[1,1,0],[1,0,0]],
    ],
  },
  J: {
    color: "hsl(230,80%,55%)",
    rotations: [
      [[1,0,0],[1,1,1],[0,0,0]],
      [[0,1,1],[0,1,0],[0,1,0]],
      [[0,0,0],[1,1,1],[0,0,1]],
      [[0,1,0],[0,1,0],[1,1,0]],
    ],
  },
  L: {
    color: "hsl(30,90%,50%)",
    rotations: [
      [[0,0,1],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,0],[0,1,1]],
      [[0,0,0],[1,1,1],[1,0,0]],
      [[1,1,0],[0,1,0],[0,1,0]],
    ],
  },
};

/* ─── SRS Wall Kick Data ─── */

const KICK_JLSTZ: Record<string, [number, number][]> = {
  "0>1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "1>0": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "1>2": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "2>1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "2>3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  "3>2": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "3>0": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "0>3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};

const KICK_I: Record<string, [number, number][]> = {
  "0>1": [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  "1>0": [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  "1>2": [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  "2>1": [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  "2>3": [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  "3>2": [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  "3>0": [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  "0>3": [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};

const PIECE_NAMES = Object.keys(PIECES_DATA);
const GARBAGE_COLOR = "hsl(0,0%,28%)";
// Combo bonus: +1 per consecutive clear (combo 1=0, 2=+1, 3=+2, etc.)
function comboBonus(combo: number): number { return Math.max(0, combo - 1); }

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function isValid(board: Board, shape: number[][], row: number, col: number): boolean {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[0].length; c++)
      if (shape[r][c]) {
        const nr = row + r, nc = col + c;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
        if (board[nr]?.[nc]) return false;
      }
  return true;
}

function place(board: Board, shape: number[][], row: number, col: number, color: string): Board {
  const b = board.map((r) => [...r]);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[0].length; c++)
      if (shape[r][c] && row + r >= 0 && row + r < ROWS) b[row + r][col + c] = color;
  return b;
}

function clearLines(board: Board): { board: Board; cleared: number; clearedRows: number[] } {
  const clearedRows: number[] = [];
  board.forEach((row, i) => { if (row.every((cell) => cell)) clearedRows.push(i); });
  if (clearedRows.length === 0) return { board, cleared: 0, clearedRows: [] };
  const remaining = board.filter((_, i) => !clearedRows.includes(i));
  const empty = Array.from({ length: clearedRows.length }, () => Array(COLS).fill(null));
  return { board: [...empty, ...remaining], cleared: clearedRows.length, clearedRows };
}

function ghostRow(board: Board, shape: number[][], row: number, col: number): number {
  let gr = row;
  while (isValid(board, shape, gr + 1, col)) gr++;
  return gr;
}

function createBag(): string[] {
  const bag = [...PIECE_NAMES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function insertGarbageRows(board: Board, count: number): Board {
  const b = board.map((r) => [...r]);
  // Remove top rows to make room
  b.splice(0, count);
  // Add garbage rows at bottom
  for (let i = 0; i < count; i++) {
    const gap = Math.floor(Math.random() * COLS);
    const row: Cell[] = Array(COLS).fill(GARBAGE_COLOR);
    row[gap] = null;
    b.push(row);
  }
  return b;
}

/* ─── T-Spin Detection ─── */
function isTSpin(board: Board, row: number, col: number): boolean {
  // Check 4 corners of the T-piece's 3x3 bounding box
  let corners = 0;
  const checks: [number, number][] = [[0, 0], [0, 2], [2, 0], [2, 2]];
  for (const [dr, dc] of checks) {
    const r = row + dr, c = col + dc;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r]?.[c]) corners++;
  }
  return corners >= 3;
}

/* ─── Component ─── */

type GarbageEntry = { lines: number; timerId: ReturnType<typeof setTimeout> };
type AttackFlash = { text: string; color: string; key: number };

const TetrisGame = ({ onGameEnd }: { onGameEnd?: (r: { won: boolean; score?: number }) => void }) => {
  const competitive = !!onGameEnd;
  const gameEndedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  // Core game state in refs
  const boardRef = useRef<Board>(createBoard());
  const bagRef = useRef<string[]>(createBag());
  const queueRef = useRef<string[]>([]);
  const currentRef = useRef<string>("T");
  const rotRef = useRef(0);
  const posRef = useRef({ row: 0, col: 0 });
  const holdRef = useRef<string | null>(null);
  const holdUsedRef = useRef(false);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockResetCountRef = useRef(0);
  const landedRef = useRef(false);
  const clearAnimRef = useRef<number[]>([]);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);

  // Competitive state refs
  const comboRef = useRef(0);
  const b2bRef = useRef(false);
  const lastRotatedRef = useRef(false);
  const incomingGarbageRef = useRef<GarbageEntry[]>([]);
  const pendingGarbageLinesRef = useRef(0);
  const botHealthRef = useRef(BOT_MAX_HP);
  const attackFlashRef = useRef<AttackFlash | null>(null);
  const attackFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashKeyRef = useRef(0);

  // Render trigger
  const [, setTick] = useState(0);
  const render = useCallback(() => setTick((t) => t + 1), []);

  // DAS refs
  const dasKeyRef = useRef<string | null>(null);
  const dasTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dasIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fall timer
  const fallRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getSpeed = (lvl: number) => Math.max(50, 800 - (lvl - 1) * 70);

  const nextFromBag = useCallback((): string => {
    if (bagRef.current.length === 0) bagRef.current = createBag();
    return bagRef.current.pop()!;
  }, []);

  const fillQueue = useCallback(() => {
    while (queueRef.current.length < 5) queueRef.current.push(nextFromBag());
  }, [nextFromBag]);

  const getShape = (piece: string, rot: number) => PIECES_DATA[piece].rotations[rot];

  const clearLockTimer = () => {
    if (lockTimerRef.current) { clearTimeout(lockTimerRef.current); lockTimerRef.current = null; }
  };

  const clearDas = () => {
    dasKeyRef.current = null;
    if (dasTimerRef.current) { clearTimeout(dasTimerRef.current); dasTimerRef.current = null; }
    if (dasIntervalRef.current) { clearInterval(dasIntervalRef.current); dasIntervalRef.current = null; }
  };

  const showFlash = useCallback((text: string, color: string) => {
    if (attackFlashTimerRef.current) clearTimeout(attackFlashTimerRef.current);
    flashKeyRef.current++;
    attackFlashRef.current = { text, color, key: flashKeyRef.current };
    render();
    attackFlashTimerRef.current = setTimeout(() => {
      attackFlashRef.current = null;
      render();
    }, 1500);
  }, [render]);

  const triggerGameOver = useCallback((won: boolean) => {
    gameOverRef.current = true;
    setGameOver(true);
    if (fallRef.current) clearInterval(fallRef.current);
    clearLockTimer();
    clearDas();
    if (botPieceTimerRef.current) clearInterval(botPieceTimerRef.current);
    // Clear all incoming garbage timers
    for (const g of incomingGarbageRef.current) clearTimeout(g.timerId);
    incomingGarbageRef.current = [];
    pendingGarbageLinesRef.current = 0;
    if (!gameEndedRef.current && onGameEnd) {
      gameEndedRef.current = true;
      onGameEnd({ won, score: scoreRef.current });
    }
    render();
  }, [onGameEnd, render]);

  /* ─── Garbage insertion (called when garbage timer fires) ─── */
  const applyGarbage = useCallback((lines: number) => {
    if (gameOverRef.current) return;
    // Remove this entry from the queue (timer already fired)
    const idx = incomingGarbageRef.current.findIndex((g) => g.lines === lines);
    if (idx >= 0) incomingGarbageRef.current.splice(idx, 1);
    pendingGarbageLinesRef.current = incomingGarbageRef.current.reduce((s, g) => s + g.lines, 0);
    boardRef.current = insertGarbageRows(boardRef.current, lines);
    render();
  }, [render]);

  /* ─── Queue incoming garbage with delay ─── */
  const queueGarbage = useCallback((lines: number) => {
    if (gameOverRef.current || lines <= 0) return;
    const entry: GarbageEntry = {
      lines,
      timerId: setTimeout(() => applyGarbage(lines), GARBAGE_DELAY),
    };
    incomingGarbageRef.current.push(entry);
    pendingGarbageLinesRef.current += lines;
    render();
  }, [applyGarbage, render]);

  /* ─── Simulated bot that "plays" Tetris and sends garbage on clears ─── */
  const botComboRef = useRef(0);
  const botB2bRef = useRef(false);
  const botPiecesRef = useRef(0);
  const botPieceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const simulateBotPiece = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    botPiecesRef.current++;
    // Grace period: bot stacks for first ~12 pieces (~10-15s) without clearing
    if (botPiecesRef.current < 12) return;

    // Roll for what the bot does this piece:
    // 55% just stack, 15% single(0g), 12% double(1g), 8% triple(2g), 7% tetris(4g), 3% tspin double(4g)
    const roll = Math.random();
    let garbage = 0;
    let label = "";
    let isSpecial = false;

    if (roll < 0.55) {
      // No clear — reset combo
      botComboRef.current = 0;
      return;
    } else if (roll < 0.70) {
      // Single — 0 garbage but counts for combo
      garbage = 0; label = "";
    } else if (roll < 0.82) {
      garbage = 1; label = "DOUBLE";
    } else if (roll < 0.90) {
      garbage = 2; label = "TRIPLE";
    } else if (roll < 0.97) {
      garbage = 4; label = "TETRIS"; isSpecial = true;
    } else {
      garbage = 4; label = "T-SPIN DBL"; isSpecial = true;
    }

    // Combo bonus: +1 per consecutive clear
    botComboRef.current++;
    garbage += comboBonus(botComboRef.current);

    // B2B bonus
    if (isSpecial && botB2bRef.current) garbage += 1;
    botB2bRef.current = isSpecial;

    if (garbage > 0) {
      const comboText = botComboRef.current >= 2 ? ` CMBx${botComboRef.current}` : "";
      showFlash(`INCOMING +${garbage} ${label}${comboText}`, "text-destructive");
      queueGarbage(garbage);
    }
  }, [showFlash, queueGarbage]);

  const startBot = useCallback(() => {
    if (!competitive) return;
    botPiecesRef.current = 0;
    botComboRef.current = 0;
    botB2bRef.current = false;
    if (botPieceTimerRef.current) clearInterval(botPieceTimerRef.current);
    // Bot places ~1.2 pieces/sec (850ms interval)
    botPieceTimerRef.current = setInterval(simulateBotPiece, 850);
  }, [competitive, simulateBotPiece]);

  const spawn = useCallback(() => {
    fillQueue();
    const piece = queueRef.current.shift()!;
    fillQueue();
    const shape = getShape(piece, 0);
    const col = Math.floor((COLS - shape[0].length) / 2);
    const row = piece === "I" ? -1 : 0;

    if (!isValid(boardRef.current, shape, row, col)) {
      triggerGameOver(false);
      return;
    }
    currentRef.current = piece;
    rotRef.current = 0;
    posRef.current = { row, col };
    holdUsedRef.current = false;
    landedRef.current = false;
    lockResetCountRef.current = 0;
    lastRotatedRef.current = false;
    clearLockTimer();
    render();
  }, [fillQueue, triggerGameOver, render]);

  const lockPiece = useCallback(() => {
    clearLockTimer();
    const piece = currentRef.current;
    const shape = getShape(piece, rotRef.current);
    const { row, col } = posRef.current;
    const color = PIECES_DATA[piece].color;
    const newBoard = place(boardRef.current, shape, row, col, color);
    const { board: cleared, cleared: linesCleared, clearedRows } = clearLines(newBoard);

    /* ─── Competitive attack calculation ─── */
    let attackLines = 0;
    let flashText = "";
    let isTSpinClear = false;

    if (competitive && linesCleared > 0) {
      // T-spin detection
      const tSpin = piece === "T" && lastRotatedRef.current && isTSpin(boardRef.current, row, col);
      isTSpinClear = tSpin;

      // Base garbage
      if (tSpin) {
        attackLines = [0, 2, 4, 6][linesCleared] || 0;
        flashText = linesCleared === 1 ? "T-SPIN SINGLE" : linesCleared === 2 ? "T-SPIN DOUBLE" : "T-SPIN TRIPLE";
      } else {
        attackLines = [0, 0, 1, 2, 4][linesCleared] || 0;
        if (linesCleared === 4) flashText = "TETRIS";
        else if (linesCleared === 3) flashText = "TRIPLE";
        else if (linesCleared === 2) flashText = "DOUBLE";
      }

      // Combo bonus: +1 per consecutive clear
      comboRef.current++;
      attackLines += comboBonus(comboRef.current);
      if (comboRef.current >= 2) {
        flashText += (flashText ? " " : "") + `COMBO x${comboRef.current}`;
      }

      // Back-to-back bonus
      const isSpecial = linesCleared === 4 || isTSpinClear;
      if (isSpecial && b2bRef.current) {
        attackLines += 1;
        flashText += " B2B";
      }
      b2bRef.current = isSpecial;

      // Cancel incoming garbage first
      if (attackLines > 0) {
        let remaining = attackLines;
        while (remaining > 0 && incomingGarbageRef.current.length > 0) {
          const entry = incomingGarbageRef.current[0];
          if (entry.lines <= remaining) {
            remaining -= entry.lines;
            clearTimeout(entry.timerId);
            incomingGarbageRef.current.shift();
          } else {
            entry.lines -= remaining;
            remaining = 0;
          }
        }
        pendingGarbageLinesRef.current = incomingGarbageRef.current.reduce((s, g) => s + g.lines, 0);

        // Send remaining to bot
        if (remaining > 0) {
          botHealthRef.current -= remaining;
          if (flashText) flashText += ` +${remaining}`;
        }

        if (flashText) showFlash(flashText, "text-success");

        // Check if bot is dead
        if (botHealthRef.current <= 0) {
          botHealthRef.current = 0;
          // Let animation play, then trigger win
          setTimeout(() => {
            if (!gameOverRef.current) triggerGameOver(true);
          }, 300);
        }
      }
    } else if (competitive && linesCleared === 0) {
      // No lines cleared — reset combo
      comboRef.current = 0;
    }

    if (clearedRows.length > 0) {
      clearAnimRef.current = clearedRows;
      render();
      setTimeout(() => {
        boardRef.current = cleared;
        clearAnimRef.current = [];
        const points = isTSpinClear
          ? [0, 800, 1200, 1600][linesCleared] || 0
          : [0, 100, 300, 500, 800][linesCleared] || 0;
        scoreRef.current += points * levelRef.current;
        linesRef.current += linesCleared;
        levelRef.current = Math.floor(linesRef.current / 10) + 1;
        if (fallRef.current) clearInterval(fallRef.current);
        fallRef.current = setInterval(tick, getSpeed(levelRef.current));
        spawn();
      }, 200);
    } else {
      boardRef.current = cleared;
      spawn();
    }
  }, [spawn, render, competitive, showFlash, triggerGameOver]);

  const tick = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const shape = getShape(currentRef.current, rotRef.current);
    const { row, col } = posRef.current;
    if (isValid(boardRef.current, shape, row + 1, col)) {
      posRef.current = { row: row + 1, col };
      landedRef.current = false;
      clearLockTimer();
      render();
    } else {
      if (!landedRef.current) {
        landedRef.current = true;
        lockResetCountRef.current = 0;
        lockTimerRef.current = setTimeout(() => lockPiece(), LOCK_DELAY);
      }
      render();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockPiece, render]);

  const tryMove = useCallback((dCol: number) => {
    if (gameOverRef.current || pausedRef.current) return;
    const shape = getShape(currentRef.current, rotRef.current);
    const { row, col } = posRef.current;
    if (isValid(boardRef.current, shape, row, col + dCol)) {
      posRef.current = { row, col: col + dCol };
      lastRotatedRef.current = false;
      if (landedRef.current && lockResetCountRef.current < 15) {
        lockResetCountRef.current++;
        clearLockTimer();
        if (!isValid(boardRef.current, shape, row + 1, col + dCol)) {
          lockTimerRef.current = setTimeout(() => lockPiece(), LOCK_DELAY);
        } else {
          landedRef.current = false;
        }
      }
      render();
    }
  }, [lockPiece, render]);

  const tryRotate = useCallback((dir: 1 | -1) => {
    if (gameOverRef.current || pausedRef.current) return;
    const piece = currentRef.current;
    if (piece === "O") return;
    const fromRot = rotRef.current;
    const toRot = (fromRot + dir + 4) % 4;
    const newShape = getShape(piece, toRot);
    const kicks = piece === "I" ? KICK_I : KICK_JLSTZ;
    const key = `${fromRot}>${toRot}`;
    const tests = kicks[key] || [[0, 0]];
    const { row, col } = posRef.current;

    for (const [dx, dy] of tests) {
      if (isValid(boardRef.current, newShape, row - dy, col + dx)) {
        rotRef.current = toRot;
        posRef.current = { row: row - dy, col: col + dx };
        lastRotatedRef.current = true;
        if (landedRef.current && lockResetCountRef.current < 15) {
          lockResetCountRef.current++;
          clearLockTimer();
          if (!isValid(boardRef.current, newShape, row - dy + 1, col + dx)) {
            lockTimerRef.current = setTimeout(() => lockPiece(), LOCK_DELAY);
          } else {
            landedRef.current = false;
          }
        }
        render();
        return;
      }
    }
  }, [lockPiece, render]);

  const hardDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const shape = getShape(currentRef.current, rotRef.current);
    const { col } = posRef.current;
    let row = posRef.current.row;
    let dropped = 0;
    while (isValid(boardRef.current, shape, row + 1, col)) { row++; dropped++; }
    posRef.current = { row, col };
    scoreRef.current += dropped * 2;
    lastRotatedRef.current = false;
    clearLockTimer();
    lockPiece();
  }, [lockPiece]);

  const softDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const shape = getShape(currentRef.current, rotRef.current);
    const { row, col } = posRef.current;
    if (isValid(boardRef.current, shape, row + 1, col)) {
      posRef.current = { row: row + 1, col };
      scoreRef.current += 1;
      landedRef.current = false;
      clearLockTimer();
      render();
    }
  }, [render]);

  const holdPiece = useCallback(() => {
    if (gameOverRef.current || pausedRef.current || holdUsedRef.current) return;
    holdUsedRef.current = true;
    clearLockTimer();
    lastRotatedRef.current = false;
    const held = holdRef.current;
    holdRef.current = currentRef.current;
    if (held) {
      const shape = getShape(held, 0);
      const col = Math.floor((COLS - shape[0].length) / 2);
      currentRef.current = held;
      rotRef.current = 0;
      posRef.current = { row: 0, col };
      landedRef.current = false;
      lockResetCountRef.current = 0;
      render();
    } else {
      spawn();
    }
  }, [spawn, render]);

  const startGame = useCallback(() => {
    boardRef.current = createBoard();
    bagRef.current = createBag();
    queueRef.current = [];
    holdRef.current = null;
    holdUsedRef.current = false;
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    gameOverRef.current = false;
    gameEndedRef.current = false;
    clearAnimRef.current = [];
    comboRef.current = 0;
    b2bRef.current = false;
    lastRotatedRef.current = false;
    botHealthRef.current = BOT_MAX_HP;
    attackFlashRef.current = null;
    pendingGarbageLinesRef.current = 0;
    // Clear all garbage timers
    for (const g of incomingGarbageRef.current) clearTimeout(g.timerId);
    incomingGarbageRef.current = [];
    if (botPieceTimerRef.current) clearInterval(botPieceTimerRef.current);
    if (attackFlashTimerRef.current) clearTimeout(attackFlashTimerRef.current);
    clearDas();
    setGameOver(false);
    setPaused(false);
    setStarted(true);
    spawn();
    if (fallRef.current) clearInterval(fallRef.current);
    fallRef.current = setInterval(tick, getSpeed(1));
    if (competitive) startBot();
  }, [spawn, tick, competitive, startBot]);

  // Auto-start on mount
  useEffect(() => { startGame(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    return () => {
      if (fallRef.current) clearInterval(fallRef.current);
      if (botPieceTimerRef.current) clearInterval(botPieceTimerRef.current);
      if (attackFlashTimerRef.current) clearTimeout(attackFlashTimerRef.current);
      for (const g of incomingGarbageRef.current) clearTimeout(g.timerId);
      clearLockTimer();
      clearDas();
    };
  }, []);

  // Keyboard handler with DAS
  useEffect(() => {
    if (!started) return;

    const doAction = (key: string) => {
      switch (key) {
        case "ArrowLeft": tryMove(-1); break;
        case "ArrowRight": tryMove(1); break;
        case "ArrowDown": softDrop(); break;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;
      const k = e.key;
      if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowDown" ||
          k === "ArrowUp" || k === " " || k === "c" || k === "C" || k === "p") {
        e.preventDefault();
      }

      if (k === "p") { setPaused((p) => !p); return; }
      if (pausedRef.current) return;

      if (k === "ArrowUp") { tryRotate(1); return; }
      if (k === "z" || k === "Z") { tryRotate(-1); return; }
      if (k === " ") { hardDrop(); return; }
      if (k === "c" || k === "C") { holdPiece(); return; }

      if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowDown") {
        if (dasKeyRef.current === k) return;
        clearDas();
        dasKeyRef.current = k;
        doAction(k);
        dasTimerRef.current = setTimeout(() => {
          dasIntervalRef.current = setInterval(() => doAction(k), DAS_REPEAT);
        }, DAS_DELAY);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === dasKeyRef.current) clearDas();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [started, tryMove, tryRotate, softDrop, hardDrop, holdPiece]);

  /* ─── Render ─── */

  const board = boardRef.current;
  const shape = getShape(currentRef.current, rotRef.current);
  const pos = posRef.current;
  const ghost = ghostRow(board, shape, pos.row, pos.col);

  const display = board.map((r) => [...r]);
  if (started && !gameOver) {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[0].length; c++)
        if (shape[r][c] && ghost + r >= 0 && ghost + r < ROWS)
          display[ghost + r][pos.col + c] = display[ghost + r][pos.col + c] || "ghost";
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[0].length; c++)
        if (shape[r][c] && pos.row + r >= 0 && pos.row + r < ROWS)
          display[pos.row + r][pos.col + c] = PIECES_DATA[currentRef.current].color;
  }

  const renderMiniPiece = (pieceName: string | null, size: number = 16) => {
    if (!pieceName) return <div className="w-full h-full" />;
    const s = PIECES_DATA[pieceName].rotations[0];
    const color = PIECES_DATA[pieceName].color;
    const minR = s.findIndex((r) => r.some(Boolean));
    const maxR = s.length - 1 - [...s].reverse().findIndex((r) => r.some(Boolean));
    const minC = Math.min(...s.map((r) => r.indexOf(1)).filter((v) => v >= 0));
    const maxC = Math.max(...s.map((r) => r.lastIndexOf(1)));
    const trimmed: number[][] = [];
    for (let r = minR; r <= maxR; r++) trimmed.push(s[r].slice(minC, maxC + 1));
    return (
      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${trimmed[0].length}, ${size}px)` }}>
        {trimmed.flat().map((cell, i) => (
          <div key={i} style={{ width: size, height: size, borderRadius: 2, backgroundColor: cell ? color : "transparent", border: cell ? "1px solid rgba(255,255,255,0.15)" : "none" }} />
        ))}
      </div>
    );
  };

  if (!started) return null;

  const clearingRows = new Set(clearAnimRef.current);
  const pendingGarbage = pendingGarbageLinesRef.current;
  const botHp = botHealthRef.current;
  const botHpPct = Math.max(0, Math.round((botHp / BOT_MAX_HP) * 100));
  const flash = attackFlashRef.current;
  const combo = comboRef.current;

  return (
    <div className="mx-auto px-4 flex flex-col items-center gap-2">
      {/* Bot health bar (competitive only) */}
      {competitive && (
        <div className="flex items-center gap-2 w-full max-w-[400px]">
          <span className="font-mono text-[9px] text-muted-foreground uppercase shrink-0">Bot</span>
          <div className="flex-1 h-3 bg-muted/20 rounded-full overflow-hidden border border-border">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${botHpPct}%` }}
              transition={{ duration: 0.3 }}
              style={{
                background: botHpPct > 50
                  ? "linear-gradient(90deg, hsl(120,60%,40%), hsl(120,60%,50%))"
                  : botHpPct > 25
                  ? "linear-gradient(90deg, hsl(40,80%,45%), hsl(50,80%,50%))"
                  : "linear-gradient(90deg, hsl(0,70%,45%), hsl(0,70%,55%))",
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground w-10 text-right">{botHp}/{BOT_MAX_HP}</span>
        </div>
      )}

      <div className="flex justify-center gap-2">
        {/* Hold + Stats */}
        <div className="flex flex-col gap-2 w-[72px] shrink-0">
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Hold</div>
            <div className="flex items-center justify-center h-10">
              {renderMiniPiece(holdRef.current, 13)}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Score</div>
            <div className="font-mono text-xs text-foreground">{scoreRef.current.toLocaleString()}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Lines</div>
            <div className="font-mono text-xs text-foreground">{linesRef.current}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Level</div>
            <div className="font-mono text-xs text-primary">{levelRef.current}</div>
          </div>
          {competitive && combo >= 2 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-yellow-600/40 rounded-lg p-2 text-center"
            >
              <div className="font-mono text-[9px] text-yellow-500 uppercase tracking-wider">Combo</div>
              <div className="font-mono text-sm text-yellow-400 font-black">x{combo}</div>
            </motion.div>
          )}
        </div>

        {/* Garbage Meter + Board */}
        <div className="flex gap-0">
          {/* Garbage meter */}
          {competitive && (
            <div className="w-3 flex flex-col-reverse mr-1 rounded overflow-hidden" style={{ height: ROWS * 24 }}>
              {Array.from({ length: Math.min(pendingGarbage, ROWS) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  className="w-full"
                  style={{
                    height: 24,
                    background: pendingGarbage > 8
                      ? "hsl(0,80%,50%)"
                      : pendingGarbage > 4
                      ? "hsl(30,80%,50%)"
                      : "hsl(0,70%,45%)",
                    opacity: 0.7 + (i / Math.max(pendingGarbage, 1)) * 0.3,
                    borderBottom: "1px solid rgba(0,0,0,0.3)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Board */}
          <div className="bg-card border border-border rounded-xl p-1 relative">
            <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
              {display.map((row, ri) =>
                row.map((cell, ci) => {
                  const clearing = clearingRows.has(ri);
                  const isGarbage = cell === GARBAGE_COLOR;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] rounded-[2px] transition-colors duration-75"
                      style={{
                        backgroundColor: clearing
                          ? "hsl(0,0%,90%)"
                          : cell === "ghost"
                          ? "hsl(261,100%,65%,0.12)"
                          : cell
                          ? cell
                          : "hsl(240,12%,8%)",
                        border:
                          cell && cell !== "ghost"
                            ? isGarbage
                              ? "1px solid hsl(0,0%,35%)"
                              : "1px solid rgba(255,255,255,0.12)"
                            : "1px solid hsl(240,8%,11%)",
                        boxShadow: cell && cell !== "ghost" && !isGarbage
                          ? "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)"
                          : "none",
                      }}
                    />
                  );
                })
              )}
            </div>

            {/* Attack flash overlay */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  key={flash.key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className={`font-mono text-sm font-black px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border ${flash.color}`}>
                    {flash.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game over / Paused overlay */}
            <AnimatePresence>
              {(gameOver || paused) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center"
                >
                  <div className="font-bold text-xl text-foreground mb-2">
                    {gameOver ? "Game Over" : "Paused"}
                  </div>
                  {gameOver && (
                    <div className="font-mono text-muted-foreground text-sm mb-4">
                      Score: {scoreRef.current.toLocaleString()}
                    </div>
                  )}
                  <button
                    onClick={gameOver ? startGame : () => setPaused(false)}
                    className="bg-primary text-primary-foreground rounded-lg px-6 py-2 font-mono text-sm hover:opacity-90 transition-opacity"
                  >
                    {gameOver ? "Play Again" : "Resume"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Next queue */}
        <div className="flex flex-col gap-2 w-[72px] shrink-0">
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Next</div>
            <div className="flex flex-col items-center gap-3">
              {queueRef.current.slice(0, 3).map((p, i) => (
                <div key={i} className={`flex items-center justify-center h-10 ${i > 0 ? "opacity-50" : ""}`}>
                  {renderMiniPiece(p, i === 0 ? 13 : 10)}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={startGame}
            className="bg-primary/10 border border-primary/30 text-primary rounded-lg px-2 py-1.5 font-mono text-[10px] hover:bg-primary/20 transition-colors"
          >
            Restart
          </button>
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
