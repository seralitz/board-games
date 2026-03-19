import { useParams, Navigate } from "react-router-dom";
import GameLayout from "@/components/games/GameLayout";
import ChessGame from "@/components/games/ChessGame";
import Game2048 from "@/components/games/Game2048";
import MinesweeperGame from "@/components/games/MinesweeperGame";
import TypeRacerGame from "@/components/games/TypeRacerGame";
import WordleGame from "@/components/games/WordleGame";
import TetrisGame from "@/components/games/TetrisGame";

const GAMES: Record<string, { title: string; icon: string; Component: React.FC }> = {
  chess: { title: "Chess", icon: "♔", Component: ChessGame },
  "2048": { title: "2048", icon: "²", Component: Game2048 },
  minesweeper: { title: "Minesweeper", icon: "💣", Component: MinesweeperGame },
  typeracer: { title: "TypeRacer", icon: "⌨", Component: TypeRacerGame },
  wordle: { title: "Wordle", icon: "W", Component: WordleGame },
  tetris: { title: "Tetris", icon: "▣", Component: TetrisGame },
};

const GamePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const game = slug ? GAMES[slug] : null;
  if (!game) return <Navigate to="/" replace />;
  const { Component } = game;
  return (
    <GameLayout title={game.title} icon={game.icon}>
      <Component />
    </GameLayout>
  );
};

export default GamePage;
