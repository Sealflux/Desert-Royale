import { Client } from "boardgame.io/react";
import { DesertRoyale } from './Game'
import { Board } from './Board'

const App = Client({
  game: DesertRoyale,
  board: Board,
}); 

export default App;