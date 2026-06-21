import { Client } from "boardgame.io/react";

// ── The shape of our game state ──
interface PlayerState {
  x: number;
  y: number;
  facing: "N" | "E" | "S" | "W";
  hp: number;
  bullets: string[];
  ap: number;
  hand: string[];
  range: number;
}

interface GameState {
  boardSize: number;
  players: Record<string, PlayerState>;
}

// ── The engine ──
const DesertRoyale = {
  setup: ({ ctx }: any): GameState => {
    const players: Record<string, PlayerState> = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      const id = i.toString();
      players[id] = {
        x: Math.floor(Math.random() * (ctx.numPlayers * 2 + 1)),
        y: Math.floor(Math.random() * (ctx.numPlayers * 2 + 1)),
        facing: "N",
        hp: 3,
        bullets: ["Normal", "Normal", "Normal"],
        ap: 2,
        hand: [],
        range: 3,
      };
      const player = players[id];
      // Ensure no two players start in the same position
      while (
        Object.entries(players).some(
          ([otherId, otherPlayer]) =>
            otherId !== id &&
            otherPlayer.x === player.x &&
            otherPlayer.y === player.y
        )
      ) {
        player.x = Math.floor(Math.random() * (ctx.numPlayers * 2 + 1));
        player.y = Math.floor(Math.random() * (ctx.numPlayers * 2 + 1));
      }
    }
    return { boardSize: Object.keys(players).length * 2+1, players };
  },
  moves: {
    turnHead: ({ G, ctx, events }, direction) => {
  const player = G.players[ctx.currentPlayer];
  
  // Already facing that way? Do nothing
  if (player.facing === direction) return;
  
  // Not enough AP?
  if (player.ap < 1) return;
  
  // Spend AP and turn
  player.ap -= 1;
  player.facing = direction;
  
  // Auto-end if out of AP
  if (player.ap === 0) {
    events.endTurn();
  }
},
  }

};

// ── The UI ──
function Board(props: any) {
  const G: GameState = props.G;
  const { boardSize, players } = G;
  const facingArrows: Record<string, string> = {
    N: "↑",
    E: "→",
    S: "↓",
    W: "←",
  };


  const grid = [];
  for (let row = 0; row < boardSize; row++) {
    const rowCells = [];
    for (let col = 0; col < boardSize; col++) {
      const playerHere = Object.entries(players).find(
        ([_id, p]) => p.x === col && p.y === row
      );
      const playerID = playerHere ? playerHere[0] : null;
      const isCurrentPlayer = playerID === props.ctx.currentPlayer;
      
      rowCells.push(
        <div
          key={`${row}-${col}`}
          style={{
            width: 50,
            height: 50,
            border: "1px solid #ccc",
            backgroundColor: isCurrentPlayer ? "#d9b54a" : playerHere ? "#4a90d9" : "#f0e6d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: "bold",
          }}
        >
          {playerHere ? `P${playerID} ${facingArrows[(playerHere[1] as PlayerState).facing]}` : null}
        </div>
      );
    }
    grid.push(
      <div key={row} style={{ display: "flex" }}>
        {rowCells}
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Desert Royale</h2>
      {grid}
      <p>Current Turn: Player {props.ctx.currentPlayer}</p>
      <p>Current Direction: {props.G.players[props.ctx.currentPlayer]?.facing}</p>
      <p>Current Ap: {props.G.players[props.ctx.currentPlayer]?.ap}</p>
      <button onClick={() => props.moves.turnHead("N")}>Turn North↑</button>
      <button onClick={() => props.moves.turnHead("E")}>Turn East→</button>
      <button onClick={() => props.moves.turnHead("S")}>Turn South↓</button>
      <button onClick={() => props.moves.turnHead("W")}>Turn West←</button>
    </div>
  );
}

const App = Client({
  game: DesertRoyale,
  board: Board,
  numPlayers: 6,
});

export default App;