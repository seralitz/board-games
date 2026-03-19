import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BoardLogo from "@/components/BoardLogo";
import ChessGame from "@/components/games/ChessGame";
import Game2048 from "@/components/games/Game2048";
import MinesweeperGame from "@/components/games/MinesweeperGame";
import TypeRacerGame from "@/components/games/TypeRacerGame";
import WordleGame from "@/components/games/WordleGame";
import TetrisGame from "@/components/games/TetrisGame";

/* ─── Data ───────────────────────────────────────────── */

const STAKES = ["$1", "$5", "$10", "$25", "$50", "$100"];

interface GameDef {
  name: string;
  icon: string;
  players: string;
  color: string;
  accent: string;
  category: "classic" | "speed";
  slug?: string;
  avgStake: string;
  biggestWin: string;
  matches24h: string;
}

const ALL_GAMES: GameDef[] = [
  { name: "Chess",       icon: "♔", players: "12.4k", color: "from-purple-500/50 via-purple-800/30 to-purple-950/20", accent: "270 70% 55%", category: "classic", slug: "chess",       avgStake: "$18", biggestWin: "$500",   matches24h: "34.2k" },
  { name: "Poker",       icon: "♠", players: "8.2k",  color: "from-red-500/50 via-red-800/30 to-red-950/20",         accent: "0 75% 50%",   category: "classic",                       avgStake: "$32", biggestWin: "$1,200", matches24h: "18.9k" },
  { name: "Backgammon",  icon: "⚂", players: "3.1k",  color: "from-amber-500/50 via-amber-800/30 to-amber-950/20",   accent: "35 80% 50%",  category: "classic",                       avgStake: "$14", biggestWin: "$280",   matches24h: "7.4k"  },
  { name: "Go",          icon: "⚫", players: "5.7k",  color: "from-stone-400/50 via-stone-700/30 to-stone-950/20",   accent: "20 10% 45%",  category: "classic",                       avgStake: "$22", biggestWin: "$450",   matches24h: "12.1k" },
  { name: "Wordle",      icon: "W", players: "9.8k",  color: "from-green-500/50 via-green-800/30 to-green-950/20",   accent: "140 60% 45%", category: "speed",   slug: "wordle",       avgStake: "$8",  biggestWin: "$200",   matches24h: "28.6k" },
  { name: "Tetris",      icon: "▣", players: "7.5k",  color: "from-blue-500/50 via-blue-800/30 to-blue-950/20",     accent: "220 70% 55%", category: "speed",   slug: "tetris",       avgStake: "$12", biggestWin: "$350",   matches24h: "22.3k" },
  { name: "Durak",       icon: "🃏", players: "2.3k",  color: "from-rose-600/50 via-rose-800/30 to-rose-950/20",     accent: "350 70% 50%", category: "classic",                       avgStake: "$10", biggestWin: "$180",   matches24h: "5.1k"  },
  { name: "Mahjong",     icon: "🀄", players: "4.1k",  color: "from-emerald-500/50 via-emerald-800/30 to-emerald-950/20", accent: "160 60% 45%", category: "classic",                   avgStake: "$16", biggestWin: "$320",   matches24h: "9.8k"  },
  { name: "Minesweeper", icon: "💣", players: "3.8k",  color: "from-teal-500/50 via-teal-800/30 to-teal-950/20",     accent: "180 60% 45%", category: "speed",   slug: "minesweeper",  avgStake: "$6",  biggestWin: "$150",   matches24h: "11.7k" },
  { name: "Sudoku",      icon: "9", players: "6.2k",  color: "from-indigo-500/50 via-indigo-800/30 to-indigo-950/20", accent: "240 60% 55%", category: "speed",                        avgStake: "$5",  biggestWin: "$100",   matches24h: "15.4k" },
  { name: "2048",        icon: "²", players: "5.4k",  color: "from-orange-500/50 via-orange-800/30 to-orange-950/20", accent: "25 85% 55%",  category: "speed",   slug: "2048",         avgStake: "$10", biggestWin: "$250",   matches24h: "16.8k" },
  { name: "TypeRacer",   icon: "⌨", players: "4.6k",  color: "from-cyan-500/50 via-cyan-800/30 to-cyan-950/20",     accent: "190 70% 50%", category: "speed",   slug: "typeracer",    avgStake: "$15", biggestWin: "$300",   matches24h: "13.2k" },
];

type GameEndResult = { won: boolean; score?: number; answer?: string };
type GameProps = { onGameEnd?: (r: GameEndResult) => void };

const GAME_COMPONENTS: Record<string, React.FC<GameProps>> = {
  chess: ChessGame,
  wordle: WordleGame,
  tetris: TetrisGame,
  minesweeper: MinesweeperGame,
  "2048": Game2048,
  typeracer: TypeRacerGame,
};

const SPEED_GAMES = new Set(["wordle", "tetris", "minesweeper", "2048", "typeracer"]);

