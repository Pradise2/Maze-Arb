// src/App.tsx

import MazeGame from './components/MazeGame';
// DELETE THIS LINE: import './App.css';

function App() {
  // REMOVE the className="App" from the div
  return (
    <div>
      <MazeGame />
    </div>
  );
}

export default App;