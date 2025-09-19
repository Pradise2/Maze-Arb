// src/App.tsx - Clean Version (Corrected)
import React, { useEffect } from 'react'; // 1. Import useEffect
import MazeGame from './components/MazeGame';
import { sdk } from '@farcaster/miniapp-sdk';

function App() {
  // Use useEffect for side effects like interacting with the SDK on load
  useEffect(() => {
    // 2. Correctly signal that the Mini App is ready
    sdk.actions.ready(); 

    // 3. The incorrect addFrame call has been removed
  }, []); // The empty dependency array ensures this runs only once when the component mounts

  // 4. The return statement is now in the correct place
  return (
    <div className="min-h-screen">
      <MazeGame />
    </div>
  );
}

export default App;