const OPPONENT_NAMES = [
  "DrNykterstein", "CryptoKnight", "BlitzKing", "PuzzleMaster",
  "SpeedDemon22", "TetrisGod", "WordSmith_", "MineHunter",
  "TypeMaster_", "GrandMstr42", "Anon_42", "SweepQueen",
  "RookSlayer", "BlockStack", "Lexicon99", "DarkBishop",
  "QueenGambit", "EndGame_Pro", "NeuralNet42", "ZeroDefect",
];

const SIDEBAR_CLASSIC = ALL_GAMES.filter((g) => g.category === "classic");
const SIDEBAR_SPEED = ALL_GAMES.filter((g) => g.category === "speed");

const LIVE_ACTIVITY = [
  { player: "CryptoKnight", action: "won $50 at", game: "Chess", icon: "♔", time: "just now", color: "text-success" },
  { player: "SpeedDemon22", action: "defeated WordWiz at", game: "Wordle", icon: "W", time: "30s", color: "text-success" },
  { player: "PuzzleMaster", action: "scored 31,284 in", game: "2048", icon: "²", time: "1m", color: "text-primary" },
  { player: "BlitzKing", action: "won $100 at", game: "Chess", icon: "♔", time: "2m", color: "text-success" },
  { player: "TetrisGod", action: "cleared 48 lines in", game: "Tetris", icon: "▣", time: "3m", color: "text-primary" },
  { player: "MineHunter", action: "won $10 at", game: "Minesweeper", icon: "💣", time: "5m", color: "text-success" },
  { player: "TypeMaster_", action: "hit 92 WPM in", game: "TypeRacer", icon: "⌨", time: "6m", color: "text-primary" },
  { player: "GrandMstr42", action: "won $50 at", game: "Chess", icon: "♔", time: "8m", color: "text-success" },
  { player: "Blitz99", action: "won $25 at", game: "Tetris", icon: "▣", time: "9m", color: "text-success" },
  { player: "SweepQueen", action: "cleared expert in", game: "Minesweeper", icon: "💣", time: "11m", color: "text-primary" },
  { player: "Anon_42", action: "won $5 at", game: "Wordle", icon: "W", time: "12m", color: "text-success" },
  { player: "RookSlayer", action: "won $100 at", game: "Chess", icon: "♔", time: "14m", color: "text-success" },
];

const LEADERBOARD = [
  { rank: 1, player: "BlitzKing", rating: 2410, earnings: "$2,450", trend: "up" as const },
  { rank: 2, player: "CryptoKnight", rating: 2380, earnings: "$1,890", trend: "up" as const },
  { rank: 3, player: "PuzzleMaster", rating: 2290, earnings: "$1,230", trend: "down" as const },
  { rank: 4, player: "GrandMstr42", rating: 2250, earnings: "$980", trend: "up" as const },
  { rank: 5, player: "SpeedDemon22", rating: 2180, earnings: "$870", trend: "same" as const },
  { rank: 6, player: "TetrisGod", rating: 2150, earnings: "$750", trend: "up" as const },
  { rank: 7, player: "WordSmith_", rating: 2090, earnings: "$620", trend: "down" as const },
  { rank: 8, player: "MineHunter", rating: 2040, earnings: "$540", trend: "up" as const },
];

const MATCH_HISTORY = [
  { icon: "♔", result: "W" as const, detail: "vs Magnus99", stake: "$10", time: "2m" },
  { icon: "²", result: "W" as const, detail: "31,284 pts", stake: "$5", time: "15m" },
  { icon: "W", result: "L" as const, detail: "vs WordWiz", stake: "$5", time: "1h" },
  { icon: "▣", result: "W" as const, detail: "48,200 pts", stake: "$25", time: "2h" },
  { icon: "⌨", result: "W" as const, detail: "82 WPM", stake: "$10", time: "3h" },
];

const RECENT_WINS = [
  { player: "CryptoKnight", game: "Chess", amount: "$50" },
  { player: "SpeedDemon22", game: "TypeRacer", amount: "$25" },
  { player: "PuzzleMaster", game: "2048", amount: "$10" },
  { player: "BlitzKing", game: "Chess", amount: "$100" },
  { player: "WordSmith_", game: "Wordle", amount: "$5" },
  { player: "TetrisGod", game: "Tetris", amount: "$25" },
  { player: "MineHunter", game: "Minesweeper", amount: "$10" },
  { player: "GrandMstr42", game: "Chess", amount: "$50" },
];

interface LiveMatch {
  p1: { name: string; rating: number };
  p2: { name: string; rating: number };
  game: string;
  icon: string;
  stake: string;
  time: string;
  odds: { p1: number; p2: number };
  pool: string;
  preview: {
    type: "chess" | "wordle" | "tetris" | "typeracer" | "minesweeper" | "2048";
    data: string;
  };
}

const BET_AMOUNTS = ["$1", "$5", "$10", "$25"];

