import { BrowserRouter, Routes, Route } from "react-router-dom";
import GamePage from "./pages/Game";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;