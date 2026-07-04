import { Client } from "boardgame.io/react";
import React, { useState, useEffect } from "react";
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
  wallsToPlace: { full: number; half: number };
  turnStartTime?: number;
}
interface GameState {
  boardSize: number;
  players: Record<string, PlayerState>;
  walls: Wall[];
  gamePhase: "placement" | "play" | "gameover";
  deck: Card[];
  discard: Card[];
}
interface Wall {
  x: number;
  y: number;
  direction: "horizontal" | "vertical";
  type: "full" | "half";
}

interface Card {
  id: string;
  name: string;
  type: string; // "Movement" | "Combat" | "Utility" | "Bullet"
  effect: string; // Description of the card's effect
  cost: number; // Action points required to play the card
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
        wallsToPlace: { full: 2, half: 2 },
        turnStartTime: Date.now(),
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
    const deck: Card[] = [];
    const deckList = [
      // Movement
      { id: "Sprint", name: "Sprint", type: "Movement", effect: "Move forward 1 space, Turn A Direction, Move forward 1 space", cost: 1 },
      { id: "Leap", name: "Leap", type: "Movement", effect: "Jump forward over a wall 1 space", cost: 1 },
      { id: "Dash", name: "Dash", type: "Movement", effect: "Move forward 2 spaces", cost: 1 },
      { id: "Warp", name: "Warp", type: "Movement", effect: "Teleport to any unoccupied space on the board", cost: 2 },
      // Combat
      { id: "Scope", name: "Scope", type: "Combat", effect: "Increase range by 2 for this turn", cost: 1 },
      { id: "Shove", name: "Shove", type: "Combat", effect: "Push an adjacent player 1 space in the direction you are facing.(Can trigger wall slam damage)", cost: 1 },
      { id: "Telekinesis", name: "Telekinesis", type: "Combat", effect: "Push any player 1 space in any direction(Can trigger wall slam damage)", cost: 2 },
      { id: "Mine", name: "Mine", type: "Combat", effect: "Place a mine on an adjacent space. Must be triggered by 'Detonate'", cost: 1 },
      { id: "Detonate", name: "Detonate", type: "Combat", effect: "Detonate any mine on the board. A cross shaped area of effect will damage any player in the area for 1 damage", cost: 1},
      // Utility
      { id: "Heal", name: "Heal", type: "Utility", effect: "Restore 1 HP", cost: 2},
      { id: "Break", name: "Break", type: "Utility", effect: "Destroy a wall on the board", cost: 1},
      { id: "Build", name: "Build", type: "Utility", effect: "Place a wall on the board", cost: 1},
      { id: "Conserve", name: "Conserve", type: "Utility", effect: "Store 1 AP for the next turn", cost: 1},
      { id: "Armor", name: "Armor", type: "Utility", effect: "Gain 1 armor, Armor blocks the next bullet that hits you, and is destroyed in the process", cost: 1},
      // Bullet
      { id: "Piercing", name: "Piercing", type: "Bullet", effect: "Reload a piercing bullet. Piercing bullets go through walls", cost: 1},
      { id: "Point-Blank", name: "Point-Blank", type: "Bullet", effect: "Reload a point-blank bullet. Point-blank bullets only have a range of 1, but deal 2 damage", cost: 1},
      { id: "Disarming", name: "Disarming", type: "Bullet", effect: "Reload a disarming bullet. Disarming bullets unload all the attacked player's bullets", cost: 1},
      { id: "Remove", name: "Remove", type: "Bullet", effect: "Reload an removing bullet. Removing bullets force the attacked player to discard a card of your choice.", cost: 1}, 
      { id: "Boom", name: "Boom", type: "Bullet", effect: "Reload a booming bullet. Booming bullets deal 1 damage in a cross shaped area of effect, also destroying any walls", cost: 1},
      { id: "Heavy", name: "Heavy", type: "Bullet", effect: "Reload a heavy bullet. Heavy bullets after dealing dealing, pushes the attacked player back 2 spaces(Can trigger wall slam damage)", cost: 2},
      { id: "Shattering", name: "Shattering", type: "Bullet", effect: "Reload a shattering bullet. Shattering bullets ignores and breaks all armor.", cost: 1},
      { id: "Backstab", name: "Backstab", type: "Bullet", effect: "Reload a backstabbing bullet. Backstabbing bullets deal 2 damage if the attacked player is facing away from you.", cost: 1},
      { id: "Combo", name: "Combo", type: "Bullet", effect: "Reload a combo bullet. Combo bullets after hitting a player, pierces through and continues for 3 spaces.", cost: 1},
      { id: "Vampire", name: "Vampire", type: "Bullet", effect: "Reload a vampire bullet. Vampire bullets heal the attacker for 1 HP after dealing damage.", cost: 2},
    ];
    for (const card of deckList) {
      for (let i = 0; i< (ctx.numPlayers*2 +1); i++) {
        deck.push({id: card.id+i, name: card.name, type: card.type, effect: card.effect, cost: card.cost})
      };
  }

