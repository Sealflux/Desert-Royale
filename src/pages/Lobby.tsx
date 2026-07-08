import { useState } from "react";

function Lobby() {
  const [playerCount, setPlayerCount] = useState(2);

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h2>Game Lobby</h2>
      <p>Players: {playerCount}</p>
      <button onClick={() => setPlayerCount(Math.max(2, playerCount - 1))}>-</button>
      <button onClick={() => setPlayerCount(Math.min(6, playerCount + 1))}>+</button>
      <br />
      <button>Start Game</button>
    </div>
  );
}

export default Lobby;