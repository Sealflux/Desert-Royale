import { Client } from "boardgame.io/react";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";


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
  armor: number; // New property for armor
  extraAP: number; // New property for extra action points
}
interface GameState {
  boardSize: number;
  players: Record<string, PlayerState>;
  walls: Wall[];
  gamePhase: "placement" | "play" | "gameover";
  deck: Card[];
  discard: Card[];
  allCards: Record<string, Card>;
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
    for (let i = deck.length - 1; i>0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const allCards: Record<string, Card> = {};
    deck.forEach(card => {
      allCards[card.id] = card;
    })
    return { boardSize: Object.keys(players).length + 5, players, walls: [], gamePhase: "placement", deck, discard: [], allCards };
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
    return id !== ctx.currentPlayer && !p.dead && p.x === newX && p.y === newY;});
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
  const bulletType = player.bullets[player.bullets.length - 1];
  if (bulletType === "Point-Blank" && (i > 1)) break; // Out of range for point-blank bullets
  const wallBlockingShot = bulletType === "Piercing" ? false : G.walls.some((w) => {
  if (w.type === "half") return false; 
  if (w.direction === "vertical") {
    return w.x === tx - 1 && w.y === ty;
  } else {
    return w.x === tx && w.y === ty - 1;}});
  if (wallBlockingShot) break;
    const target = Object.entries(G.players).find(([id, p]) => {
    const otherPlayer = p as PlayerState;
    return id !== ctx.currentPlayer && !otherPlayer.dead && otherPlayer.x === tx && otherPlayer.y === ty;});
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
    const tx = player.x + dx;
    const ty = player.y + dy;
    if (tx < 0 || tx >= G.boardSize || ty < 0 || ty >= G.boardSize) return;
    const bulletType = player.bullets[player.bullets.length - 1];
    const wallBlockingShot = bulletType === "Piercing" ? false : G.walls.some((w) => {
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
    const tx = player.x + dx;
    const ty = player.y + dy;
    if (tx < 0 || tx >= G.boardSize || ty < 0 || ty >= G.boardSize) return;
    const bulletType = player.bullets[player.bullets.length - 1];
    const wallBlockingShot = bulletType === "Piercing" ? false : G.walls.some((w) => {
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
      return id !== ctx.currentPlayer && !otherPlayer.dead && otherPlayer.x === tx && otherPlayer.y === ty;
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
      const allDead = Object.entries(G.players).every(([id, p]) => {
        const otherPlayer = p as PlayerState;
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
            case "Sprint":
              // Implement sprint effect
              break;
            case "Leap":
              // Implement leap effect
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
                const wallBlocking = G.walls.some((w) => {
                  if (direction === "N") return w.x === player.x && w.y === player.y - 1 && w.direction === "horizontal";
                  if (direction === "E") return w.x === player.x && w.y === player.y && w.direction === "vertical";
                  if (direction === "S") return w.x === player.x && w.y === player.y && w.direction === "horizontal";
                  if (direction === "W") return w.x === player.x - 1 && w.y === player.y && w.direction === "vertical";
                  return false;
                });
                if (wallBlocking) break;
                player.x = nx;
                player.y = ny;
              }
              break;
            case "Warp":
              // Implement warp effect
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
            case "Shove":
              // Implement shove effect
              break;
            case "Telekinesis":
              // Implement telekinesis effect
              break;
            case "Mine":
              // Implement mine effect
              break;
            case "Detonate":
              // Implement detonate effect
              break;
            default:
              break;
          }
          break;
        case "Utility":
          // Implement utility card effects
          switch (card.name) {
            case "Heal":
              player.hp = Math.min(player.hp + 1, 3); // If they heal at max hp, they just stay at max hp
              break;
              case "Break":
                // Implement break effect
                break;
              case "Build":
                // Implement build effect
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
  warp: ({ G, ctx, events }, cardIndex: number, tx: number, ty: number) => { // tx and ty are the target coords
    const player = G.players[ctx.currentPlayer];
    if (player.ap < 2) return;
    if (tx < 0 || tx >= G.boardSize || ty < 0 || ty >= G.boardSize) return;
    const occupied = Object.values(G.players).some((p:any) => !p.dead && p.x === tx && p.y === ty);
    if (occupied) return;
    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Warp") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    player.x = tx;
    player.y = ty;
    player.ap -= card.cost;
    events.endTurn(); // Warp costs 2 AP, so we don't need to check if AP is 0, we just end the turn after warping
  },
  breakWall: ({ G, ctx, events}, cardIndex: number, x: number, y: number) => {
    const player = G.players[ctx.currentPlayer];
    const wallIndex = G.walls.findIndex(w => w.x === x && w.y === y);
    if (wallIndex === -1) return;
    const cardId = player.hand[cardIndex];
    const card = G.allCards[cardId];
    if (!card || card.name !== "Break") return;
    player.hand.splice(cardIndex, 1);
    G.discard.push(card);
    G.walls.splice(wallIndex, 1);
    if (player.ap === 0) events.endTurn();
  },
  buildWall: ({ G, ctx, events}, cardIndex: number, x: number, y: number) => {
    const player = G.players[ctx.currentPlayer];
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


function Board(props: any) {
  const G: GameState = props.G;
  const { boardSize, players } = G;
  const facingArrows: Record<string, string> = {
    N: "↑", E: "→", S: "↓", W: "←",
  };
  const [selectedTile, setSelectedTile] = React.useState<{ x: number, y: number } | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [pendingCard, setPendingCard] = useState<{ cardIndex: number; cardName: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  if (props.ctx.gameover) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-yellow-400 mb-4">🏆 Game Over 🏆</h1>
          <h2 className="text-3xl text-white">Player {props.ctx.gameover.winner} wins!</h2>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (G.gamePhase !== "play") return;
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { props.events.endTurn(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [props.ctx.currentPlayer]);

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
          onClick={() => {
            if (pendingCard) {
              if (pendingCard.cardName === "Warp") props.moves.warp(pendingCard.cardIndex, col, row);
              else if (pendingCard.cardName === "Break") props.moves.breakWall(pendingCard.cardIndex, col, row);
              else if (pendingCard.cardName === "Build") props.moves.buildWall(pendingCard.cardIndex, col, row);
              setPendingCard(null);
            } else {
              setSelectedTile({ x: col, y: row });
            }
          }}
          onMouseEnter={() => setHoveredTile({ x: col, y: row })}
          onMouseLeave={() => setHoveredTile(null)}
          key={`${row}-${col}`}
          className={`w-16 h-16 border border-slate-600 flex flex-col items-center justify-center text-xs font-bold cursor-pointer transition-colors
            ${isCurrentPlayer ? "bg-yellow-600 border-yellow-400 border-2" : playerHere ? "bg-blue-700" : "bg-slate-700 hover:bg-slate-600"}
            ${G.walls.some(w => w.x === col - 1 && w.y === row && w.direction === "vertical") ? "border-l-4 " + (G.walls.find(w => w.x === col - 1 && w.y === row && w.direction === "vertical")?.type === "full" ? "border-l-amber-800" : "border-l-amber-400") : ""}
            ${G.walls.some(w => w.x === col && w.y === row - 1 && w.direction === "horizontal") ? "border-t-4 " + (G.walls.find(w => w.x === col && w.y === row - 1 && w.direction === "horizontal")?.type === "full" ? "border-t-amber-800" : "border-t-amber-400") : ""}
            ${(hoveredTile?.x === col && hoveredTile?.y === row) || (selectedTile?.x === col && selectedTile?.y === row) ? "border-r-4 border-b-4 border-r-yellow-400 border-b-yellow-400 border-dashed" : ""}
          `}
        >
          {playerHere ? (
            <>
              <span className="text-white">P{playerID} {facingArrows[(playerHere[1] as PlayerState).facing]}</span>
              <span className="text-red-400 text-xs">
                {"❤️".repeat((playerHere[1] as PlayerState).hp)}
              </span>
              {(playerHere[1] as PlayerState).armor > 0 && <span className="text-xs">🛡️</span>}
            </>
          ) : null}
        </div>
      );
    }
    grid.push(<div key={row} className="flex">{rowCells}</div>);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <div className="flex gap-6 max-w-7xl mx-auto">
        
        {/* Left: Board */}
        <div>
          <h2 className="text-2xl font-bold text-red-500 mb-4"> Desert Royale</h2>
          <div className="bg-slate-800 p-2 rounded-xl">{grid}</div>
          <p className="mt-2 text-slate-400 text-sm">Phase: {G.gamePhase} | Turn: Player {props.ctx.currentPlayer}</p>
          {pendingCard && (
            <p className="text-yellow-400 mt-1">Click a tile to use {pendingCard.cardName}</p>
          )}
        </div>

        {/* Right: Info Panel */}
        <div className="flex-1 bg-slate-800 rounded-xl p-4 space-y-4">
          
          {/* Placement Phase */}
          {G.gamePhase === "placement" && (
            <div>
              <h3 className="text-lg font-bold text-yellow-400">Place Your Walls</h3>
              <p>Full: {G.players[props.ctx.currentPlayer]?.wallsToPlace.full} | Half: {G.players[props.ctx.currentPlayer]?.wallsToPlace.half}</p>
              {selectedTile && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-400">Placing at ({selectedTile.x}, {selectedTile.y})</p>
                  <div className="flex gap-1 flex-wrap">
                    <button className="px-2 py-1 bg-amber-800 text-white text-xs rounded" onClick={() => { props.moves.placeWall(selectedTile.x, selectedTile.y, "horizontal", "full"); setSelectedTile(null); }}>Full Horizontal Wall</button>
                    <button className="px-2 py-1 bg-amber-800 text-white text-xs rounded" onClick={() => { props.moves.placeWall(selectedTile.x, selectedTile.y, "vertical", "full"); setSelectedTile(null); }}>Full Vertical Wall</button>
                    <button className="px-2 py-1 bg-amber-400 text-black text-xs rounded" onClick={() => { props.moves.placeWall(selectedTile.x, selectedTile.y, "horizontal", "half"); setSelectedTile(null); }}>Half Horizontal Wall</button>
                    <button className="px-2 py-1 bg-amber-400 text-black text-xs rounded" onClick={() => { props.moves.placeWall(selectedTile.x, selectedTile.y, "vertical", "half"); setSelectedTile(null); }}>Half Vertical Wall</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Play Phase */}
          {G.gamePhase === "play" && (
            <>
              {/* Timer & Stats */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold text-red-400">Player {props.ctx.currentPlayer}</p>
                  <p className="text-sm text-slate-400">HP: {props.G.players[props.ctx.currentPlayer]?.hp} | AP: {props.G.players[props.ctx.currentPlayer]?.ap}</p>
                  {props.G.players[props.ctx.currentPlayer]?.armor > 0 && (
                    <p className="text-sm">Armor: {"🛡️".repeat(props.G.players[props.ctx.currentPlayer]?.armor)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${timeLeft <= 10 ? "text-red-500" : "text-white"}`}>{timeLeft}s</p>
                  <p className="text-slate-400 text-sm">{props.G.players[props.ctx.currentPlayer]?.facing}</p>
                </div>
              </div>

              {/* Bullets */}
              <div>
                <p className="text-sm text-slate-400 mb-1">Bullets</p>
                <div className="flex gap-1">
                  {G.players[props.ctx.currentPlayer]?.bullets.map((b, i) => (
                    <span key={i} className="text-lg">
                      {b === "Normal" ? "🔵" : b === "Piercing" ? "🔴" : b === "Point-Blank" ? "🟡" : b === "Disarming" ? "🟢" : b === "Shattering" ? "🔨" : b === "Vampire" ? "🩸" : b === "Backstab" ? "🗡️" : b === "Heavy" ? "💪" : b === "Boom" ? "💥" : b === "Combo" ? "🔗" : b === "Remove" ? "❌" : "⚪"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hand */}
              <div>
                <p className="text-sm text-slate-400 mb-1">Hand</p>
                <div className="flex gap-2 flex-wrap">
                  {props.G.players[props.ctx.currentPlayer]?.hand.map((cardId, index) => {
                    const card = G.allCards[cardId];
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (card && ["Warp", "Break", "Build"].includes(card.name)) {
                            setPendingCard({ cardIndex: index, cardName: card.name });
                          } else {
                            props.moves.playCard(index);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-left text-xs transition hover:scale-105
                          ${pendingCard?.cardIndex === index ? "ring-2 ring-yellow-400" : ""}
                          ${card?.type === "Movement" ? "bg-blue-600" : card?.type === "Combat" ? "bg-red-600" : card?.type === "Utility" ? "bg-green-600" : card?.type === "Bullet" ? "bg-purple-600" : "bg-slate-600"}
                        `}
                      >
                        <div className="font-bold">{card?.name}</div>
                        <div className="text-[10px] opacity-75">{card?.cost} AP</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-1">
                <button className="col-span-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm" onClick={() => props.moves.turnHead("N")}>↑ N</button>
                <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm" onClick={() => props.moves.turnHead("E")}>→ E</button>
                <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm" onClick={() => props.moves.turnHead("W")}>← W</button>
                <button className="col-span-3 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm" onClick={() => props.moves.turnHead("S")}>↓ S</button>
                <button className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 rounded text-sm" onClick={() => props.moves.moveForward()}>Move</button>
                <button className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded text-sm" onClick={() => props.moves.shootForward()}>Shoot</button>
                <button className="px-3 py-2 bg-red-800 hover:bg-red-700 rounded text-sm" onClick={() => props.moves.shootDiagonallyLeft()}>↖</button>
                <button className="px-3 py-2 bg-red-800 hover:bg-red-700 rounded text-sm" onClick={() => props.moves.shootDiagonallyRight()}>↗</button>
                <button className="px-3 py-2 bg-yellow-700 hover:bg-yellow-600 rounded text-sm" onClick={() => props.moves.reload()}>Reload</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const App = Client({
  game: DesertRoyale,
  board: Board,
  numPlayers: 3,
});

function GamePage() {
  const [searchParams] = useSearchParams();
  const playerCount = parseInt(searchParams.get("players") || "3");

  const GameClient = Client({
    game: DesertRoyale,
    board: Board,
    numPlayers: playerCount,
  })

  return <GameClient />;
}

export default GamePage;