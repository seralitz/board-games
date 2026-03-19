import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const STAKES = ["$1", "$5", "$10", "$25", "$50", "$100"];

interface GameLayoutProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const GameLayout: React.FC<GameLayoutProps> = ({ title, icon, children }) => {
  const [stake, setStake] = useState("$5");

  return (
    <div className="min-h-screen bg-background">
      {/* Compact top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 surface-glass border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5"
            >
              <span className="text-lg">←</span>
              <span className="hidden sm:inline">Games</span>
            </Link>
            <div className="w-px h-5 bg-border" />
            <span className="text-xl">{icon}</span>
            <span className="font-semibold text-foreground">{title}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Panopticon Active badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-full px-3 py-1"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="font-mono text-[10px] text-success tracking-wider uppercase">
                Panopticon Active
              </span>
            </motion.div>

            {/* Stake selector */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
              {STAKES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStake(s)}
                  className={`font-mono text-xs px-2 py-1 rounded-md transition-all ${
                    stake === s
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Panopticon badge */}
      <div className="sm:hidden fixed top-14 left-0 right-0 z-40 flex justify-center py-1.5 surface-glass border-b border-border">
        <div className="flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-full px-3 py-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
          </span>
          <span className="font-mono text-[9px] text-success tracking-wider uppercase">
            Panopticon Active
          </span>
        </div>
      </div>

      {/* Game content */}
      <main className="pt-16 sm:pt-16 pb-8">{children}</main>
    </div>
  );
};

export default GameLayout;