    return { boardSize: Object.keys(players).length * 2 + 1, players, walls: [], gamePhase: "placement", deck, discard: [] };
  },
  moves: {
    turnHead: ({ G, ctx, events }, direction) => {
  const player = G.players[ctx.currentPlayer];
  if (G.gamePhase !== "play") return;
  
  if (player.facing === direction) return;
  player.ap -= 1;
  player.facing = direction;
  if (player.ap === 0) {
    events.endTurn();
  }
},
  moveForward: ({ G, ctx, events}) => {
    const player = G.players[ctx.currentPlayer];
    if (G.gamePhase !== "play") return;
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
  shootForward: ({ G, ctx, events }) => {
  const player = G.players[ctx.currentPlayer];
  if (G.gamePhase !== "play") return;
  const boardSize = G.boardSize;
  if (player.bullets.length === 0) return;
  const dx = player.facing === "E" ? 1 : player.facing === "W" ? -1 : 0;
  const dy = player.facing === "S" ? 1 : player.facing === "N" ? -1 : 0;
  for (let i = 1; i <= player.range; i++) {
    const tx = player.x + dx * i;
    const ty = player.y + dy * i;
    if (tx < 0 || tx >= boardSize || ty < 0 || ty >= boardSize) break;
    const wallBlockingShot = G.walls.some((w) => {
  if (w.type === "half") return false; 
  if (w.direction === "vertical") {
    return w.x === tx - 1 && w.y === ty;
  } else {
    return w.x === tx && w.y === ty - 1;}});
if (wallBlockingShot) break;
    const target = Object.entries(G.players).find(([id, p]) => {
    const otherPlayer = p as PlayerState;
    return id !== ctx.currentPlayer && otherPlayer.x === tx && otherPlayer.y === ty;});
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
  shootDiagonallyLeft: ({ G, ctx, events }) => {
    const player = G.players[ctx.currentPlayer];
    if (G.gamePhase !== "play") return;
    if (player.bullets.length === 0) return;
    const facing = player.facing;
    let dx = 0;
    let dy = 0;
    if (facing === "N") {
      dx = -1; dy = -1; // NW
    } else if (facing === "E") {
      dx = 1; dy = -1; // NE
    } else if (facing === "S") {
      dx = 1; dy = 1; // SE
    } else if (facing === "W") {
      dx = -1; dy = 1; // SW
    }
    const tx = player.x + dx;
    const ty = player.y + dy;
    if (tx < 0 || tx >= G.boardSize || ty < 0 || ty >= G.boardSize) return;

    const wallBlockingShot = G.walls.some((w) => {
      if (w.type === "half") return false;
      if (w.direction === "vertical") {
        return w.x === Math.min(player.x, tx) && w.y === player.y;
      } else {
        return w.x === player.x && w.y === Math.min(player.y, ty);
      }
    });
    if (wallBlockingShot) return;

    const target = Object.entries(G.players).find(([id, p]) => {
      const otherPlayer = p as PlayerState;
      return id !== ctx.currentPlayer && otherPlayer.x === tx && otherPlayer.y === ty;
    })
    if (target) {
      const targetPlayer = target[1] as PlayerState;
      targetPlayer.hp -= 1;
      player.bullets.pop();
      player.ap -= 1;

      if (targetPlayer.hp <= 0) {
        targetPlayer.dead = true;
      }
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
    }
  },
  shootDiagonallyRight: ({ G, ctx, events }) => {
    const player = G.players[ctx.currentPlayer];
    if (G.gamePhase !== "play") return;
    if (player.bullets.length === 0) return;
    const facing = player.facing;
    let dx = 0;
    let dy = 0;
    if (facing === "N") {
      dx = 1; dy = -1; // NE
    } else if (facing === "E") {
      dx = 1; dy = 1; // SE
    } else if (facing === "S") {
      dx = -1; dy = 1; // SW
    } else if (facing === "W") {
      dx = -1; dy = -1; // NW
    }
    const tx = player.x + dx;
    const ty = player.y + dy;
    if (tx < 0 || tx >= G.boardSize || ty < 0 || ty >= G.boardSize) return;

    const wallBlockingShot = G.walls.some((w) => {
      if (w.type === "half") return false;
      if (w.direction === "vertical") {
        return w.x === Math.min(player.x, tx) && w.y === player.y;
      } else {
        return w.x === player.x && w.y === Math.min(player.y, ty);
      }

    },);
    if (wallBlockingShot) return;

    const target = Object.entries(G.players).find(([id, p]) => {
      const otherPlayer = p as PlayerState;
      return id !== ctx.currentPlayer && otherPlayer.x === tx && otherPlayer.y === ty;
    });
    if (target) {
      const targetPlayer = target[1] as PlayerState;
      targetPlayer.hp -= 1;
      player.bullets.pop();
      player.ap -= 1;

      if (targetPlayer.hp <= 0) {
        targetPlayer.dead = true;
      }
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
    }
  },
  reload: ({ G, ctx, events }) => {
    const player = G.players[ctx.currentPlayer];
    if (G.gamePhase !== "play") return;
    const newBulletType = "Normal"; // For simplicity, always reload a normal bullet
    if (player.bullets.length === 3) return; // Max bullets reached
    player.bullets.push(newBulletType);
    player.ap -= 1;
    if (player.ap === 0) {
      events.endTurn();
    }
  },
  placeWall: ({ G, ctx, events }, x: number, y: number, direction: "horizontal" | "vertical", type: "full" | "half") => {
    const player = G.players[ctx.currentPlayer];

    if (type === "full" && player.wallsToPlace.full <= 0) return;
    if (type === "half" && player.wallsToPlace.half <= 0) return;
    if (player.wallsToPlace.full <= 0 && player.wallsToPlace.half <= 0) events.endTurn();

    const alreadyExists = G.walls.some(w => w.x === x && w.y === y && w.direction === direction);
    if (alreadyExists) return;

    G.walls.push ({x,y,direction,type})
    if (type === "full")
      player.wallsToPlace.full -= 1;
    else
      player.wallsToPlace.half -= 1;

    if (player.wallsToPlace.full <= 0 && player.wallsToPlace.half <= 0) 
      events.endTurn();
  }
  //playCard: ({ G, ctx, events }, cardIndex: number) => {
    //const player = G.players[ctx.currentPlayer];
    //if (G.gamePhase === "placement") return;
    // Implement card effects based on the cardtype. 
},
  turn: {
    onBegin: ({G, ctx, events}) => {
      const player = G.players[ctx.currentPlayer];
      if (player.dead) {
        events.endTurn();
        return;
      }
      if (G.gamePhase === "placement") {
        const totalWallsLeft = player.wallsToPlace.full + player.wallsToPlace.half;
        if (totalWallsLeft === 0) {
          G.gamePhase = "play";
        }
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
  const [selectedTile, setSelectedTile] = React.useState<{ x: number, y: number } | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  if (props.ctx.gameover) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h1>🏆 Game Over 🏆</h1>
        <h2>Player {props.ctx.gameover.winner} wins!</h2>
      </div>
    );
  }
  const [timeLeft, setTimeLeft] = useState(30);
  useEffect(() => {
    if (G.gamePhase !== "play") return;
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          props.events.endTurn();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [props.ctx.currentPlayer, G.players[props.ctx.currentPlayer]?.turnStartTime]);

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
          onClick = {(() => setSelectedTile({ x: col, y: row }))}
          onMouseEnter={() => setHoveredTile({ x: col, y: row })}
          onMouseLeave={() => setHoveredTile(null)}
          key={`${row}-${col}`}
          style={{
  width: 70,
  height:70,
  boxSizing: "border-box",
  borderLeft: G.walls.some(w => w.x === col - 1 && w.y === row && w.direction === "vertical")
  ? `4px solid ${G.walls.find(w => w.x === col - 1 && w.y === row && w.direction === "vertical")?.type === "full" ? "#8B4513" : "#D2B48C"}`
  : "1px solid #ccc",
borderTop: G.walls.some(w => w.x === col && w.y === row - 1 && w.direction === "horizontal")
  ? `4px solid ${G.walls.find(w => w.x === col && w.y === row - 1 && w.direction === "horizontal")?.type === "full" ? "#8B4513" : "#D2B48C"}`
  : "1px solid #ccc",
borderRight: hoveredTile?.x === col && hoveredTile?.y === row
  ? "4px dashed #FFD700"
  : "1px solid #ccc",
borderBottom: hoveredTile?.x === col && hoveredTile?.y === row
  ? "4px dashed #FFD700"
  : "1px solid #ccc",
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
      <div>
        <p>Current Phase: {G.gamePhase}</p>
        <p>Current Turn: Player {props.ctx.currentPlayer}</p>
      </div>
      {G.gamePhase === "placement" && (
        <div>
          <p>Player {props.ctx.currentPlayer}, Place Your Walls!</p>
          <p>Full Walls Left: {G.players[props.ctx.currentPlayer]?.wallsToPlace.full}</p>
          <p>Half Walls Left: {G.players[props.ctx.currentPlayer]?.wallsToPlace.half}</p>
        </div>
      )}
      {G.gamePhase === "placement" && selectedTile && (
  <div>
    <p>Place wall at ({selectedTile.x}, {selectedTile.y}):</p>
    <button onClick={() => { props.moves.placeWall(selectedTile.x, selectedTile.y, "horizontal", "full"); setSelectedTile(null); }}>
      Full Horizontal Wall
    </button>
    <button onClick={() => { props.moves.placeWall(selectedTile.x, selectedTile.y, "vertical", "full"); setSelectedTile(null); }}>
      Full Vertical Wall
    </button>
    <button onClick={() => { props.moves.placeWall(selectedTile.x, selectedTile.y, "horizontal", "half"); setSelectedTile(null); }}>
      Half Horizontal Wall
    </button>
    <button onClick={() => { props.moves.placeWall(selectedTile.x, selectedTile.y, "vertical", "half"); setSelectedTile(null); }}>
      Half Vertical Wall
    </button>
  </div>
)}
{G.gamePhase === "play" && (
  <div>
    <p>Time Left: {timeLeft} seconds</p>
    <p>Current Turn: Player {props.ctx.currentPlayer} </p>
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
    <button onClick={() => props.moves.shootForward()}>Shoot Forward </button>
    <button onClick={() => props.moves.shootDiagonallyLeft()}>Shoot Diagonally Left</button>
    <button onClick={() => props.moves.shootDiagonallyRight()}>Shoot Diagonally Right</button>
    <button onClick={() => props.moves.reload()}>Reload</button>
  </div>
)}
    </div>
  );
}

const App = Client({
  game: DesertRoyale,
  board: Board,
  numPlayers: 3,
});

export default App;