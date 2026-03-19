import BoardLogo from "./BoardLogo";

const Footer = () => (
  <footer className="border-t border-border py-10">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <BoardLogo size={20} />
          <span className="font-mono text-sm font-bold text-foreground">board.gg</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground flex-wrap justify-center">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
            Protected by Panopticon
          </span>
          <span className="text-border">·</span>
          <span>Powered by Intermezia</span>
          <span className="text-border">·</span>
          <span>© 2026</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
