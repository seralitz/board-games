import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";

type CellState = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

type Difficulty = keyof typeof DIFFICULTIES;

function createBoard(
  rows: number,
  cols: number,
  mines: number,
  safeR?: number,
  safeC?: number
): CellState[][] {
  const board: CellState[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
  );

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].mine) continue;
    if (
      safeR !== undefined &&
      Math.abs(r - safeR) <= 1 &&
      Math.abs(c - safeC!) <= 1
    )
      continue;
    board[r][c].mine = true;
    placed++;
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!board[r][c].mine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr,
              nc = c + dc;
            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              board[nr][nc].mine
            )
              count++;
          }
        board[r][c].adjacent = count;
      }

  return board;
}

const NUMBER_COLORS = [
  "",
  "text-blue-400",
  "text-green-400",
  "text-red-400",
  "text-purple-400",
  "text-yellow-400",
  "text-pink-400",
  "text-cyan-400",
  "text-white",
];

const MinesweeperGame = ({ onGameEnd }: { onGameEnd?: (r: { won: boolean; score?: number }) => void }) => {
  const gameEndedRef = useRef(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const { rows, cols, mines } = DIFFICULTIES[difficulty];
  const [board, setBoard] = useState<CellState[][] | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
  }, [stopTimer]);

  useEffect(() => {
    if ((gameOver || won) && !gameEndedRef.current && onGameEnd) {
      gameEndedRef.current = true;
      onGameEnd({ won, score: time });
    }
  }, [gameOver, won, time, onGameEnd]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const reveal = useCallback(
    (b: CellState[][], r: number, c: number) => {
      if (r < 0 || r >= b.length || c < 0 || c >= b[0].length) return;
      if (b[r][c].revealed || b[r][c].flagged) return;
      b[r][c].revealed = true;
      if (b[r][c].adjacent === 0 && !b[r][c].mine) {
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) reveal(b, r + dr, c + dc);
      }
    },
    []
  );

  const checkWin = useCallback((b: CellState[][]) => {
    for (let r = 0; r < b.length; r++)
      for (let c = 0; c < b[0].length; c++)
        if (!b[r][c].mine && !b[r][c].revealed) return false;
    return true;
  }, []);

  const handleClick = useCallback(
    (r: number, c: number) => {
      if (gameOver || won) return;

      let b: CellState[][];
      if (firstClick || !board) {
        b = createBoard(rows, cols, mines, r, c);
        setFirstClick(false);
        startTimer();
      } else {
        b = board.map((row) => row.map((cell) => ({ ...cell })));
      }

      if (b[r][c].flagged) return;

      if (b[r][c].mine) {
        b.forEach((row) =>
          row.forEach((cell) => {
            if (cell.mine) cell.revealed = true;
          })
        );
        setBoard(b);
        setGameOver(true);
        stopTimer();
        return;
      }

      reveal(b, r, c);
      setBoard(b);

      if (checkWin(b)) {
        setWon(true);
        stopTimer();
      }
    },
    [board, firstClick, gameOver, won, rows, cols, mines, reveal, checkWin, startTimer, stopTimer]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault();
      if (gameOver || won || !board) return;
      const b = board.map((row) => row.map((cell) => ({ ...cell })));
      if (b[r][c].revealed) return;
      b[r][c].flagged = !b[r][c].flagged;
      setFlagCount((fc) => (b[r][c].flagged ? fc + 1 : fc - 1));
      setBoard(b);
    },
    [board, gameOver, won]
  );

  const reset = useCallback(() => {
    stopTimer();
    setBoard(null);
    setGameOver(false);
    setWon(false);
    setFirstClick(true);
    setFlagCount(0);
    setTime(0);
  }, [stopTimer]);

  const changeDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    stopTimer();
    setBoard(null);
    setGameOver(false);
    setWon(false);
    setFirstClick(true);
    setFlagCount(0);
    setTime(0);
  };

  const displayBoard =
    board ||
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );

  return (
    <div className="container mx-auto px-4 flex flex-col items-center">
      <div className="flex gap-2 mb-4">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => changeDifficulty(d)}
            className={`font-mono text-xs px-3 py-1.5 rounded-lg transition-all capitalize ${
              difficulty === d
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="bg-card border border-border rounded-lg px-3 py-1.5 font-mono text-sm">
          <span className="text-muted-foreground text-[10px]">MINES </span>
          <span className="text-foreground">{mines - flagCount}</span>
        </div>
        <button
          onClick={reset}
          className="bg-primary/10 border border-primary/30 text-primary rounded-lg px-3 py-1.5 font-mono text-xs hover:bg-primary/20 transition-colors"
        >
          {gameOver ? "Try Again" : won ? "New Game" : "Reset"}
        </button>
        <div className="bg-card border border-border rounded-lg px-3 py-1.5 font-mono text-sm">
          <span className="text-muted-foreground text-[10px]">TIME </span>
          <span className="text-foreground">{time}</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-2 overflow-auto max-w-full">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {displayBoard.map((row, r) =>
            row.map((cell, c) => (
              <motion.button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
                whileHover={
                  !cell.revealed && !gameOver && !won ? { scale: 1.1 } : {}
                }
                whileTap={
                  !cell.revealed && !gameOver && !won ? { scale: 0.9 } : {}
                }
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-mono font-bold rounded transition-colors ${
                  cell.revealed
                    ? cell.mine
                      ? "bg-destructive/30 text-destructive"
                      : "bg-muted/20"
                    : "bg-[hsl(240,10%,16%)] hover:bg-[hsl(240,10%,20%)] border border-[hsl(240,8%,20%)]"
                }`}
              >
                {cell.revealed
                  ? cell.mine
                    ? "💣"
                    : cell.adjacent > 0
                    ? (
                        <span className={NUMBER_COLORS[cell.adjacent]}>
                          {cell.adjacent}
                        </span>
                      )
                    : ""
                  : cell.flagged
                  ? "🚩"
                  : ""}
              </motion.button>
            ))
          )}
        </div>
      </div>

      {(gameOver || won) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div
            className={`font-bold text-lg ${
              won ? "text-success" : "text-destructive"
            }`}
          >
            {won ? "You Win!" : "Game Over!"}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Time: {time}s
          </div>
        </motion.div>
      )}

      <p className="text-muted-foreground text-xs font-mono mt-4 text-center">
        Click to reveal · Right-click to flag
      </p>
    </div>
  );
};

export default MinesweeperGame;
