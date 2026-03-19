import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const PASSAGES = [
  "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet at least once.",
  "In the beginning, there was nothing. Then, there was everything. The universe expanded from a single point, creating space, time, and matter.",
  "Programming is the art of telling a computer what to do. Every line of code is a precise instruction, a small step toward solving a larger problem.",
  "The best way to predict the future is to create it. Innovation comes not from waiting for change but from being the change you wish to see.",
  "Music is the universal language of mankind. It speaks to the soul in ways that words alone cannot, bridging cultures and connecting hearts.",
  "The ocean covers more than seventy percent of the surface of the earth. Its depths remain largely unexplored, holding mysteries we can only imagine.",
  "A journey of a thousand miles begins with a single step. Every great achievement started as a simple idea, nurtured by persistence and dedication.",
  "Science is not only a discipline of reason but also one of romance and passion. The desire to understand the universe drives humanity forward.",
  "Time flies over us but leaves its shadow behind. The memories we make today become the stories we tell tomorrow, shaping who we are.",
  "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment one can ever hope to achieve.",
  "The only limit to our realization of tomorrow will be our doubts of today. Let us move forward with strong and active faith in what lies ahead.",
  "Not all those who wander are lost. Sometimes the most scenic route is the one that leads to unexpected discoveries and profound understanding.",
  "Every great developer you know got there by solving problems they were unqualified to solve until they actually did it and learned along the way.",
  "The difference between ordinary and extraordinary is that little extra effort you put in when everyone else has already given up for the day.",
  "Success is not final and failure is not fatal. It is the courage to continue that counts most in the end when everything seems impossible.",
  "Life is what happens to you while you are busy making other plans. Take a moment to appreciate the present before it becomes the past.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. Resilience defines character more than talent ever will.",
  "Code is like humor. When you have to explain it, it is bad. Write code that speaks for itself and others will thank you for years to come.",
  "In three words I can sum up everything I have learned about life: it goes on. No matter what happens, the world keeps turning and so must we.",
  "The purpose of computing is insight, not numbers. Understanding the problem is always more important than finding the fastest possible solution.",
  "Do not go where the path may lead. Go instead where there is no path and leave a trail for others to follow behind you into the unknown.",
  "Talk is cheap. Show me the code. Actions speak louder than words, and working software speaks louder than any amount of documentation.",
  "Chess is the gymnasium of the mind. Every move requires calculation, every sacrifice demands vision, and every game teaches patience and strategy.",
  "The best time to plant a tree was twenty years ago. The second best time is now. Start building today what you want to see flourish tomorrow.",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand clearly and maintain easily.",
  "Simplicity is the ultimate sophistication. The ability to reduce complexity to simplicity is what separates great design from merely good design.",
  "We are what we repeatedly do. Excellence, then, is not an act but a habit that we cultivate through daily practice and unwavering commitment.",
  "The only way to do great work is to love what you do. If you have not found it yet, keep looking and do not settle for anything less.",
  "Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are not smart enough to debug it.",
  "First, solve the problem. Then, write the code. Too many developers rush to implementation before fully understanding what needs to be built.",
  "The measure of intelligence is the ability to change. Adaptability is the single most important skill in a world that never stops evolving.",
  "It does not matter how slowly you go as long as you do not stop. Persistence and consistency will always outperform bursts of unsustainable effort.",
  "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away from the design.",
  "Experience is simply the name we give our mistakes. Every bug you encounter and fix makes you a slightly better programmer than you were before.",
  "The computer was born to solve problems that did not exist before. Now it creates as many problems as it solves, but we would not have it any other way.",
  "Knowledge is power, but enthusiasm pulls the switch. Having skills means nothing without the drive and passion to apply them meaningfully.",
  "Great things are not done by impulse but by a series of small things brought together through careful planning and relentless execution.",
  "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world and opens doors that logic cannot even see.",
  "Before software can be reusable it first has to be usable. Focus on making something that works well before worrying about making it work everywhere.",
  "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable ones.",
];

