import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h1>🏜️ Desert Royale</h1>
      <p>A turn-based survival board game</p>
      <button onClick={() => navigate("/lobby")}>Create Game</button>
      <button onClick={() => navigate("/lobby")}>Join Game</button>
    </div>
  );
}

export default Home;