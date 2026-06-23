import { Client } from "boardgame.io/react";
interface PlayerState {
  x: number;
  y: number;
  facing: "N" | "E" | "S" | "W";
  hp: number;
  bullets: string[]; // Array of bullet types: "Normal", "Piercing", "Shotgun"
  ap: number;
  hand: string[];
  range: number;
  dead?: boolean;
}
interface GameState {
  boardSize: number;
  players: Record<string, PlayerState>;
  walls: Wall[];
}
interface Wall {
  x: number;
  y: number;
  direction: "horizontal" | "vertical";
  type: "full" | "half";
}
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
        bullets: ["Normal", "Normal", "Normal"], // Each player starts with 3 normal bullets
        ap: 2,
        hand: [],
        range: 3,
        dead: false,
      };
      const player = players[id];
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
    return { boardSize: Object.keys(players).length * 2+1, players, walls: [] };
  },
  moves: {
    turnHead: ({ G, ctx, events }, direction) => {
  const player = G.players[ctx.currentPlayer];
  
  if (player.facing === direction) return;
  player.ap -= 1;
  player.facing = direction;
  if (player.ap === 0) {
    events.endTurn();
  }
},
  moveForward: ({ G, ctx, events}) => {
    const player = G.players[ctx.currentPlayer];
    const direction = player.facing;
    let newX = player.x;
    let newY = player.y;

    if (direction === "N") 
      newY -= 1;
    else if (direction === "E") newX += 1;
    else if (direction === "S") newY += 1;
    else if (direction === "W") newX -= 1;
    if (newX < 0 || newX >= G.boardSize || newY < 0 || newY >= G.boardSize) {
      return;
      }
    const occupied = Object.keys(G.players).some((id) => {
    const p = G.players[id];
    return id !== ctx.currentPlayer && p.x === newX && p.y === newY;});
    if (occupied) {
      return; 
      }
    let wallX: number;
    let wallY: number;
    let wallDirection: "horizontal" | "vertical";

    if (direction === "N") {
      wallX = player.x;
      wallY = player.y - 1;
      wallDirection = "horizontal";
    } else if (direction === "S") {
      wallX = player.x;
      wallY = player.y;
      wallDirection = "horizontal";
    } else if (direction === "E") {
      wallX = player.x;
      wallY = player.y;
      wallDirection = "vertical";
    } else { // W
      wallX = player.x - 1;
      wallY = player.y;
      wallDirection = "vertical";
    }

    const wallBlocking = G.walls.some(
      (w) => w.x === wallX && w.y === wallY && w.direction === wallDirection
    );

    if (wallBlocking) {
      return;
    }
    player.x = newX;
    player.y = newY;
    player.ap -= 1;
    if (player.ap === 0) {
      events.endTurn();
  }
},
  shoot: ({ G, ctx, events }) => {
  const player = G.players[ctx.currentPlayer];
  const boardSize = G.boardSize;
  if (player.bullets.length === 0) return;
  const dx = player.facing === "E" ? 1 : player.facing === "W" ? -1 : 0;
  const dy = player.facing === "S" ? 1 : player.facing === "N" ? -1 : 0;
  for (let i = 1; i <= 3; i++) {
    const tx = player.x + dx * i;
    const ty = player.y + dy * i;
    if (tx < 0 || tx >= boardSize || ty < 0 || ty >= boardSize) break;

    const target = Object.entries(G.players).find(([id, p]) => {
    const otherPlayer = p as PlayerState;
    return id !== ctx.currentPlayer && otherPlayer.x === tx && otherPlayer.y === ty;
});

    if (target) {
      const targetPlayer = target[1] as PlayerState;
      targetPlayer.hp -= 1;

      player.bullets.pop();
      player.ap -= 1;

      // Check if target eliminated
      if (targetPlayer.hp <= 0) {
        targetPlayer.dead = true;
      }
      //Check if all other players are dead
      const allDead = Object.entries(G.players).every(([id, p]) => {
        const otherPlayer = p as PlayerState;
        return id === ctx.currentPlayer || otherPlayer.dead;
      });
      if (allDead) {
        events.endGame({ winner: ctx.currentPlayer });
      }
      if (player.ap === 0) {
        events.endTurn();
      }
      return; // Stop after hitting the first player
    }
  }
},
  reload: ({ G, ctx, events }) => {
    const player = G.players[ctx.currentPlayer];
    const newBulletType = "Normal"; // For simplicity, always reload a normal bullet
    if (player.bullets.length === 3) return; // Max bullets reached
    player.bullets.push(newBulletType);
    player.ap -= 1;
    if (player.ap === 0) {
      events.endTurn();
    }
  },
},
  turn: {
    onBegin: ({G, ctx, events}) => {
      const player = G.players[ctx.currentPlayer];
      if (player.dead) {
        events.endTurn();
        return;
      }
      player.ap = 2;
      while (player.hand.length < 2) {
        player.hand.push("AP Card"); // Placeholder for actual card logic
        // Need a function that selects a random card from the deck and adds it to the player's hand
      }
    },
  },
};


