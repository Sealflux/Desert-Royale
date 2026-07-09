import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Lobby() {
  const [playerCount, setPlayerCount] = useState(2);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-slate-300 to-red-600 flex flex-col items-center justify-center font-sans">
      <h2 className="text-4xl font-bold text-red-500 mb-8">Game Lobby</h2>
      
      <div className="bg-slate-800 p-8 rounded-xl text-center">
        <p className="text-lg text-slate-300 mb-4">Number of Players</p>
        
        <div className="flex items-center gap-6 mb-6">
          <button
            onClick={() => setPlayerCount(Math.max(2, playerCount - 1))}
            className="px-4 py-2 text-xl bg-slate-700 text-white rounded hover:bg-slate-600"
          >
            -
          </button>
          <span className="text-4xl font-bold text-white">{playerCount}</span>
          <button
            onClick={() => setPlayerCount(Math.min(6, playerCount + 1))}
            className="px-4 py-2 text-xl bg-slate-700 text-white rounded hover:bg-slate-600"
          >
            +
          </button>
        </div>
        
        <button
          onClick={() => navigate(`/game?players=${playerCount}`)}
          className="px-10 py-3 text-lg bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Start Game
        </button>
      </div>
      
      <button
        onClick={() => navigate("/")}
        className="mt-6 text-slate-500 hover:text-slate-300"
      >
        ← Back
      </button>
    </div>
  );
}

export default Lobby;