const LIVE_MATCHES: LiveMatch[] = [
  {
    p1: { name: "DrNykterstein", rating: 2840 },
    p2: { name: "CryptoKnight", rating: 2410 },
    game: "Chess", icon: "♔", stake: "$50", time: "4:32",
    odds: { p1: 72, p2: 28 }, pool: "$1,240",
    preview: { type: "chess", data: "r...k..r/pp..bppp/..n.p.../...pP.../..pP..../..N..N../PP...PPP/R.BQK..R" },
  },
  {
    p1: { name: "WordSmith_", rating: 1890 },
    p2: { name: "Lexicon99", rating: 1820 },
    game: "Wordle", icon: "W", stake: "$10", time: "Row 4/6",
    odds: { p1: 55, p2: 45 }, pool: "$320",
    preview: { type: "wordle", data: "CCPAA,AACPA,PCCAA" },
  },
  {
    p1: { name: "TetrisGod", rating: 2150 },
    p2: { name: "BlockStack", rating: 2030 },
    game: "Tetris", icon: "▣", stake: "$25", time: "Lvl 12",
    odds: { p1: 63, p2: 37 }, pool: "$890",
    preview: { type: "tetris", data: "48200|41850" },
  },
  {
    p1: { name: "SpeedDemon22", rating: 2180 },
    p2: { name: "TypeMaster_", rating: 2090 },
    game: "TypeRacer", icon: "⌨", stake: "$25", time: "68%",
    odds: { p1: 58, p2: 42 }, pool: "$560",
    preview: { type: "typeracer", data: "94|87" },
  },
];

/* ─── Lock Icon ──────────────────────────────────────── */

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground/40"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ─── Mini Match Previews ────────────────────────────── */

const MINI_PIECE: Record<string, string> = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙",
};

