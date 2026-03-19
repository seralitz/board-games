import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Board = number[][];
const SIZE = 4;

function createEmpty(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandom(board: Board): Board {
  const b = board.map((r) => [...r]);
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (b[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return b;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  b[r][c] = Math.random() < 0.9 ? 2 : 4;
  return b;
}

function slideRow(row: number[]): { newRow: number[]; score: number } {
  let score = 0;
  const filtered = row.filter((v) => v !== 0);
  const result: number[] = [];
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      score += merged;
      i++;
    } else {
      result.push(filtered[i]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return { newRow: result, score };
}

function move(
  board: Board,
  dir: "up" | "down" | "left" | "right"
): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let b = board.map((r) => [...r]);

  const process = (
    rows: number[][]
  ): { rows: number[][]; score: number } => {
    let s = 0;
    const newRows = rows.map((row) => {
      const { newRow, score } = slideRow(row);
      s += score;
      return newRow;
    });
    return { rows: newRows, score: s };
  };

  if (dir === "left") {
    const res = process(b);
    b = res.rows;
    totalScore = res.score;
  } else if (dir === "right") {
    const rows = b.map((r) => [...r].reverse());
    const res = process(rows);
    b = res.rows.map((r) => [...r].reverse());
    totalScore = res.score;
  } else if (dir === "up") {
    const rows = Array.from({ length: SIZE }, (_, c) => b.map((r) => r[c]));
    const res = process(rows);
    b = createEmpty();
    res.rows.forEach((col, c) =>
      col.forEach((v, r) => {
        b[r][c] = v;
      })
    );
    totalScore = res.score;
  } else {
    const rows = Array.from({ length: SIZE }, (_, c) =>
      b.map((r) => r[c]).reverse()
    );
    const res = process(rows);
    b = createEmpty();
    res.rows.forEach((col, c) =>
      col.reverse().forEach((v, r) => {
        b[r][c] = v;
      })
    );
    totalScore = res.score;
  }

  const moved = JSON.stringify(b) !== JSON.stringify(board);
  return { board: b, score: totalScore, moved };
}

function canMove(board: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  return false;
}

const TILE_COLORS: Record<number, string> = {
  2: "bg-[hsl(240,12%,14%)] text-foreground",
  4: "bg-[hsl(261,30%,20%)] text-foreground",
  8: "bg-[hsl(261,50%,30%)] text-white",
  16: "bg-[hsl(261,60%,35%)] text-white",
  32: "bg-[hsl(261,70%,40%)] text-white",
  64: "bg-[hsl(261,80%,45%)] text-white",
  128: "bg-[hsl(261,90%,50%)] text-white",
  256: "bg-[hsl(261,100%,55%)] text-white",
  512: "bg-[hsl(270,100%,55%)] text-white",
  1024: "bg-[hsl(280,100%,55%)] text-white",
  2048: "bg-[hsl(290,100%,60%)] text-white glow-purple",
};

const Game2048 = ({ onGameEnd }: { onGameEnd?: (r: { won: boolean; score?: number }) => void }) => {
  const gameEndedRef = useRef(false);
  const [board, setBoard] = useState<Board>(() =>
    addRandom(addRandom(createEmpty()))
  );
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if ((gameOver || won) && !gameEndedRef.current && onGameEnd) {
      gameEndedRef.current = true;
      onGameEnd({ won: !!won, score });
    }
  }, [gameOver, won, score, onGameEnd]);

  const handleMove = useCallback(
    (dir: "up" | "down" | "left" | "right") => {
      if (gameOver) return;
      const result = move(board, dir);
      if (!result.moved) return;
      const newBoard = addRandom(result.board);
      const newScore = score + result.score;
      setBoard(newBoard);
      setScore(newScore);
      if (newScore > best) setBest(newScore);
      if (!won && newBoard.some((r) => r.some((v) => v >= 2048))) setWon(true);
      if (!canMove(newBoard)) setGameOver(true);
    },
    [board, score, best, gameOver, won]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  useEffect(() => {
    let startX = 0,
      startY = 0;
    const handleStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const handleEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx),
        absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 30) return;
      if (absDx > absDy) handleMove(dx > 0 ? "right" : "left");
      else handleMove(dy > 0 ? "down" : "up");
    };
    window.addEventListener("touchstart", handleStart);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [handleMove]);

  const reset = () => {
    setBoard(addRandom(addRandom(createEmpty())));
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="container mx-auto px-4 flex flex-col items-center">
      <div className="flex items-center gap-4 mb-6 w-full max-w-[400px]">
        <div className="flex gap-3 flex-1">
          <div className="bg-card border border-border rounded-lg px-4 py-2 text-center">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Score
            </div>
            <div className="font-mono text-lg text-foreground">{score}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-2 text-center">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Best
            </div>
            <div className="font-mono text-lg text-primary">{best}</div>
          </div>
        </div>
        <button
          onClick={reset}
          className="bg-primary/10 border border-primary/30 text-primary rounded-lg px-4 py-2 font-mono text-xs hover:bg-primary/20 transition-colors"
        >
          New Game
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 relative">
        <div className="grid grid-cols-4 gap-2">
          {board.flat().map((val, i) => (
            <div
              key={i}
              className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-lg bg-muted/30 relative"
            >
              <AnimatePresence mode="popLayout">
                {val > 0 && (
                  <motion.div
                    key={`${i}-${val}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`absolute inset-0 rounded-lg flex items-center justify-center font-mono font-bold ${
                      val >= 1024
                        ? "text-lg"
                        : val >= 128
                        ? "text-xl"
                        : "text-2xl"
                    } ${
                      TILE_COLORS[val] ||
                      "bg-[hsl(300,100%,60%)] text-white glow-purple"
                    }`}
                  >
                    {val}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {(gameOver || won) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center"
          >
            <div
              className={`font-bold text-2xl mb-2 ${
                won ? "text-primary" : "text-foreground"
              }`}
            >
              {won ? "You Win!" : "Game Over"}
            </div>
            <div className="font-mono text-muted-foreground mb-4">
              Score: {score}
            </div>
            <button
              onClick={reset}
              className="bg-primary text-primary-foreground rounded-lg px-6 py-2 font-mono text-sm hover:opacity-90 transition-opacity"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </div>

      <p className="text-muted-foreground text-xs font-mono mt-4 text-center">
        Arrow keys or WASD to move tiles
      </p>
    </div>
  );
};

export default Game2048;
