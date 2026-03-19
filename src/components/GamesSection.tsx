import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const GAMES = [
  { name: "Chess", icon: "♔", players: "12.4k", color: "from-amber-500/20 to-amber-900/5", slug: "chess" },
  { name: "Poker", icon: "♠", players: "8.2k", color: "from-red-500/20 to-red-900/5" },
  { name: "Backgammon", icon: "⚂", players: "3.1k", color: "from-orange-500/20 to-orange-900/5" },
  { name: "Go", icon: "⚫", players: "5.7k", color: "from-stone-400/20 to-stone-800/5" },
  { name: "Durak", icon: "🃏", players: "2.3k", color: "from-blue-500/20 to-blue-900/5" },
  { name: "Mahjong", icon: "🀄", players: "4.1k", color: "from-emerald-500/20 to-emerald-900/5" },
  { name: "Wordle", icon: "W", players: "9.8k", color: "from-green-500/20 to-green-900/5", slug: "wordle" },
  { name: "Sudoku", icon: "9", players: "6.2k", color: "from-cyan-500/20 to-cyan-900/5" },
  { name: "Tetris", icon: "▣", players: "7.5k", color: "from-pink-500/20 to-pink-900/5", slug: "tetris" },
  { name: "Minesweeper", icon: "💣", players: "3.8k", color: "from-yellow-500/20 to-yellow-900/5", slug: "minesweeper" },
  { name: "2048", icon: "²", players: "5.4k", color: "from-orange-400/20 to-orange-800/5", slug: "2048" },
  { name: "TypeRacer", icon: "⌨", players: "4.6k", color: "from-violet-500/20 to-violet-900/5", slug: "typeracer" },
] as const;

const GamesSection = () => {
  const navigate = useNavigate();

  const handleGameClick = (game: (typeof GAMES)[number]) => {
    if ("slug" in game && game.slug) {
      navigate(`/games/${game.slug}`);
    } else {
      toast("Coming soon", {
        description: `${game.name} is under development`,
      });
    }
  };

  return (
  <section id="games" className="relative py-28 overflow-hidden">
    <div className="container mx-auto px-6">
      {/* Header — supersonic style with label + big headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <span className="section-label mb-4">12 Games</span>
        <h2 className="text-4xl md:text-6xl font-black mt-4 tracking-tight">
          Pick your weapon.
        </h2>
        <p className="text-muted-foreground text-lg mt-4 max-w-lg">
          Every game is pure skill. No RNG, no pay-to-win. Just you vs your opponent.
        </p>
      </motion.div>

      {/* Game grid — two featured + rest */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => handleGameClick(game)}
            className={`group relative rounded-xl border border-border bg-gradient-to-br ${game.color} p-5 cursor-pointer transition-colors hover:border-primary/40 ${
              i < 2 ? "md:col-span-1 lg:row-span-2 lg:aspect-auto" : "aspect-square"
            }`}
          >
            <div className="flex flex-col h-full justify-between">
              <div>
                <span className="text-4xl md:text-5xl opacity-70 group-hover:opacity-100 transition-opacity select-none block mb-3">
                  {game.icon}
                </span>
                <span className="font-semibold text-sm text-foreground">{game.name}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="font-mono text-[10px] text-muted-foreground">{game.players} playing</span>
              </div>
              {!("slug" in game && game.slug) && (
                <span className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider mt-1">
                  Coming soon
                </span>
              )}
            </div>

            {/* Hover glow */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ boxShadow: "inset 0 0 40px hsl(261 100% 65% / 0.1)" }} />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
  );
};

export default GamesSection;
