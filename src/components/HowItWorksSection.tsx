import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "Deposit crypto",
    desc: "Fund your account with crypto. Fast, secure, borderless.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v12m-3-9h6m-6 6h6" />
      </svg>
    ),
    panel: (
      <div className="font-mono text-xs space-y-2">
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <span className="text-muted-foreground">Network</span>
          <span className="text-foreground">Solana</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-primary font-bold">$100.00</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <span className="text-muted-foreground">Fee</span>
          <span className="text-success">$0.00</span>
        </div>
        <div className="mt-3 p-2 rounded-md bg-primary/10 border border-primary/20 text-center text-primary">
          Confirm deposit →
        </div>
      </div>
    ),
  },
  {
    num: "02",
    title: "Compete at your level",
    desc: "Matchmaking pairs you with opponents of equal skill. Winnings held in escrow until verified.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    panel: (
      <div className="font-mono text-xs space-y-2">
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">♔</span>
            <span className="text-foreground">you</span>
          </div>
          <span className="text-muted-foreground">ELO 1847</span>
        </div>
        <div className="text-center text-muted-foreground/50 text-[10px]">VS</div>
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center text-[10px]">♚</span>
            <span className="text-foreground">opponent_42</span>
          </div>
          <span className="text-muted-foreground">ELO 1852</span>
        </div>
        <div className="mt-2 p-2 rounded-md bg-success/10 border border-success/20 text-center text-success text-[10px]">
          $50 held in escrow
        </div>
      </div>
    ),
  },
  {
    num: "03",
    title: "Win & withdraw",
    desc: "Collect your winnings. Withdraw anytime. No delays, no drama.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    panel: (
      <div className="font-mono text-xs space-y-2">
        <div className="flex items-center justify-between p-2 rounded-md bg-success/10 border border-success/20">
          <span className="text-success">Victory!</span>
          <span className="text-success font-bold">+$50.00</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
          <span className="text-muted-foreground">Balance</span>
          <span className="text-foreground font-bold">$247.50</span>
        </div>
        <div className="mt-3 p-2 rounded-md bg-primary/10 border border-primary/20 text-center text-primary">
          Withdraw to wallet →
        </div>
      </div>
    ),
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="relative py-28">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <span className="section-label mb-4">Process</span>
        <h2 className="text-4xl md:text-6xl font-black mt-4 tracking-tight">
          Three moves to win.
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="group"
          >
            <div className="feature-panel h-full p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                {step.icon}
                <span className="font-mono text-4xl font-bold text-primary/15 group-hover:text-primary/30 transition-colors">
                  {step.num}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{step.desc}</p>
              
              {/* Interactive panel — supersonic style */}
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                {step.panel}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
