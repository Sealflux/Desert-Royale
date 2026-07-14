import { Client } from "boardgame.io/react";
import { useSearchParams } from "react-router-dom";
import DesertRoyale from "../game";
import Board from "../Board";

function GamePage() {
  const [searchParams] = useSearchParams();
  const playerCount = parseInt(searchParams.get("players") || "3");

  const GameClient = Client({
    game: DesertRoyale,
    board: Board,
    numPlayers: playerCount,
  });

  return <GameClient />;
}

export default GamePage;