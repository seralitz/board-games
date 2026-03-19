import { motion } from "framer-motion";

const DETECTIONS = [
  { type: "Bot Detection", status: "blocked", player: "user_8291", time: "2s ago" },
  { type: "Move Analysis", status: "clean", player: "magnus_x", time: "5s ago" },
  { type: "Engine Check", status: "clean", player: "hikaru99", time: "8s ago" },
  { type: "Timing Analysis", status: "flagged", player: "anon_4412", time: "12s ago" },
  { type: "Pattern Match", status: "clean", player: "chess_pro1", time: "15s ago" },
];

const PanopticonSection = () => (
  <section id="anti-cheat" className="relative py-28 overflow-hidden">
    {/* Background accent */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
    
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Feature panel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="order-2 lg:order-1"
        >
          <div className="feature-panel p-1">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Panopticon · Live Feed</span>
              </div>
              <span className="font-mono text-[10px] text-primary">247 matches monitored</span>
            </div>

            <div className="p-4 space-y-1.5">
              {DETECTIONS.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center justify-between p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      d.status === "clean" ? "bg-success" : d.status === "blocked" ? "bg-destructive" : "bg-amber-500"
                    }`} />
                    <span className="font-mono text-xs text-foreground">{d.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[10px] text-muted-foreground">{d.player}</span>
                    <span className={`font-mono text-[10px] font-bold uppercase ${
                      d.status === "clean" ? "text-success" : d.status === "blocked" ? "text-destructive" : "text-amber-500"
                    }`}>{d.status}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{d.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats bar */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-foreground">99.7%</div>
                  <div className="font-mono text-[9px] text-muted-foreground uppercase">Clean Rate</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-destructive">12</div>
                  <div className="font-mono text-[9px] text-muted-foreground uppercase">Blocked Today</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-primary">&lt;50ms</div>
                  <div className="font-mono text-[9px] text-muted-foreground uppercase">Latency</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="order-1 lg:order-2"
        >
          <span className="section-label mb-4">Anti-Cheat</span>
          <h2 className="text-4xl md:text-5xl font-black mt-4 tracking-tight mb-6">
            Cheat on <span className="text-gradient">nothing.</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md">
            Panopticon watches every match in real-time. Bot detection, move analysis, 
            timing patterns — all invisible to players, lethal to cheaters.
          </p>

          <div className="space-y-4">
            {[
              { label: "Real-time analysis", desc: "Every move checked against engine patterns in <50ms" },
              { label: "Behavioral detection", desc: "Mouse patterns, timing, and decision trees analyzed" },
              { label: "Zero tolerance", desc: "Cheaters banned instantly. Funds returned to fair players." },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mt-0.5 shrink-0">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l4 4 6-8" stroke="hsl(261 100% 65%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div>
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default PanopticonSection;
