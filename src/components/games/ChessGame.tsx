import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess, Square, Move } from "chess.js";

const PIECES_CDN = "https://lichess1.org/assets/piece/cburnett";
const PIECE_IMAGES: Record<string, string> = {};
["wK","wQ","wR","wB","wN","wP","bK","bQ","bR","bB","bN","bP"].forEach((p) => {
  PIECE_IMAGES[p] = `${PIECES_CDN}/${p}.svg`;
});

function pieceToKey(piece: { type: string; color: string }): string {
  return `${piece.color === "w" ? "w" : "b"}${piece.type.toUpperCase()}`;
}

const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

const PAWN_TABLE = [
  0,0,0,0,0,0,0,0,
  50,50,50,50,50,50,50,50,
  10,10,20,30,30,20,10,10,
  5,5,10,25,25,10,5,5,
  0,0,0,20,20,0,0,0,
  5,-5,-10,0,0,-10,-5,5,
  5,10,10,-20,-20,10,10,5,
  0,0,0,0,0,0,0,0,
];

function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const val = PIECE_VALUES[piece.type] || 0;
      let positional = 0;
      if (piece.type === "p") {
        positional = piece.color === "w"
          ? PAWN_TABLE[r * 8 + c]
          : PAWN_TABLE[(7 - r) * 8 + c];
      }
      score += piece.color === "w" ? val + positional : -(val + positional);
    }
  }
  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): { score: number; move?: Move } {
  if (depth === 0 || chess.isGameOver()) {
    if (chess.isCheckmate()) return { score: maximizing ? -99999 : 99999 };
    if (chess.isDraw()) return { score: 0 };
    return { score: evaluateBoard(chess) };
  }

  const moves = chess.moves({ verbose: true });
  moves.sort((a, b) => {
    const aCapture = a.captured ? PIECE_VALUES[a.captured] : 0;
    const bCapture = b.captured ? PIECE_VALUES[b.captured] : 0;
    return bCapture - aCapture;
  });

  let bestMove: Move | undefined;
  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const { score } = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      if (score > maxEval) { maxEval = score; bestMove = move; }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const { score } = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      if (score < minEval) { minEval = score; bestMove = move; }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

function playSound(type: "move" | "capture" | "check") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.1;
    if (type === "move") { osc.frequency.value = 300; gain.gain.value = 0.05; }
    else if (type === "capture") { osc.frequency.value = 200; gain.gain.value = 0.08; }
    else { osc.frequency.value = 500; gain.gain.value = 0.1; }
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch { /* ignore audio errors */ }
}

const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = ["8","7","6","5","4","3","2","1"];

