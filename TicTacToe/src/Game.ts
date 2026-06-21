interface PlayerState {
  x: number;
  y: number;
  facing: "N" | "E" | "S" | "W";
  hp: number;
  bullets: string[];
  ap: number;
  hand: string[];
}

interface GameState {
  boardSize: number;
  players: Record<string, PlayerState>;
}

// ── The engine ──
export const DesertRoyale = {
  setup: ({ ctx }: { ctx: { numPlayers: number } }): GameState => {
    const players: Record<string, PlayerState> = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      const id = i.toString();
      players[id] = {
        x: i * 2 + 1,
        y: 5,
        facing: "E",
        hp: 3,
        bullets: ["Normal", "Normal", "Normal"], // Normal, Piercing, Shotgun
        ap: 2,
        hand: [],
      };
    }
    return { boardSize: 10, players };
  },

};
