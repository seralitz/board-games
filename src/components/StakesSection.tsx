import { motion } from "framer-motion";

const STAKES = [
  { amount: 1, label: "Casual", color: "border-muted-foreground/20" },
  { amount: 5, label: "Warm-up", color: "border-muted-foreground/20" },
  { amount: 10, label: "Standard", color: "border-primary/30" },
  { amount: 25, label: "Competitive", color: "border-primary/40" },
  { amount: 50, label: "High stakes", color: "border-primary/50" },
  { amount: 100, label: "Pro", color: "border-primary/60" },
];

const StakesSection = () => (
  <section id="stakes" className="relative py-28">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label mb-4">Stakes</span>
          <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6 tracking-tight">
            You earn what<br />you're good at.
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md leading-relaxed">
            Skill-based, not gambling. Play at your comfort level. 
            Every match is fair, every outcome is earned.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Per game · More tiers coming soon
          </p>
        </motion.div>

        {/* Right: Stakes chips */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          {STAKES.map((stake, i) => (
            <motion.div
              key={stake.amount}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className={`feature-panel p-5 text-center cursor-default select-none hover:border-primary/40 transition-all ${stake.color}`}
            >
              <div className="font-mono font-bold text-2xl md:text-3xl text-foreground mb-1">
                ${stake.amount}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                {stake.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default StakesSection;