const ChessGame = ({ onGameEnd }: { onGameEnd?: (r: { won: boolean; score?: number }) => void }) => {
  const gameEndedRef = useRef(false);
  const [game] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [gameStarted, setGameStarted] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState<{ from: Square; to: Square } | null>(null);
  const [premove, setPremove] = useState<{ from: Square; to: Square } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRunningRef = useRef(false);

  const isPlayerTurn = game.turn() === "w";

  // Detect game end and fire callback
  useEffect(() => {
    if (gameEndedRef.current || !onGameEnd) return;
    let won: boolean | null = null;
    if (game.isCheckmate()) won = game.turn() === "b"; // player is white
    else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) won = false;
    else if (blackTime === 0) won = true;
    else if (whiteTime === 0) won = false;
    if (won !== null) {
      gameEndedRef.current = true;
      onGameEnd({ won });
    }
  }, [fen, whiteTime, blackTime, onGameEnd, game]);

  useEffect(() => {
    if (!gameStarted || game.isGameOver()) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      if (game.turn() === "w") setWhiteTime((t) => Math.max(0, t - 1));
      else setBlackTime((t) => Math.max(0, t - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStarted, fen, game]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: string) => {
      try {
        const move = game.move({ from, to, promotion: promotion || undefined });
        if (!move) return false;
        setFen(game.fen());
        setLastMove({ from, to });
        setSelected(null);
        setLegalMoves([]);
        if (!gameStarted) setGameStarted(true);
        if (move.captured) playSound("capture");
        else if (game.inCheck()) playSound("check");
        else playSound("move");
        return true;
      } catch {
        return false;
      }
    },
    [game, gameStarted]
  );

  // AI move
  useEffect(() => {
    if (game.isGameOver() || isPlayerTurn || aiRunningRef.current) return;

    aiRunningRef.current = true;
    setThinking(true);
    const delay = 1000 + Math.floor(Math.random() * 2000);
    const timeout = setTimeout(() => {
      const { move } = minimax(game, 3, -Infinity, Infinity, false);
      if (move) {
        game.move(move);
        setFen(game.fen());
        setLastMove({ from: move.from as Square, to: move.to as Square });
        if (move.captured) playSound("capture");
        else if (game.inCheck()) playSound("check");
        else playSound("move");

        if (premove) {
          const pm = premove;
          setPremove(null);
          setTimeout(() => makeMove(pm.from, pm.to), 100);
        }
      }
      aiRunningRef.current = false;
      setThinking(false);
    }, delay);

    return () => {
      clearTimeout(timeout);
      aiRunningRef.current = false;
    };
  }, [fen, isPlayerTurn, game, premove, makeMove]);

  const handleSquareClick = (square: Square) => {
    if (game.isGameOver()) return;

    if (!isPlayerTurn) {
      const piece = game.get(square);
      if (premove?.from && premove.from !== square) {
        setPremove({ from: premove.from, to: square });
        return;
      }
      if (piece && piece.color === "w") {
        setPremove({ from: square, to: square });
        return;
      }
      return;
    }

    if (selected) {
      const piece = game.get(selected);
      if (
        piece?.type === "p" &&
        (square[1] === "8" || square[1] === "1")
      ) {
        setPromotionSquare({ from: selected, to: square });
        return;
      }

      if (makeMove(selected, square)) return;

      const clickedPiece = game.get(square);
      if (clickedPiece && clickedPiece.color === game.turn()) {
        setSelected(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      }
      setSelected(null);
      setLegalMoves([]);
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelected(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to as Square));
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    const piece = game.get(square);
    if (!piece || (isPlayerTurn && piece.color !== "w")) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", square);
    setSelected(square);
    if (isPlayerTurn) {
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m) => m.to as Square));
    }
  };

  const handleDrop = (e: React.DragEvent, toSquare: Square) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData("text/plain") as Square;
    if (!fromSquare) return;

    if (!isPlayerTurn) {
      setPremove({ from: fromSquare, to: toSquare });
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    const piece = game.get(fromSquare);
    if (
      piece?.type === "p" &&
      (toSquare[1] === "8" || toSquare[1] === "1")
    ) {
      setPromotionSquare({ from: fromSquare, to: toSquare });
      return;
    }

    makeMove(fromSquare, toSquare);
  };

  const handlePromotion = (piece: string) => {
    if (promotionSquare) {
      makeMove(promotionSquare.from, promotionSquare.to, piece);
      setPromotionSquare(null);
    }
  };

  const reset = () => {
    game.reset();
    setFen(game.fen());
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setThinking(false);
    setWhiteTime(600);
    setBlackTime(600);
    setGameStarted(false);
    setPromotionSquare(null);
    setPremove(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const getStatus = () => {
    if (game.isCheckmate())
      return `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins`;
    if (game.isDraw()) return "Draw";
    if (game.isStalemate()) return "Stalemate";
    if (game.isThreefoldRepetition()) return "Draw by repetition";
    if (game.isInsufficientMaterial()) return "Draw - insufficient material";
    if (game.inCheck())
      return `${game.turn() === "w" ? "White" : "Black"} is in check`;
    if (whiteTime === 0) return "Black wins on time";
    if (blackTime === 0) return "White wins on time";
    return thinking
      ? "Engine thinking..."
      : `${game.turn() === "w" ? "Your" : "Engine's"} turn`;
  };

  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="mx-auto px-4 flex flex-col lg:flex-row items-start justify-center gap-4">
      <div className="flex flex-col items-center">
        {/* Black clock */}
        <div
          className={`flex items-center gap-3 mb-2 w-full max-w-[480px] ${
            !isPlayerTurn && gameStarted ? "" : "opacity-50"
          }`}
        >
          <div className="bg-card border border-border rounded-lg px-3 py-1.5 font-mono text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-foreground" />
            <span className="text-foreground">Engine</span>
          </div>
          {thinking && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-primary/70">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                thinking
              </motion.span>
              <motion.span
                className="flex gap-[2px]"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>.</motion.span>
              </motion.span>
            </span>
          )}
          <div
            className={`ml-auto font-mono text-lg px-3 py-1 rounded-lg border ${
              !isPlayerTurn && gameStarted
                ? "bg-card border-primary/50 text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {formatTime(blackTime)}
          </div>
        </div>

        {/* Board */}
        <div className="relative rounded-lg overflow-hidden border border-border shadow-lg">
          <div className="grid grid-cols-8">
            {ranks.map((rank, ri) =>
              files.map((file, fi) => {
                const square = `${file}${rank}` as Square;
                const piece = game.get(square);
                const isDark = (ri + fi) % 2 === 1;
                const isSelected = selected === square;
                const isLegal = legalMoves.includes(square);
                const isLast =
                  lastMove &&
                  (lastMove.from === square || lastMove.to === square);
                const isPremoveSquare =
                  premove &&
                  (premove.from === square || premove.to === square);

                return (
                  <div
                    key={square}
                    onClick={() => handleSquareClick(square)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, square)}
                    className={`w-[44px] h-[44px] sm:w-[56px] sm:h-[56px] md:w-[60px] md:h-[60px] relative flex items-center justify-center cursor-pointer ${
                      isDark
                        ? "bg-[hsl(261,30%,25%)]"
                        : "bg-[hsl(261,15%,40%)]"
                    } ${isSelected ? "!bg-[hsl(261,80%,40%)]" : ""} ${
                      isLast ? "!bg-[hsl(50,60%,35%,0.5)]" : ""
                    } ${isPremoveSquare ? "!bg-[hsl(200,60%,35%,0.5)]" : ""}`}
                  >
                    {fi === 0 && (
                      <span
                        className={`absolute top-0.5 left-0.5 text-[9px] font-mono ${
                          isDark
                            ? "text-[hsl(261,15%,40%)]"
                            : "text-[hsl(261,30%,25%)]"
                        }`}
                      >
                        {rank}
                      </span>
                    )}
                    {ri === 7 && (
                      <span
                        className={`absolute bottom-0 right-0.5 text-[9px] font-mono ${
                          isDark
                            ? "text-[hsl(261,15%,40%)]"
                            : "text-[hsl(261,30%,25%)]"
                        }`}
                      >
                        {file}
                      </span>
                    )}

                    {isLegal && !piece && (
                      <div className="w-3 h-3 rounded-full bg-[hsl(261,100%,65%,0.4)]" />
                    )}
                    {isLegal && piece && (
                      <div className="absolute inset-0 border-[3px] border-[hsl(261,100%,65%,0.5)] rounded-sm" />
                    )}

                    {piece && (
                      <img
                        src={PIECE_IMAGES[pieceToKey(piece)]}
                        alt=""
                        draggable
                        onDragStart={(e) => handleDragStart(e, square)}
                        className="w-[85%] h-[85%] object-contain select-none drop-shadow-md"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <AnimatePresence>
            {promotionSquare && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10"
              >
                <div className="bg-card border border-border rounded-xl p-4 flex gap-2">
                  {["q", "r", "b", "n"].map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePromotion(p)}
                      className="w-14 h-14 bg-muted/30 hover:bg-primary/20 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <img
                        src={PIECE_IMAGES[`w${p.toUpperCase()}`]}
                        alt={p}
                        className="w-10 h-10"
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* White clock */}
        <div
          className={`flex items-center gap-3 mt-2 w-full max-w-[480px] ${
            isPlayerTurn && gameStarted ? "" : "opacity-50"
          }`}
        >
          <div className="bg-card border border-border rounded-lg px-3 py-1.5 font-mono text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white border border-muted" />
            <span className="text-foreground">You</span>
          </div>
          <div
            className={`ml-auto font-mono text-lg px-3 py-1 rounded-lg border ${
              isPlayerTurn && gameStarted
                ? "bg-card border-primary/50 text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {formatTime(whiteTime)}
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="flex flex-col gap-3 w-[160px] shrink-0">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Status
          </div>
          <div className="font-mono text-xs text-foreground">{getStatus()}</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Moves
          </div>
          <div className="font-mono text-xs text-muted-foreground max-h-48 overflow-y-auto">
            {game
              .history()
              .reduce<string[]>((acc, move, i) => {
                if (i % 2 === 0) acc.push(`${Math.floor(i / 2) + 1}. ${move}`);
                else acc[acc.length - 1] += ` ${move}`;
                return acc;
              }, [])
              .map((line, i) => (
                <div key={i} className="py-0.5">
                  {line}
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={() => setFlipped((f) => !f)}
          className="bg-card border border-border text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 font-mono text-xs transition-colors"
        >
          Flip Board
        </button>
        <button
          onClick={reset}
          className="bg-primary/10 border border-primary/30 text-primary rounded-lg px-3 py-2 font-mono text-xs hover:bg-primary/20 transition-colors"
        >
          New Game
        </button>
      </div>
    </div>
  );
};

export default ChessGame;
