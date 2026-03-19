const TICKER_ITEMS = [
  { player: "magnus_x", game: "Chess", won: "$50" },
  { player: "tetris_god", game: "Tetris", won: "$25" },
  { player: "phil_ivey", game: "Poker", won: "$100" },
  { player: "sudoku_sam", game: "Sudoku", won: "$10" },
  { player: "go_master", game: "Go", won: "$50" },
  { player: "word_wizard", game: "Wordle", won: "$5" },
  { player: "backgm_pro", game: "Backgammon", won: "$25" },
  { player: "2048_king", game: "2048", won: "$10" },
];

const LiveTicker = () => {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="relative py-4 border-y border-border bg-muted/20 overflow-hidden">
      <div className="marquee-track">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-6 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
            <span className="font-mono text-xs text-muted-foreground">
              <span className="text-foreground font-bold">{item.player}</span> won{" "}
              <span className="text-primary font-bold">{item.won}</span> in {item.game}
            </span>
            <span className="text-border mx-4">·</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;