function Board(props: any) {
  const G: GameState = props.G;
  const { boardSize, players } = G;
  const facingArrows: Record<string, string> = {
    N: "↑",
    E: "→",
    S: "↓",
    W: "←",
  };

  if (props.ctx.gameover) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h1>🏆 Game Over 🏆</h1>
        <h2>Player {props.ctx.gameover.winner} wins!</h2>
      </div>
    );
  }
  const grid = [];
  for (let row = 0; row < boardSize; row++) {
    const rowCells = [];
    for (let col = 0; col < boardSize; col++) {
      const playerHere = Object.entries(players).find(
  ([_id, p]) => !p.dead && p.x === col && p.y === row
);
      const playerID = playerHere ? playerHere[0] : null;
      const isCurrentPlayer = playerID === props.ctx.currentPlayer;
      
      rowCells.push(
        <div
          key={`${row}-${col}`}
          style={{
            width: 65,
            height: 65,
            border: "1px solid #ccc",
            backgroundColor: isCurrentPlayer ? "#d9b54a" : playerHere ? "#4a90d9" : "#f0e6d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: "bold",
          }}
        >
          {playerHere ? (
  <>
    <span>P{playerID} {facingArrows[(playerHere[1] as PlayerState).facing]}</span>
    <span style={{ fontSize: 10 }}>
      {"❤️".repeat((playerHere[1] as PlayerState).hp)}
    </span>
  </>
) : null}
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
      <p>Current HP: {props.G.players[props.ctx.currentPlayer]?.hp}</p>
      <p>Current Ap: {props.G.players[props.ctx.currentPlayer]?.ap}</p>
      <p>Current Hand: {props.G.players[props.ctx.currentPlayer]?.hand.join(", ")}</p>
      <p>
  Bullets:{" "}
  {G.players[props.ctx.currentPlayer]?.bullets.map((b, i) => (
    <span key={i} style={{ marginRight: 4 }}>
      {b === "Normal" ? "🔵" : b === "Piercing" ? "🔴" : b === "Shotgun" ? "🟡" : null}
    </span>
  ))}
</p>
      <button onClick={() => props.moves.turnHead("N")}>Turn North↑</button>
      <button onClick={() => props.moves.turnHead("E")}>Turn East→</button>
      <button onClick={() => props.moves.turnHead("S")}>Turn South↓</button>
      <button onClick={() => props.moves.turnHead("W")}>Turn West←</button>
      <button onClick={() => props.moves.moveForward()}>Move Forward</button>
      <button onClick={() => props.moves.shoot()}>Shoot</button>
      <button onClick={() => props.moves.reload()}>Reload</button>
    </div>
  );
}

const App = Client({
  game: DesertRoyale,
  board: Board,
  numPlayers: 2,
});

export default App;