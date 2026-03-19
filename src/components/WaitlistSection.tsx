import { useState } from "react";
import { motion } from "framer-motion";

const WaitlistSection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section id="waitlist" className="relative py-32">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="relative container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              Start competing <span className="text-gradient">for free.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Join the waitlist — takes 10 seconds. Be first when we launch.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6"
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
                  className="bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-lg hover:opacity-90 transition-all glow-purple flex items-center justify-center gap-2"
                >
                  Get started
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex-1 surface-card rounded-lg px-4 py-3 font-mono text-sm text-primary text-center">
                ✓ Locked in. See you on the board.
              </div>
            )}
          </motion.form>

          <p className="font-mono text-xs text-muted-foreground">No credit card required</p>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
