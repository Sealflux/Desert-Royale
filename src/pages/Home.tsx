import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-slate-300 to-red-600 flex flex-col items-center justify-center font-sans">
      <h1 className="text-6xl font-bold text-red-500 mb-2">Desert Royale</h1>
      <p className="text-lg text-red-700 mb-10">
        A turn-based board game where players compete to be the last one standing in a desert wasteland.
      </p>
      
      <button
        onClick={() => navigate("/lobby?create=true")}
        className="px-10 py-3 text-lg bg-red-500 text-white rounded-lg hover:bg-red-600 transition mb-4"
      >
        Create Game
      </button>
      
      <button
        onClick={() => navigate("/lobby")}
        className="px-10 py-3 text-lg border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
      >
        Join Game(This is a temporary button for testing, has not yet been implemented)
      </button>
    </div>
  );
}

export default Home;