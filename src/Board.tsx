import React, { useState, useEffect } from "react";
import type { GameState, PlayerState } from "./game";


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
  const [showPassScreen, setShowPassScreen] = useState(true);
  
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
  
useEffect(() => {
    setShowPassScreen(true);
}, [props.ctx.currentPlayer]);
  if (showPassScreen && G.gamePhase === "play") {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Pass The Device</h1>
                <h2 className="text-2xl text-red-400 mb-8">Player {props.ctx.currentPlayer}'s Turn</h2>
                <button className="px-8 py-4 bg-red-500 text-white text-lg rounded-lg hover:bg-red-600 transition" onClick={() => setShowPassScreen(false)}>Ready</button>
            </div>
        </div>
    )
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
          onClick={() => {
            if (pendingCard) {
              if (pendingCard.cardName === "Warp") props.moves.warp(pendingCard.cardIndex, col, row);
              else if (pendingCard.cardName === "Break") props.moves.breakWall(pendingCard.cardIndex, col, row);
              else if (pendingCard.cardName === "Build") props.moves.buildWall(pendingCard.cardIndex, col, row);
              else if (pendingCard.cardName === "Mine") props.moves.placeMine(pendingCard.cardIndex, col, row);
              else if (pendingCard.cardName === "Detonate") props.moves.detonateMine(pendingCard.cardIndex, col, row);
              else if (pendingCard.cardName === "Telekinesis") props.moves.Telekinesis(pendingCard.cardIndex, col, row);
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
          {playerHere ? (<>
            <span className="text-white">P{playerID} {facingArrows[(playerHere[1] as PlayerState).facing]}</span>
            <span className="text-red-400 text-xs"> {"❤️".repeat((playerHere[1] as PlayerState).hp)}</span>
            {(playerHere[1] as PlayerState).armor > 0 && <span className="text-xs">🛡️</span>}</>) : null}
            {G.mines.some(mine => mine.x === col && mine.y === row) && (
            <span className="text-xs">💣</span>)}
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
                        onClick = {() => {
                          if (card && card.name === "Shove") {
                            props.moves.shove(index);
                          }
                          else if (card && ["Warp", "Break", "Build", "Mine", "Detonate", "Telekinesis"].includes(card.name)) {
                            setPendingCard({ cardIndex: index, cardName: card.name });
                          }
                          else {
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

export default Board;