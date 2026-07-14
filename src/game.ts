export interface PlayerState {
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
  armor: number; // New property for armor
  extraAP: number; // New property for extra action points
}
export interface GameState {
  boardSize: number;
  players: Record<string, PlayerState>;
  walls: Wall[];
  gamePhase: "placement" | "play" | "gameover";
  deck: Card[];
  discard: Card[];
  allCards: Record<string, Card>;
  mines: Mine[];
}
export interface Wall {
  x: number;
  y: number;
  direction: "horizontal" | "vertical";
  type: "full" | "half";
}

export interface Mine {
  x: number;
  y: number;
}

export interface Card {
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
        x: Math.floor(Math.random() * (ctx.numPlayers + 5)),
        y: Math.floor(Math.random() * (ctx.numPlayers + 5)),
        facing: "N",
        hp: 3,
        bullets: ["Normal", "Normal", "Normal"], // Each player starts with 3 normal bullets
        ap: 2,
        hand: [],
        range: 3,
        dead: false,
        wallsToPlace: { full: 2, half: 2 },
        turnStartTime: Date.now(),
        armor: 0,
        extraAP: 0,
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
        player.x = Math.floor(Math.random() * (ctx.numPlayers + 5));
        player.y = Math.floor(Math.random() * (ctx.numPlayers + 5));
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
      { id: "Shove", name: "Shove", type: "Combat", effect: "Push an adjacent player 4 space in the direction you are facing.(Can trigger wall slam damage)", cost: 1 },
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
      for (let i = 0; i< (ctx.numPlayers*2 +1); i++) deck.push({id: card.id+i, name: card.name, type: card.type, effect: card.effect, cost: card.cost});
  }
    for (let i = deck.length - 1; i>0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const allCards: Record<string, Card> = {};
    deck.forEach(card => {
      allCards[card.id] = card;
    });
    return { boardSize: Object.keys(players).length + 5, players, walls: [], gamePhase: "placement", deck, discard: [], allCards, mines: [] };
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
    const occupied = Object.values(G.players).some((player:any) => player.x === newX && player.y === newY && !player.dead);
    if (occupied) return;
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
      (wall: any) => wall.x === wallX && wall.y === wallY && wall.direction === wallDirection
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
    const targetx = player.x + dx * i;
    const targety = player.y + dy * i;
  if (targetx < 0 || targetx >= boardSize || targety < 0 || targety >= boardSize) break;
  const bulletType = player.bullets[player.bullets.length - 1];
  if (bulletType === "Point-Blank" && (i > 1)) break; // Out of range for point-blank bullets
  const wallBlockingShot = bulletType === "Piercing" ? false : G.walls.some((wall: any) => {
  if (wall.type === "half") return false; 
  if (wall.direction === "vertical") {
    return wall.x === targetx - 1 && wall.y === targety;
  } else {
    return wall.x === targetx && wall.y === targety - 1;}});
  if (wallBlockingShot) break;
    const target = Object.entries(G.players).find(([id, player]) => {
    const otherPlayer = player as PlayerState;
    return id !== ctx.currentPlayer && !otherPlayer.dead && otherPlayer.x === targetx && otherPlayer.y === targety;});
    if (target) {
      const targetPlayer = target[1] as PlayerState;
      if (bulletType === "Disarming") {
        targetPlayer.bullets = [];
      }
      if (bulletType === "Shattering") {
        targetPlayer.armor = 0;
      }
      // Cutoff between damage bullets and utility bullets doing crap. Utility bullets still do 1 damage. Effects don't care about armor, only damage
      let damage = 1; // Default damage for most bullets
      if (bulletType === "Point-Blank") {
        damage = 2; // Point-Blank bullets deal 2 damage
      }
      if (bulletType === "Backstab") {
        const oppositefacing = {N: "S", S: "N", E: "W", W: "E"};
        if (targetPlayer.facing === oppositefacing[player.facing]) damage = 2; // Backstab bullets deal 2 damage if the target is facing away
      }
      if (targetPlayer.armor > 0) {
        targetPlayer.armor -= 1;
        damage = 0;
      }
      targetPlayer.hp -= damage;
      if (bulletType === "Vampire") {
        player.hp = Math.min(player.hp + 1, 3); // Heal the shooter for 1 HP, but not above max HP
      }
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
    const targetx = player.x + dx;
    const targety = player.y + dy;
    if (targetx < 0 || targetx >= G.boardSize || targety < 0 || targety >= G.boardSize) return;
    const bulletType = player.bullets[player.bullets.length - 1];
    const wallBlockingShot = bulletType === "Piercing" ? false : G.walls.some((wall: any) => {
      if (wall.type === "half") return false;
      if (wall.direction === "vertical") {
        return wall.x === Math.min(player.x, targetx) && wall.y === player.y;
      } else {
        return wall.x === player.x && wall.y === Math.min(player.y, targety);
      }
    });
    if (wallBlockingShot) return;

    const target = Object.entries(G.players).find(([id, player]) => {
      const otherPlayer = player as PlayerState;
      return id !== ctx.currentPlayer && otherPlayer.x === targetx && otherPlayer.y === targety;
    })
    if (target) {
      const targetPlayer = target[1] as PlayerState;
      if (bulletType === "Disarming") {
        targetPlayer.bullets = [];
      } 
      if (bulletType === "Shattering") {
        targetPlayer.armor = 0;
        
      } 
      if (bulletType === "Vampire") {
        player.hp = Math.min(player.hp + 1, 3); // Heal the shooter for 1 HP, but not above max HP
      }
      // Cutoff between damage bullets and utility bullets doing crap. Utility bullets still do 1 damage. Effects don't care about armor, only damage
      let damage = 1;
      if (bulletType === "Point-Blank") {
        damage = 2;
      }
      if (bulletType === "Backstab") {
        const oppositefacing = {N: "S", S: "N", E: "W", W: "E"};
        if (targetPlayer.facing === oppositefacing[player.facing]) damage = 2;
      }
      if (targetPlayer.armor > 0) {
       targetPlayer.armor -= 1;
       damage = 0;
      }
      targetPlayer.hp -= damage;
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
    const targetx = player.x + dx;
    const targety = player.y + dy;
    if (targetx < 0 || targetx >= G.boardSize || targety < 0 || targety >= G.boardSize) return;
    const bulletType = player.bullets[player.bullets.length - 1];
    const wallBlockingShot = bulletType === "Piercing" ? false : G.walls.some((wall: any) => {
      if (wall.type === "half") return false;
      if (wall.direction === "vertical") {
        return wall.x === Math.min(player.x, targetx) && wall.y === player.y;
      } else {
        return wall.x === player.x && wall.y === Math.min(player.y, targety);
      }

    },);
    if (wallBlockingShot) return;

    const target = Object.entries(G.players).find(([id, player]) => {
      const otherPlayer = player as PlayerState;
      return id !== ctx.currentPlayer && !otherPlayer.dead && otherPlayer.x === targetx && otherPlayer.y === targety;
    });
    if (target) {
      const targetPlayer = target[1] as PlayerState;
      if (bulletType === "Disarming") {
        targetPlayer.bullets = [];
      }
      if (bulletType === "Shattering") {
        targetPlayer.armor = 0;
      }
      let damage = 1;
      if (bulletType === "Point-Blank") {
        damage = 2;
      }
      if (bulletType === "Backstab") {
        const oppositefacing = {N: "S", S: "N", E: "W", W: "E"};
        if (targetPlayer.facing === oppositefacing[player.facing]) damage = 2;
      }
      if (targetPlayer.armor > 0) { // Armor blocks one bullet, regardless of type(Vampire still heals the shooter)
        targetPlayer.armor -= 1;
        damage = 0;
      }
      targetPlayer.hp -= damage;
      if (bulletType === "Vampire") {
        player.hp = Math.min(player.hp + 1, 3); // Heal the shooter for 1 HP, but not above max HP
      }
      player.bullets.pop();
      player.ap -= 1;

      if (targetPlayer.hp <= 0) {
        targetPlayer.dead = true;
      }
      const allDead = Object.entries(G.players).every(([id, player]) => {
        const otherPlayer = player as PlayerState;
        return id === ctx.currentPlayer || otherPlayer.dead;
      });
      if (allDead) {
        G.gamePhase = "gameover";
        events.endGame({ winner: ctx.currentPlayer });
      }
      if (player.ap === 0) {
        events.endTurn();
      }
      return;
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
  },
  playCard: ({ G, ctx, events }, cardIndex: number) => {
    const player = G.players[ctx.currentPlayer];
    if (G.gamePhase !== "play") return;
    if (player.ap < 1) return;
    if (cardIndex < 0 || cardIndex >= player.hand.length) return;
    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];

      if (!card) return;
      if (player.ap < card.cost) return;

      player.ap -= card.cost;
      player.hand.splice(cardIndex, 1);
      G.discard.push(card);

      // Implement card effects here based on card.type and card.effect
      switch (card.type) {
        case "Movement":
          switch (card.name) {
            case "Sprint": {
          const direction = player.facing;
          let nx = player.x, ny = player.y;
          if (direction === "N") ny--;
          else if (direction === "E") nx++;
          else if (direction === "S") ny++;
          else if (direction === "W") nx--;
          if (nx >= 0 && nx < G.boardSize && ny >= 0 && ny < G.boardSize) {
            const occ = Object.values(G.players).some((player: any) => !player.dead && player.x === nx && player.y === ny);
            const wallBlock = G.walls.some((wall: any) => {
              if (direction === "N") return wall.x === player.x && wall.y === player.y - 1 && wall.direction === "horizontal";
              if (direction === "S") return wall.x === player.x && wall.y === player.y && wall.direction === "horizontal";
              if (direction === "E") return wall.x === player.x && wall.y === player.y && wall.direction === "vertical";
              if (direction === "W") return wall.x === player.x - 1 && wall.y === player.y && wall.direction === "vertical";
              return false;
            });
            if (!occ && !wallBlock) {
              player.x = nx;
              player.y = ny;
            }
          }
          break;
        }
            case "Leap":
              const direction = player.facing;
              let lx = player.x, ly = player.y;
              if (direction == "N") ly -= 2;
              else if (direction == "S") ly += 2;
              else if (direction == "E") lx += 2;
              else if (direction == "W") lx -= 2;

              if (lx >= 0 && lx < G.boardSize && ly >= 0 && ly < G.boardSize) {
                const occupied = Object.values(G.players).some((player:any) => !player.dead && player.x === lx && player.y === ly);
              if (!occupied) {
                player.x = lx;
                player.y = ly;
              }}
              break;
            case "Dash":
              for (let step = 0; step < 2; step++) {
                const direction = player.facing;
                let nx = player.x;
                let ny = player.y;
                if (direction == "N") ny -= 1;
                else if (direction == "E") nx += 1;
                else if (direction == "S") ny += 1;
                else if (direction == "W") nx -= 1;
                if (nx < 0 || nx >= G.boardSize || ny < 0 || ny >= G.boardSize) break;
                const occupied = Object.values(G.players).some(
                  (p:any) => p.x === nx && p.y === ny && !p.dead
                );
                if (occupied) break;
                const wallBlocking = G.walls.some((wall) => {
                  if (direction === "N") return wall.x === player.x && wall.y === player.y - 1 && wall.direction === "horizontal";
                  if (direction === "E") return wall.x === player.x && wall.y === player.y && wall.direction === "vertical";
                  if (direction === "S") return wall.x === player.x && wall.y === player.y && wall.direction === "horizontal";
                  if (direction === "W") return wall.x === player.x - 1 && wall.y === player.y && wall.direction === "vertical";
                  return false;
                });
                if (wallBlocking) break;
                player.x = nx;
                player.y = ny;
              }
              break;
            default:
              break;
          }
          break;
        // Implement combat card effects
        case "Combat":
          switch (card.name) {
            case "Scope":
              player.range += 2;
              break;
            default:
              break;
          }
          break;
        case "Utility":
          switch (card.name) {
            case "Heal":
              player.hp = Math.min(player.hp + 1, 3); // If they heal at max hp, they just stay at max hp
              break;
            case "Conserve":
              player.extraAP += 1;
              break;
            case "Armor":
              player.armor += 1;
              break;
                default:
                  break;
          }
          break;
        case "Bullet":
          // Implement bullet card effects
          switch (card.name) {
            case "Piercing":
              addBullet(player, "Piercing");
              break;
            case "Point-Blank":
              addBullet(player, "Point-Blank");
              break;
            case "Disarming":
              addBullet(player, "Disarming");
              break;
            case "Remove":
              addBullet(player, "Remove");
              break;
            case "Boom":
              addBullet(player, "Boom");
              break;
            case "Heavy":
              addBullet(player, "Heavy");
              break;
            case "Shattering":
              addBullet(player, "Shattering");
              break;
            case "Backstab":
              addBullet(player, "Backstab");
              break;
            case "Combo":
              addBullet(player, "Combo");
              break;
            case "Vampire":
              addBullet(player, "Vampire");
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
      if (player.ap === 0) events.endTurn();
  },
  warp: ({ G, ctx, events }, cardIndex: number, targetx: number, targety: number) => { // targetx and targety are the target coords
    const player = G.players[ctx.currentPlayer];
    if (player.ap < 2) return;
    if (targetx < 0 || targetx >= G.boardSize || targety < 0 || targety >= G.boardSize) return;
    const occupied = Object.values(G.players).some((player:any) => !player.dead && player.x === targetx && player.y === targety);
    if (occupied) return;
    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Warp") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    player.x = targetx;
    player.y = targety;
    player.ap -= card.cost;
    if (player.ap === 0) events.endTurn();
  },
  breakWall: ({ G, ctx, events}, cardIndex: number, x: number, y: number) => {
    const player = G.players[ctx.currentPlayer];
    const wallIndex = G.walls.findIndex((wall: any) => (wall.x === x && wall.y === y) || (wall.x === x-1 && wall.y === y && wall.direction === "vertical") || (wall.x === x && wall.y === y-1 && wall.direction === "horizontal"));
    if (wallIndex === -1) return;
    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Break") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    G.walls.splice(wallIndex, 1);
    player.ap -= card.cost;
    if (player.ap === 0) events.endTurn();
  },
  buildWall: ({ G, ctx, events}, cardIndex: number, x: number, y: number) => {
    const player = G.players[ctx.currentPlayer];
    
    const alreadyExists = G.walls.some((wall: any) => wall.x === x && wall.y === y);

    if (alreadyExists) return;
    
    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Build") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    G.walls.push({x, y, direction: "horizontal", type: "full"}); // I'll make it so the player can choose in a future update
    player.ap -= card.cost;
    if (player.ap === 0) events.endTurn();
  },
  shove: ({ G, ctx, events}, cardIndex: number) => {
    const player = G.players[ctx.currentPlayer];
    const direction = player.facing;

    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Shove") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    player.ap -= card.cost;
    let targetX = player.x;
    let targetY = player.y;

    if (direction === "N") targetY -= 1;
    else if (direction === "E") targetX += 1;
    else if (direction === "S") targetY += 1;
    else if (direction === "W") targetX -= 1;

    const target = Object.entries(G.players).find(([id, p]) => {
      const otherPlayer = p as PlayerState;
      return id !== ctx.currentPlayer && !otherPlayer.dead && otherPlayer.x === targetX && otherPlayer.y === targetY;
    })
    if (!target) return;
    const targetPlayer = target[1] as PlayerState;

    for (let step= 0; step < 4; step++) {
      let newX = targetPlayer.x;
      let newY = targetPlayer.y;

      if (direction === "N") newY -= 1;
      else if (direction === "E") newX += 1;
      else if (direction === "S") newY += 1;
      else if (direction === "W") newX -= 1;

      if (newX < 0 || newX >= G.boardSize || newY < 0 || newY >= G.boardSize) break;

      const occupied = Object.entries(G.players).some((p:any) => !p.dead && p.x === newX && p.y === newY);
      if (occupied) break;

      const wallBlocking = G.walls.some((wall: any) => {
        if (direction === "N") return wall.x === targetPlayer.x && wall.y === targetPlayer.y - 1 && wall.direction === "horizontal";
        else if (direction === "E") return wall.x === targetPlayer.x && wall.y === targetPlayer.y && wall.direction === "vertical";
        else if (direction === "S") return wall.x === targetPlayer.x && wall.y === targetPlayer.y + 1 && wall.direction === "horizontal";
        else if (direction === "W") return wall.x === targetPlayer.x - 1 && wall.y === targetPlayer.y && wall.direction === "vertical";
        else return false;
      });
      if (wallBlocking) break;
      targetPlayer.x = newX;
      targetPlayer.y = newY;
    }
    targetPlayer.hp -= 1;
    if (targetPlayer.hp <= 0) targetPlayer.dead = true;
    if (player.ap === 0) events.endTurn();
  },
  placeMine: ({ G, ctx, events}, cardIndex: number, x: number, y: number) => {
    const player = G.players[ctx.currentPlayer];

    const dx = Math.abs(player.x - x);
    const dy = Math.abs(player.y - y);
    if ((dx + dy) !== 1) return; // If true, then the mine isn't adjacent to the player

    const MineExists = G.mines.some(mine => mine.x === x && mine.y === y);
    if (MineExists) return; // I also need to make a UI for the mines

    const occupied = Object.values(G.players).some((player:any) => !player.dead && player.x === x && player.y === y);
    if (occupied) return; // If true, then there's a player on that tile

    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Mine") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    G.mines.push({x,y});
    player.ap -= card.cost;
    if (player.ap === 0) events.endTurn();
 },
 detonateMine: ({ G, ctx, events}, cardIndex: number, x: number, y: number) => {
    const player = G.players[ctx.currentPlayer];
    const mineIndex = G.mines.findIndex((mine: any) => mine.x === x && mine.y === y);
    if (mineIndex === -1) return;

    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Detonate") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    player.ap -= card.cost;
    const mine = G.mines[mineIndex];
    G.mines.splice(mineIndex, 1);
    const crossOffsets = [
      [0, 0],
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1]];
    
    for (const [dx, dy] of crossOffsets) {
      const targetx = mine.x + dx;
      const targety = mine.y + dy;
      
      Object.values(G.players).forEach((player: any) => {
        if (!player.dead && player.x === targetx && player.y === targety) {
          player.hp -= 1;
          if (player.hp <= 0) {
            player.dead = true;
          }
        }
      })
      G.walls = G.walls.filter((wall: any) => !(wall.x === targetx && wall.y === targety)); // Mine eats walls
    }
    const allDead = Object.entries(G.players).every(([id, player]) => {
      const otherPlayer = player as PlayerState;
      return id === ctx.currentPlayer || otherPlayer.dead;
    });
    if (allDead) events.endGame({ winner: ctx.currentPlayer });
    if (player.ap === 0) events.endTurn();
 },
 Telekinesis: ({ G, ctx, events}, cardIndex: number, x: number, y: number) => {
    const player = G.players[ctx.currentPlayer];
    const target = Object.entries(G.players).find(([id, p]) => {
      const otherPlayer = p as PlayerState; 
      return id !== ctx.currentPlayer && !otherPlayer.dead && otherPlayer.x === x && otherPlayer.y === y
    }
  );
    if (!target) return;
    const targetPlayer = target[1] as PlayerState;
    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Telekinesis") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    player.ap -= card.cost;
    const dx = targetPlayer.x - player.x;
    const dy = targetPlayer.y - player.y;
    const pushX = targetPlayer.x + (dx !== 0 ? (dx > 0 ? 1 : -1) : 0);
    const pushY = targetPlayer.y + (dy !== 0 ? (dy > 0 ? 1 : -1) : 0);
    if (pushX < 0 || pushX >= G.boardSize || pushY < 0 || pushY >= G.boardSize) {
      targetPlayer.hp -= 1;
    }
    else {
      const occupied = Object.values(G.players).some((player:any) => !player.dead && player.x === pushX && player.y === pushY);
      if (occupied) {
        targetPlayer.hp -= 1;
      }
      else {
        targetPlayer.x = pushX;
        targetPlayer.y = pushY;
      }
    }
    if (targetPlayer.hp <= 0) targetPlayer.dead = true;
    const allDead = Object.entries(G.players).every(([id, player]) => {
      const otherPlayer = player as PlayerState;
      return id === ctx.currentPlayer || otherPlayer.dead;
    });
    if (allDead) events.endGame({ winner: ctx.currentPlayer });
    if (player.ap === 0) events.endTurn();
 }
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
      player.range = 3;
      if (player.extraAP > 0){
        player.ap += player.extraAP;
        player.extraAP = 0;
      }
      while (player.hand.length < 3) {
        if (G.deck.length === 0) {
          G.deck = G.discard;
          G.discard = [];

          for (let i = G.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [G.deck[i], G.deck[j]] = [G.deck[j], G.deck[i]];
          }
        }
        const drawnCard = G.deck.pop();
        player.hand.push(drawnCard.id);
      }
    },
  },
};

function addBullet(player, bulletType) {
  if (player.bullets.length < 3) {
        player.bullets.push(bulletType);
    } else {
        let normalIndex = player.bullets.indexOf("Normal");
        
        if (normalIndex !== -1) {
            player.bullets.splice(normalIndex, 1);
        } else {
            player.bullets.shift();
        }
        player.bullets.push(bulletType);
    }
}

export default DesertRoyale;