import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import BoardLogo from "./BoardLogo";

const LIVE_MATCHES = [
  { game: "Chess", p1: "magnus_x", p2: "hikaru99", stake: "$50", status: "LIVE" },
  { game: "Poker", p1: "phil_ivey", p2: "dnegs", stake: "$100", status: "LIVE" },
  { game: "Tetris", p1: "jonas_t", p2: "doremy", stake: "$25", status: "LIVE" },
];

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeMatch, setActiveMatch] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setActiveMatch((p) => (p + 1) % LIVE_MATCHES.length), 3000);
    return () => clearInterval(iv);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 right-0 w-[60%] h-full">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/8 via-primary/3 to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[120px]" />
      </div>
      <div className="absolute inset-0 scanline pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 pt-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          {/* Left: Copy */}
          <div>
            {/* Definition block — supersonic style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="surface-card rounded-xl p-5 inline-block max-w-sm">
                <div className="flex items-center gap-2 mb-2">
                  <BoardLogo size={18} />
                  <span className="font-mono text-xs font-bold text-foreground">board.gg</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  /bɔːrd/ · noun — a platform where skill determines outcome, 
                  not luck, not bots, not cheats.
                </p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6"
            >
              <span className="text-foreground">Compete on</span>
              <br />
              <span className="text-gradient">everything.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed"
            >
              Play skill games against real opponents for real money. 
              Chess. Poker. Tetris. Twelve games. One platform.
            </motion.p>

            {/* CTA */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mb-6"
            >
              {!submitted ? (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-muted border border-border rounded-lg px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-lg hover:opacity-90 transition-all glow-purple flex items-center gap-2"
                  >
                    Get early access
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </>
              ) : (
                <div className="flex-1 surface-card rounded-lg px-4 py-3 font-mono text-sm text-primary text-center border-primary/30">
                  ✓ You're on the list. We'll be in touch.
                </div>
              )}
            </motion.form>

            {/* Panopticon badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-success glow-green animate-pulse-glow" />
                Protected by Panopticon
              </div>
              <span className="text-border">·</span>
              <span className="font-mono text-xs text-muted-foreground">Crypto deposits</span>
            </motion.div>
          </div>

          {/* Right: Interactive panel — supersonic-style feature demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="hidden lg:block"
          >
            <div className="feature-panel p-1">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">board.gg/live</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
                  <span className="font-mono text-[10px] text-success">LIVE</span>
                </div>
              </div>

              {/* Live matches */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-muted-foreground tracking-wider uppercase">Active Matches</span>
                  <span className="font-mono text-xs text-primary">247 online</span>
                </div>

                <div className="space-y-2">
                  {LIVE_MATCHES.map((match, i) => (
                    <motion.div
                      key={match.game}
                      initial={false}
                      animate={{ 
                        borderColor: i === activeMatch ? "hsl(261 100% 65% / 0.4)" : "hsl(240 8% 14%)",
                        backgroundColor: i === activeMatch ? "hsl(261 100% 65% / 0.05)" : "transparent"
                      }}
                      className="flex items-center justify-between p-3 rounded-lg border transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-primary font-bold">{match.game}</span>
                        <span className="text-xs text-muted-foreground">
                          {match.p1} <span className="text-foreground/40">vs</span> {match.p2}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-foreground">{match.stake}</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
                          <span className="font-mono text-[10px] text-success">{match.status}</span>
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Mini chess board */}
                <div className="mt-5 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Featured Match</span>
                    <span className="font-mono text-[10px] text-primary">Move 24 · 2:41</span>
                  </div>
                  <div className="grid grid-cols-8 gap-0 w-full aspect-square max-w-[200px] mx-auto">
                    {Array.from({ length: 64 }).map((_, idx) => {
                      const row = Math.floor(idx / 8);
                      const col = idx % 8;
                      const isLight = (row + col) % 2 === 0;
                      const pieces: Record<number, string> = {
                        0: "♜", 2: "♝", 4: "♚", 7: "♜",
                        9: "♟", 10: "♟", 13: "♟", 14: "♟",
                        27: "♟", 35: "♙",
                        48: "♙", 49: "♙", 51: "♙", 54: "♙", 55: "♙",
                        56: "♖", 58: "♗", 60: "♔", 63: "♖",
                      };
                      return (
                        <div
                          key={idx}
                          className={`aspect-square flex items-center justify-center text-[10px] ${
                            isLight ? "bg-primary/15" : "bg-muted/60"
                          }`}
                        >
                          {pieces[idx] || ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-5 h-8 rounded-full border-2 border-muted-foreground/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-muted-foreground/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