const TypeRacerGame = ({ onGameEnd }: { onGameEnd?: (r: { won: boolean; score?: number }) => void }) => {
  const [passage, setPassage] = useState("");
  const [cursor, setCursor] = useState(0); // correct chars typed so far
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errors, setErrors] = useState(0);
  const [errorFlash, setErrorFlash] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickPassage = useCallback(() => {
    return PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
  }, []);

  const start = useCallback(() => {
    const p = pickPassage();
    setPassage(p);
    setCursor(0);
    setTotalKeystrokes(0);
    setErrors(0);
    setErrorFlash(false);
    setStarted(true);
    setFinished(false);
    setStartTime(Date.now());
    setWpm(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTick((t) => t + 1), 200);
    setTimeout(() => containerRef.current?.focus(), 50);
  }, [pickPassage]);

  // Auto-start on mount
  useEffect(() => { start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const elapsedSec = started
    ? Math.max(0.1, (Date.now() - startTime) / 1000)
    : 0;

  const accuracy =
    totalKeystrokes > 0 ? Math.round(((totalKeystrokes - errors) / totalKeystrokes) * 100) : 100;
  const currentWpm = started
    ? Math.round(cursor / 5 / (elapsedSec / 60))
    : 0;
  const progress =
    passage.length > 0 ? Math.round((cursor / passage.length) * 100) : 0;

  // Handle keyboard input — only advance on correct character
  useEffect(() => {
    if (!started || finished) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (finished) return;
      // Ignore modifier keys, function keys, etc.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return; // only printable characters
      e.preventDefault();

      setTotalKeystrokes((t) => t + 1);

      if (e.key === passage[cursor]) {
        // Correct character
        const newCursor = cursor + 1;
        setCursor(newCursor);

        // Check if passage complete
        if (newCursor === passage.length) {
          setFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
          const finalWpm = Math.round(newCursor / 5 / ((Date.now() - startTime) / 1000 / 60));
          setWpm(finalWpm);
          onGameEnd?.({ won: true, score: finalWpm });
        }
      } else {
        // Wrong character — flash red, don't advance
        setErrors((e) => e + 1);
        setErrorFlash(true);
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => setErrorFlash(false), 300);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [started, finished, cursor, passage, startTime, onGameEnd]);

  const renderPassage = () => {
    return passage.split("").map((ch, i) => {
      let cls = "text-muted-foreground";
      if (i < cursor) {
        // Already typed correctly
        cls = "text-success";
      } else if (i === cursor) {
        // Current character to type
        cls = errorFlash
          ? "text-destructive bg-destructive/30 rounded-sm"
          : "text-foreground bg-primary/20 rounded-sm";
      }
      return (
        <span key={i} className={`${cls} font-mono`}>
          {ch}
        </span>
      );
    });
  };

  if (!started) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="container mx-auto px-4 flex flex-col items-center max-w-2xl outline-none"
    >
      <div className="flex items-center gap-3 mb-6 w-full">
        <div className="bg-card border border-border rounded-lg px-3 py-2 text-center flex-1">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            WPM
          </div>
          <div className="font-mono text-xl text-primary">
            {finished ? wpm : currentWpm}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg px-3 py-2 text-center flex-1">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            Accuracy
          </div>
          <div
            className={`font-mono text-xl ${
              accuracy >= 95
                ? "text-success"
                : accuracy >= 80
                ? "text-yellow-500"
                : "text-destructive"
            }`}
          >
            {accuracy}%
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg px-3 py-2 text-center flex-1">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            Time
          </div>
          <div className="font-mono text-xl text-foreground">
            {elapsedSec.toFixed(1)}s
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-4 w-full text-base leading-relaxed select-none">
        {renderPassage()}
      </div>

      <div className="w-full bg-muted/30 border border-border rounded-lg px-4 py-3 font-mono text-muted-foreground text-sm">
        {finished ? "Passage complete!" : "Type the highlighted character..."}
      </div>

      {finished && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <div className="text-xl font-bold text-foreground mb-1">
            {wpm >= 80
              ? "Blazing Fast!"
              : wpm >= 50
              ? "Nice Speed!"
              : "Keep Practicing!"}
          </div>
          <div className="font-mono text-sm text-muted-foreground mb-4">
            {wpm} WPM · {accuracy}% accuracy · {errors} errors
          </div>
          <button
            onClick={start}
            className="bg-primary text-primary-foreground rounded-lg px-6 py-2 font-mono text-sm hover:opacity-90 transition-opacity"
          >
            Race Again
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TypeRacerGame;
