import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ANSWERS, VALID_GUESSES } from "./wordle-words";

function getTarget(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

type LetterState = "correct" | "present" | "absent" | "empty";

function evaluate(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(5).fill("absent");
  const used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === target[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","DEL"],
];

const STATE_COLORS: Record<LetterState, string> = {
  correct: "bg-success text-white border-success",
  present: "bg-yellow-600 text-white border-yellow-600",
  absent: "bg-muted text-muted-foreground border-border",
  empty: "bg-card border-border text-foreground",
};

const WordleGame = ({ onGameEnd }: { onGameEnd?: (r: { won: boolean; score?: number; answer?: string }) => void }) => {
  const [target, setTarget] = useState(getTarget);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [results, setResults] = useState<LetterState[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);

  const keyStates = useCallback((): Record<string, LetterState> => {
    const states: Record<string, LetterState> = {};
    guesses.forEach((guess, gi) => {
      guess.split("").forEach((ch, ci) => {
        const s = results[gi]?.[ci];
        if (!s) return;
        const prev = states[ch];
        if (s === "correct" || !prev || prev === "empty") {
          states[ch] = s;
        } else if (s === "present" && prev !== "correct") {
          states[ch] = s;
        }
      });
    });
    return states;
  }, [guesses, results]);

  const submit = useCallback(() => {
    if (current.length !== 5) return;
    if (!VALID_GUESSES.has(current)) {
      setShake(true);
      setMessage("Not in word list");
      setTimeout(() => { setShake(false); setMessage(""); }, 1500);
      return;
    }
    const result = evaluate(current, target);
    const newGuesses = [...guesses, current];
    const newResults = [...results, result];
    setGuesses(newGuesses);
    setResults(newResults);
    setCurrent("");
    if (current === target) {
      setGameOver(true);
      setMessage("Brilliant!");
      onGameEnd?.({ won: true, score: newGuesses.length, answer: target });
    } else if (newGuesses.length >= 6) {
      setGameOver(true);
      setMessage(target);
      onGameEnd?.({ won: false, score: 6, answer: target });
    }
  }, [current, target, guesses, results]);

  const handleKey = useCallback((key: string) => {
    if (gameOver) return;
    if (key === "ENTER") { submit(); return; }
    if (key === "DEL" || key === "BACKSPACE") { setCurrent((c) => c.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(key) && current.length < 5) setCurrent((c) => c + key);
  }, [gameOver, current, submit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k === "ENTER" || k === "BACKSPACE" || /^[A-Z]$/.test(k)) {
        e.preventDefault();
        handleKey(k);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleKey]);

  const reset = () => {
    setTarget(getTarget());
    setGuesses([]);
    setResults([]);
    setCurrent("");
    setGameOver(false);
    setMessage("");
  };

  const ks = keyStates();

  return (
    <div className="container mx-auto px-4 flex flex-col items-center">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-card border border-border rounded-lg px-4 py-2 font-mono text-sm text-foreground"
        >
          {message}
        </motion.div>
      )}

      <div className="grid grid-rows-6 gap-1.5 mb-6">
        {Array.from({ length: 6 }).map((_, row) => {
          const guess = guesses[row];
          const isCurrentRow = row === guesses.length && !gameOver;
          const word = guess || (isCurrentRow ? current.padEnd(5, " ") : "     ");
          const result = results[row];

          return (
            <motion.div
              key={row}
              className="flex gap-1.5"
              animate={shake && isCurrentRow ? { x: [0, -8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {word.split("").map((ch, ci) => {
                const state = result?.[ci] || "empty";
                return (
                  <motion.div
                    key={ci}
                    initial={result ? { rotateX: 90 } : false}
                    animate={result ? { rotateX: 0 } : {}}
                    transition={{ delay: ci * 0.15, duration: 0.3 }}
                    className={`w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-colors ${
                      STATE_COLORS[state]
                    } ${isCurrentRow && ch.trim() ? "border-muted-foreground" : ""}`}
                  >
                    {ch.trim() || ""}
                  </motion.div>
                );
              })}
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 w-full max-w-[500px]">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {row.map((key) => {
              const state = ks[key] || "empty";
              const isWide = key === "ENTER" || key === "DEL";
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className={`${
                    isWide
                      ? "px-3 text-[10px]"
                      : "w-[32px] sm:w-[36px] text-sm"
                  } h-[42px] rounded-md font-bold transition-colors ${
                    state === "empty"
                      ? "bg-[hsl(240,10%,18%)] text-foreground hover:bg-[hsl(240,10%,22%)]"
                      : STATE_COLORS[state]
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={reset}
          className="mt-6 bg-primary text-primary-foreground rounded-lg px-6 py-2 font-mono text-sm hover:opacity-90 transition-opacity"
        >
          New Game
        </motion.button>
      )}
    </div>
  );
};

export default WordleGame;