function MiniChessBoard({ fen }: { fen: string }) {
  const rows = fen.split("/");
  const cells: (string | null)[][] = rows.map((row) => {
    const out: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let j = 0; j < parseInt(ch); j++) out.push(null);
      } else {
        out.push(ch);
      }
    }
    return out;
  });

  // Show a 4x4 center crop (ranks 2-5, files c-f) for compactness
  const startR = 2, startC = 2;
  return (
    <div className="grid grid-cols-4 gap-px rounded overflow-hidden">
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 4 }).map((_, c) => {
          const piece = cells[startR + r]?.[startC + c];
          const dark = (r + c) % 2 === 1;
          return (
            <div
              key={`${r}-${c}`}
              className={`w-full aspect-square flex items-center justify-center text-[10px] leading-none ${
                dark ? "bg-[hsl(261,30%,22%)]" : "bg-[hsl(261,15%,35%)]"
              }`}
            >
              {piece && (
                <span className={piece === piece.toUpperCase() ? "text-white/90" : "text-white/50"}>
                  {MINI_PIECE[piece] || ""}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function MiniWordle({ rows }: { rows: string }) {
  // rows = "CCPAA,AACPA,PCCAA" — C=correct, P=present, A=absent
  const parsed = rows.split(",");
  const colors: Record<string, string> = {
    C: "bg-success",
    P: "bg-yellow-600",
    A: "bg-muted/40",
  };
  return (
    <div className="flex flex-col gap-px">
      {parsed.map((row, ri) => (
        <div key={ri} className="flex gap-px">
          {row.split("").map((ch, ci) => (
            <div
              key={ci}
              className={`flex-1 aspect-square rounded-[2px] ${colors[ch] || "bg-muted/20"}`}
            />
          ))}
        </div>
      ))}
      {/* Empty remaining rows */}
      {Array.from({ length: 6 - parsed.length }).map((_, ri) => (
        <div key={`e${ri}`} className="flex gap-px">
          {Array.from({ length: 5 }).map((_, ci) => (
            <div key={ci} className="flex-1 aspect-square rounded-[2px] bg-muted/10" />
          ))}
        </div>
      ))}
    </div>
  );
}

function MiniScoreBattle({
  data,
  label,
  p1,
  p2,
}: {
  data: string;
  label: string;
  p1: string;
  p2: string;
}) {
  const [s1, s2] = data.split("|");
  const v1 = parseFloat(s1.replace(/,/g, ""));
  const v2 = parseFloat(s2.replace(/,/g, ""));
  const max = Math.max(v1, v2) || 1;
  return (
    <div className="space-y-1.5">
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-mono text-[9px] text-muted-foreground truncate max-w-[60%]">
            {p1}
          </span>
          <span className="font-mono text-[10px] text-success font-bold">{s1} {label}</span>
        </div>
        <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${(v1 / max) * 100}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-mono text-[9px] text-muted-foreground truncate max-w-[60%]">
            {p2}
          </span>
          <span className="font-mono text-[10px] text-foreground font-bold">{s2} {label}</span>
        </div>
        <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/60 rounded-full transition-all"
            style={{ width: `${(v2 / max) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar Game List ──────────────────────────────── */

function SidebarGameList({
  label,
  games,
  activeGame,
  onSelect,
}: {
  label: string;
  games: GameDef[];
  activeGame: string | null;
  onSelect: (g: GameDef) => void;
}) {
  return (
    <div>
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider px-2">
        {label}
      </span>
      <div className="mt-2 flex flex-col gap-0.5">
        {games.map((game) => (
          <button
            key={game.name}
            onClick={() => game.slug && onSelect(game)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeGame === game.slug
                ? "bg-primary/15 text-foreground border border-primary/30"
                : game.slug
                ? "hover:bg-muted/30 text-foreground"
                : "text-muted-foreground cursor-default opacity-50"
            }`}
          >
            <span className="text-lg w-6 text-center select-none">
              {game.icon}
            </span>
            <span className="text-sm font-medium flex-1">{game.name}</span>
            {game.slug ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  {game.players}
                </span>
              </span>
            ) : (
              <LockIcon />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Bot Panel for Speed Games ─────────────────────── */

function BotPanel({ game, opponent, onBotFinish }: { game: string; opponent: { name: string; rating: number }; onBotFinish?: () => void }) {
  const [botScore, setBotScore] = useState(0);
  const [botProgress, setBotProgress] = useState(0);
  const [botStatus, setBotStatus] = useState("Playing...");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    const configs: Record<string, { tickMs: number; scorePerTick: () => number; maxProgress: number; label: string }> = {
      wordle:      { tickMs: 5000, scorePerTick: () => 1, maxProgress: Infinity, label: "Row" },
      tetris:      { tickMs: 1200, scorePerTick: () => Math.floor(Math.random() * 400) + 100, maxProgress: Infinity, label: "Score" },
      "2048":      { tickMs: 800,  scorePerTick: () => Math.floor(Math.random() * 200) + 50, maxProgress: 999, label: "Score" },
      minesweeper: { tickMs: 1500, scorePerTick: () => Math.floor(Math.random() * 3) + 1, maxProgress: 71, label: "Cells" },
      typeracer:   { tickMs: 400,  scorePerTick: () => 1, maxProgress: 100, label: "Progress" },
    };
    const cfg = configs[game] || configs.tetris;
    let prog = 0;
    let sc = 0;

    intervalRef.current = setInterval(() => {
      const inc = cfg.scorePerTick();
      sc += inc;
      prog += game === "wordle" ? 1 : game === "typeracer" ? 1 : inc;
      setBotScore(sc);
      setBotProgress(Math.min(prog, cfg.maxProgress));
      if (prog >= cfg.maxProgress) {
        setBotStatus("Finished!");
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!finishedRef.current) {
          finishedRef.current = true;
          onBotFinish?.();
        }
      }
    }, cfg.tickMs);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [game]);

  const labels: Record<string, string[]> = {
    wordle: ["Guesses", "/ 6"],
    tetris: ["Score", "pts"],
    "2048": ["Score", "pts"],
    minesweeper: ["Cleared", "cells"],
    typeracer: ["Progress", "%"],
  };
  const [lbl, unit] = labels[game] || ["Score", ""];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
      {/* Opponent avatar */}
      <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
        <span className="font-mono text-lg text-primary font-bold">{opponent.name[0]}</span>
      </div>
      <div className="text-center">
        <div className="font-mono text-sm text-foreground font-bold">{opponent.name}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{opponent.rating} ELO</div>
      </div>

      {/* Live stats */}
      <div className="w-full max-w-[200px] space-y-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="font-mono text-[9px] text-muted-foreground uppercase">{lbl}</div>
          <div className="font-mono text-2xl text-foreground font-black">
            {game === "wordle" ? `${botProgress}` : game === "typeracer" ? `${botProgress}%` : botScore.toLocaleString()}
          </div>
          <div className="font-mono text-[9px] text-muted-foreground">{unit}</div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/60 rounded-full"
            animate={{ width: `${Math.min((botProgress / (game === "wordle" ? 6 : game === "typeracer" ? 100 : game === "minesweeper" ? 71 : 50000)) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="text-center">
          <span className={`font-mono text-[10px] ${botStatus === "Finished!" ? "text-success" : "text-muted-foreground"}`}>
            {botStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Lobby Component ────────────────────────────────── */

type GamePhase = "lobby" | "matchmaking" | "matched" | "playing" | "result";

const Index = () => {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("lobby");
  const [stake, setStake] = useState("$5");
  const [betStake, setBetStake] = useState("$5");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [opponent, setOpponent] = useState<{ name: string; rating: number } | null>(null);
  const [gameResult, setGameResult] = useState<{ won: boolean; ratingChange: number; moneyChange: string; answer?: string } | null>(null);
  const gameEndedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const activeGameDef = activeSlug
    ? ALL_GAMES.find((g) => g.slug === activeSlug)
    : null;
  const ActiveComponent = activeSlug ? GAME_COMPONENTS[activeSlug] : null;
  const isSpeedGame = activeSlug ? SPEED_GAMES.has(activeSlug) : false;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const resetToLobby = useCallback(() => {
    clearTimers();
    setActiveSlug(null);
    setGamePhase("lobby");
    setOpponent(null);
    setGameResult(null);
  }, [clearTimers]);

  const handleGameClick = useCallback((game: GameDef) => {
    if (!game.slug) return;
    clearTimers();
    setSidebarOpen(false);
    setActiveSlug(game.slug);
    setGameResult(null);
    gameEndedRef.current = false;

    // Generate random opponent
    const name = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
    const rating = 1300 + Math.floor(Math.random() * 900);
    setOpponent({ name, rating });
    setGamePhase("matchmaking");

    // Matchmaking → Matched → Playing
    const t1 = setTimeout(() => setGamePhase("matched"), 3000);
    const t2 = setTimeout(() => setGamePhase("playing"), 4500);
    timersRef.current = [t1, t2];
  }, [clearTimers]);

  const handleGameEnd = useCallback((result: GameEndResult) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;
    const won = result.won;
    const ratingChange = won
      ? Math.floor(Math.random() * 13) + 12
      : -(Math.floor(Math.random() * 12) + 8);
    const stakeNum = parseInt(stake.replace("$", ""));
    const moneyChange = won ? `+$${stakeNum * 2}` : `-$${stakeNum}`;
    setGameResult({ won, ratingChange, moneyChange, answer: result.answer });
    setGamePhase("result");
  }, [stake]);

  const handleBotFinish = useCallback(() => {
    handleGameEnd({ won: false });
  }, [handleGameEnd]);

  const playAgain = useCallback(() => {
    if (activeGameDef) handleGameClick(activeGameDef);
  }, [activeGameDef, handleGameClick]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="h-13 shrink-0 border-b border-border surface-glass flex items-center px-4 gap-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3" width="20" height="2" rx="1" />
            <rect y="9" width="20" height="2" rx="1" />
            <rect y="15" width="20" height="2" rx="1" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <BoardLogo size={26} />
          <span className="font-bold text-foreground tracking-tight text-sm">
            board.gg
          </span>
        </div>

        <div className="flex-1" />

        <div className="hidden sm:flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-full px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="font-mono text-[10px] text-success tracking-wider uppercase">
            Panopticon Active
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="font-mono text-[11px]">48.2k online</span>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
          <span className="font-mono text-[10px] text-muted-foreground uppercase hidden sm:inline">
            Bal
          </span>
          <span className="font-mono text-sm text-foreground">$124.50</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* ─── Mobile Overlay ─── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ─── Sidebar ─── */}
        <aside
          className={`
            w-[260px] shrink-0 border-r border-border bg-card/50 overflow-y-auto
            fixed lg:relative inset-y-[52px] left-0 z-40 transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="p-4 flex flex-col gap-5">
            <SidebarGameList
              label="Classic"
              games={SIDEBAR_CLASSIC}
              activeGame={activeSlug}
              onSelect={handleGameClick}
            />
            <SidebarGameList
              label="Speed"
              games={SIDEBAR_SPEED}
              activeGame={activeSlug}
              onSelect={handleGameClick}
            />

            <div className="h-px bg-border" />

            {/* Player Profile — compact */}
            <div className="bg-card border border-border rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-mono text-[10px] text-primary font-bold">
                  P
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">
                    Player_001
                  </div>
                  <div className="font-mono text-[9px] text-muted-foreground">
                    Gold III · 1500
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="font-mono text-[10px] text-foreground font-bold">62%</div>
                  <div className="font-mono text-[8px] text-muted-foreground uppercase">Win</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-foreground font-bold">247</div>
                  <div className="font-mono text-[8px] text-muted-foreground uppercase">Games</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-primary font-bold">$124</div>
                  <div className="font-mono text-[8px] text-muted-foreground uppercase">Won</div>
                </div>
              </div>
            </div>

            {/* Match History */}
            <div>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider px-2">
                Recent Matches
              </span>
              <div className="mt-2 flex flex-col gap-1">
                {MATCH_HISTORY.map((match, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 transition-colors"
                  >
                    <span className="text-sm w-5 text-center select-none">{match.icon}</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        match.result === "W"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {match.result}
                    </span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {match.detail}
                    </span>
                    <span className="font-mono text-[10px] text-foreground">{match.stake}</span>
                    <span className="font-mono text-[9px] text-muted-foreground/50">{match.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ─── Center Content ─── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {gamePhase !== "lobby" && activeSlug && activeGameDef ? (
              <motion.div
                key={`game-${activeSlug}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col relative"
              >
                {/* ─── Game Toolbar ─── */}
                <div className="shrink-0 border-b border-border surface-glass px-4 py-2 flex items-center gap-3 z-10">
                  <button
                    onClick={resetToLobby}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-lg">←</span>
                    <span className="hidden sm:inline">Lobby</span>
                  </button>
                  <div className="w-px h-5 bg-border" />
                  <span className="text-xl">{activeGameDef.icon}</span>
                  <span className="font-semibold text-foreground text-sm">
                    {activeGameDef.name}
                  </span>
                  {opponent && (
                    <div className="flex items-center gap-1.5 ml-2 bg-card border border-border rounded-full px-2.5 py-0.5">
                      <span className="font-mono text-[10px] text-muted-foreground">vs</span>
                      <span className="font-mono text-[10px] text-foreground font-bold">{opponent.name}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">{opponent.rating}</span>
                    </div>
                  )}
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
                    <span className="font-mono text-[9px] text-muted-foreground px-1.5">Stake</span>
                    <span className="font-mono text-xs text-primary font-bold px-1.5">{stake}</span>
                  </div>
                </div>

                {/* ─── Matchmaking Phase ─── */}
                {gamePhase === "matchmaking" && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    {/* Pulsing radar */}
                    <div className="relative w-24 h-24">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/30"
                        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/20"
                        animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                      />
                      <div className="absolute inset-0 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <span className="text-3xl">{activeGameDef.icon}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <motion.div
                        className="font-mono text-lg text-foreground font-bold"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Finding opponent...
                      </motion.div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-2">
                        Stake: {stake} · {activeGameDef.players} online
                      </div>
                    </div>
                    {/* Fake progress bar */}
                    <div className="w-48 h-1 bg-muted/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 3, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}

                {/* ─── Matched Phase ─── */}
                {gamePhase === "matched" && opponent && (
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="font-mono text-xs text-success uppercase tracking-widest font-bold">
                        Match Found!
                      </div>
                      <div className="flex items-center gap-8">
                        {/* Player */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                            <span className="font-mono text-xl text-primary font-bold">P</span>
                          </div>
                          <div className="text-center">
                            <div className="font-mono text-sm text-foreground font-bold">Player_001</div>
                            <div className="font-mono text-[10px] text-muted-foreground">1500 ELO</div>
                          </div>
                        </div>
                        {/* VS */}
                        <motion.span
                          className="font-black text-2xl text-primary/60"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        >
                          VS
                        </motion.span>
                        {/* Opponent */}
                        <div className="flex flex-col items-center gap-2">
                          <motion.div
                            className="w-14 h-14 rounded-full bg-destructive/20 border-2 border-destructive/40 flex items-center justify-center"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                            <span className="font-mono text-xl text-destructive font-bold">{opponent.name[0]}</span>
                          </motion.div>
                          <div className="text-center">
                            <div className="font-mono text-sm text-foreground font-bold">{opponent.name}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">{opponent.rating} ELO</div>
                          </div>
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {activeGameDef.name} · Stake: {stake}
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* ─── Playing Phase ─── */}
                {gamePhase === "playing" && ActiveComponent && (
                  <div className="flex-1 overflow-y-auto flex">
                    {isSpeedGame && opponent ? (
                      <>
                        {/* Player side */}
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                          <div className="shrink-0 px-3 py-1.5 border-b border-border flex items-center gap-2 bg-card/50">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="font-mono text-[8px] text-primary font-bold">P</span>
                            </div>
                            <span className="font-mono text-[10px] text-foreground font-bold">You</span>
                            <span className="font-mono text-[9px] text-muted-foreground">1500</span>
                          </div>
                          <div className="flex-1 overflow-y-auto py-4">
                            <ActiveComponent onGameEnd={handleGameEnd} />
                          </div>
                        </div>
                        {/* Divider */}
                        <div className="w-px bg-border shrink-0" />
                        {/* Bot side */}
                        <div className="w-[280px] shrink-0 flex flex-col border-l border-border bg-card/30">
                          <div className="shrink-0 px-3 py-1.5 border-b border-border flex items-center gap-2 bg-card/50">
                            <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center">
                              <span className="font-mono text-[8px] text-destructive font-bold">{opponent.name[0]}</span>
                            </div>
                            <span className="font-mono text-[10px] text-foreground font-bold">{opponent.name}</span>
                            <span className="font-mono text-[9px] text-muted-foreground">{opponent.rating}</span>
                          </div>
                          <div className="flex-1">
                            <BotPanel game={activeSlug!} opponent={opponent} onBotFinish={handleBotFinish} />
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Chess / non-speed: full width */
                      <div className="flex-1 overflow-y-auto py-4">
                        <ActiveComponent onGameEnd={handleGameEnd} />
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Result Popup Overlay ─── */}
                <AnimatePresence>
                  {gamePhase === "result" && gameResult && opponent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-background/80 backdrop-blur-sm z-30 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                        className={`bg-card border-2 rounded-2xl p-6 max-w-sm w-full mx-4 text-center ${
                          gameResult.won ? "border-success/40" : "border-destructive/40"
                        }`}
                        style={{
                          boxShadow: gameResult.won
                            ? "0 0 60px hsl(142 70% 45% / 0.15)"
                            : "0 0 60px hsl(0 70% 45% / 0.15)",
                        }}
                      >
                        {/* Result header */}
                        <div className="mb-4">
                          <span className="text-4xl">{gameResult.won ? "🏆" : "💀"}</span>
                          <div className={`font-black text-2xl mt-2 ${gameResult.won ? "text-success" : "text-destructive"}`}>
                            {gameResult.won ? "VICTORY!" : "DEFEAT"}
                          </div>
                        </div>

                        {/* Players */}
                        <div className="flex items-center justify-center gap-4 mb-4 text-sm">
                          <span className="font-mono text-foreground font-bold">Player_001</span>
                          <span className="text-muted-foreground/40">vs</span>
                          <span className="font-mono text-foreground font-bold">{opponent.name}</span>
                        </div>

                        {/* Wordle answer */}
                        {gameResult.answer && (
                          <div className="mb-4 bg-muted/10 rounded-xl px-4 py-2.5">
                            <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">The word was</div>
                            <div className="font-mono text-2xl font-black text-foreground tracking-widest">{gameResult.answer}</div>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="bg-muted/10 rounded-xl p-3">
                            <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">Rating</div>
                            <div className={`font-mono text-xl font-black ${gameResult.ratingChange > 0 ? "text-success" : "text-destructive"}`}>
                              {gameResult.ratingChange > 0 ? "+" : ""}{gameResult.ratingChange}
                            </div>
                          </div>
                          <div className="bg-muted/10 rounded-xl p-3">
                            <div className="font-mono text-[9px] text-muted-foreground uppercase mb-1">Stake</div>
                            <div className={`font-mono text-xl font-black ${gameResult.won ? "text-success" : "text-destructive"}`}>
                              {gameResult.moneyChange}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={playAgain}
                            className="flex-1 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Play Again
                          </button>
                          <button
                            onClick={resetToLobby}
                            className="flex-1 bg-muted/20 text-foreground font-mono text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg hover:bg-muted/30 transition-colors border border-border"
                          >
                            Lobby
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* ─── Lobby — Trading Terminal ─── */
              <motion.div
                key="lobby"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col p-3 gap-3 overflow-hidden"
              >
                {/* Top row: Game Grid (left) + Right Panel */}
                <div className="flex-1 flex gap-3 min-h-0">
                  {/* ─── 4×3 Compact Game Grid ─── */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 grid-rows-3 gap-2.5 min-w-0">
                    {ALL_GAMES.map((game, i) => {
                      const playable = !!game.slug;
                      return (
                        <motion.div
                          key={game.name}
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.025, duration: 0.35 }}
                          whileHover={
                            playable
                              ? { y: -5, scale: 1.03, transition: { duration: 0.15 } }
                              : {}
                          }
                          onClick={() => playable && handleGameClick(game)}
                          className={`group relative rounded-xl border bg-gradient-to-br ${game.color} flex flex-col items-center p-2.5 transition-all overflow-hidden ${
                            playable
                              ? "border-white/[0.08] cursor-pointer hover:border-white/20"
                              : "border-white/[0.03] cursor-default grayscale opacity-40"
                          }`}
                          style={{
                            boxShadow: playable
                              ? `inset 0 1px 0 hsl(${game.accent} / 0.15), inset 0 0 40px hsl(${game.accent} / 0.08), 0 0 0 1px hsl(${game.accent} / 0.05)`
                              : undefined,
                          }}
                        >
                          {/* Live badge — top-right */}
                          {playable && (
                            <div className="absolute top-1.5 right-2 flex items-center gap-1 z-10">
                              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                              <span className="font-mono text-[8px] text-success font-bold">{game.players}</span>
                            </div>
                          )}
                          {!playable && (
                            <div className="absolute top-2 right-2 z-10">
                              <LockIcon />
                            </div>
                          )}

                          {/* Large centered icon — the visual focus */}
                          <div className="flex-1 flex items-center justify-center py-1">
                            <span
                              className={`select-none transition-transform duration-200 ${
                                playable ? "group-hover:scale-115 drop-shadow-[0_0_20px_hsl(var(--glow))]" : ""
                              }`}
                              style={{
                                fontSize: "3.2rem",
                                lineHeight: 1,
                                filter: playable ? `drop-shadow(0 0 12px hsl(${game.accent} / 0.4))` : "none",
                                ["--glow" as string]: game.accent,
                              }}
                            >
                              {game.icon}
                            </span>
                          </div>

                          {/* Bold name */}
                          <span className={`font-black text-sm tracking-tight text-center leading-none ${playable ? "text-foreground" : "text-muted-foreground/40"}`}>
                            {game.name}
                          </span>

                          {/* Compact stats */}
                          {playable ? (
                            <div className="w-full flex items-center justify-between mt-1.5 px-0.5">
                              <span className="font-mono text-[8px] text-muted-foreground/70">
                                avg <span className="text-foreground font-bold text-[9px]">{game.avgStake}</span>
                              </span>
                              <span className="font-mono text-[8px] text-muted-foreground/70">
                                top <span className="text-success font-bold text-[9px]">{game.biggestWin}</span>
                              </span>
                              <span className="font-mono text-[8px] text-muted-foreground/70">
                                <span className="text-foreground text-[9px]">{game.matches24h}</span>/24h
                              </span>
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-center mt-1.5">
                              <span className="font-mono text-[8px] text-muted-foreground/25 uppercase tracking-widest">
                                Coming Soon
                              </span>
                            </div>
                          )}

                          {/* Play button */}
                          {playable && (
                            <button
                              className="mt-1.5 w-full rounded-lg py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all border"
                              style={{
                                background: `linear-gradient(135deg, hsl(${game.accent} / 0.15), hsl(${game.accent} / 0.05))`,
                                borderColor: `hsl(${game.accent} / 0.25)`,
                                color: `hsl(${game.accent})`,
                              }}
                            >
                              Play
                            </button>
                          )}

                          {/* Hover glow — intensifies on hover */}
                          <div
                            className="absolute inset-0 rounded-xl transition-opacity pointer-events-none opacity-0 group-hover:opacity-100"
                            style={{
                              boxShadow: `inset 0 0 60px hsl(${game.accent} / 0.15), 0 0 30px hsl(${game.accent} / 0.08)`,
                            }}
                          />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* ─── Right Panel: Live Betting + Leaderboard ─── */}
                  <div className="hidden xl:flex flex-col gap-2 w-[300px] shrink-0">
                    {/* ── Spectator Betting Header ── */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden shrink-0">
                      <div className="px-3 py-2 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="font-mono text-[10px] text-foreground uppercase tracking-wider font-bold">
                          Live Betting
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground ml-auto">
                          {LIVE_MATCHES.length} matches
                        </span>
                      </div>
                      {/* Bet stake selector */}
                      <div className="px-3 pb-2 flex items-center gap-1">
                        <span className="font-mono text-[8px] text-muted-foreground uppercase mr-1">Stake:</span>
                        {BET_AMOUNTS.map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setBetStake(amt)}
                            className={`font-mono text-[9px] px-2 py-0.5 rounded transition-all ${
                              betStake === amt
                                ? "bg-primary text-primary-foreground font-bold"
                                : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Live Match Cards with Betting ── */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
                      {LIVE_MATCHES.map((match, i) => (
                        <div
                          key={i}
                          className="bg-card border border-border rounded-lg p-2.5 hover:border-border/80 transition-colors shrink-0"
                        >
                          {/* Game + stake + pool */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm select-none">{match.icon}</span>
                              <span className="font-mono text-[9px] text-muted-foreground">{match.game}</span>
                              <span className="font-mono text-[8px] text-muted-foreground/40">·</span>
                              <span className="font-mono text-[9px] text-muted-foreground">{match.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[8px] text-muted-foreground">pool</span>
                              <span className="font-mono text-[9px] text-success font-bold">{match.pool}</span>
                            </div>
                          </div>

                          {/* Players row */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="min-w-0">
                              <div className="font-mono text-[10px] text-foreground font-bold truncate">{match.p1.name}</div>
                              <div className="font-mono text-[8px] text-muted-foreground">{match.p1.rating}</div>
                            </div>
                            <span className="font-mono text-[9px] text-muted-foreground/30 px-2">vs</span>
                            <div className="min-w-0 text-right">
                              <div className="font-mono text-[10px] text-foreground font-bold truncate">{match.p2.name}</div>
                              <div className="font-mono text-[8px] text-muted-foreground">{match.p2.rating}</div>
                            </div>
                          </div>

                          {/* Odds bar — Polymarket style */}
                          <div className="flex h-1.5 rounded-full overflow-hidden mb-2">
                            <div
                              className="bg-emerald-500 transition-all"
                              style={{ width: `${match.odds.p1}%` }}
                            />
                            <div
                              className="bg-rose-500 transition-all"
                              style={{ width: `${match.odds.p2}%` }}
                            />
                          </div>

                          {/* Bet buttons — YES/NO Polymarket style */}
                          <div className="flex gap-1.5">
                            <button className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-md py-1.5 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all group/btn">
                              <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">
                                {match.odds.p1}¢
                              </span>
                              <span className="font-mono text-[8px] text-emerald-400/60 group-hover/btn:text-emerald-400 transition-colors uppercase">
                                Yes
                              </span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/25 rounded-md py-1.5 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all group/btn">
                              <span className="font-mono text-[10px] text-rose-400 font-bold uppercase">
                                {match.odds.p2}¢
                              </span>
                              <span className="font-mono text-[8px] text-rose-400/60 group-hover/btn:text-rose-400 transition-colors uppercase">
                                No
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Compact Leaderboard ── */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shrink-0 max-h-[180px]">
                      <div className="px-3 py-1.5 border-b border-border flex items-center gap-2 shrink-0">
                        <span className="text-[10px]">🏆</span>
                        <span className="font-mono text-[9px] text-foreground uppercase tracking-wider font-bold">
                          Leaderboard
                        </span>
                        <span className="font-mono text-[8px] text-muted-foreground ml-auto">
                          this week
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                        {LEADERBOARD.map((entry) => (
                          <div
                            key={entry.rank}
                            className="px-3 py-1 flex items-center gap-2 hover:bg-muted/10 transition-colors"
                          >
                            <span
                              className={`font-mono text-[9px] font-bold w-3 text-center ${
                                entry.rank === 1
                                  ? "text-yellow-400"
                                  : entry.rank === 2
                                  ? "text-gray-300"
                                  : entry.rank === 3
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {entry.rank}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-foreground font-medium truncate block">
                                {entry.player}
                              </span>
                            </div>
                            <span className="font-mono text-[9px] text-success font-bold shrink-0">
                              {entry.earnings}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Bottom Ticker ─── */}
          <div className="shrink-0 border-t border-border bg-card/30 overflow-hidden h-9 flex items-center">
            <div className="marquee-track">
              {[...RECENT_WINS, ...RECENT_WINS].map((win, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap px-6 font-mono text-xs text-muted-foreground"
                >
                  <span className="text-foreground">{win.player}</span>
                  {" won "}
                  <span className="text-success font-bold">{win.amount}</span>
                  {" at "}
                  <span className="text-foreground">{win.game}</span>
                  <span className="mx-4 text-border/50">|</span>
                </span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
