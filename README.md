# 🎮 Maze Master Game

A modern, interactive maze game built with React, TypeScript, and Tailwind CSS. Navigate through challenging mazes, collect stars, avoid enemies, and master multiple levels with beautiful animations and responsive design.

![Maze Master](https://img.shields.io/badge/Game-Maze%20Master-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🎯 Features

### 🎮 Core Gameplay
- **Multiple Levels**: 3 challenging levels with increasing difficulty
- **Smart Enemy AI**: Red enemies that chase and patrol intelligently  
- **Collectible System**: Gather all stars before reaching the exit
- **Time Challenges**: Beat the clock for bonus points
- **Smooth Controls**: Arrow keys, WASD, or touch controls

### 🎨 Visual & Audio
- **4 Beautiful Themes**: Default, Neon, Forest, and Space themes
- **Smooth Animations**: Pulsing effects, bouncing enemies, spinning collectibles
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Modern UI**: Glassmorphism effects and gradient backgrounds
- **Sound Effects**: Optional audio feedback (configurable)

### 📊 Game Features
- **Statistics Tracking**: High scores, completion rates, perfect runs
- **Achievement System**: Rank progression from Beginner to Master
- **Settings Panel**: Customize controls, themes, difficulty, and audio
- **Pause System**: Pause/resume gameplay anytime
- **Level Selection**: Jump to any unlocked level

### 🔧 Technical Features
- **TypeScript**: Full type safety and IntelliSense support
- **Modular Components**: Clean, reusable React components
- **Performance Optimized**: Efficient rendering and state management
- **Accessibility**: Keyboard navigation and screen reader support
- **Mobile Optimized**: Touch-friendly controls and responsive layout

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/maze-master-game.git
cd maze-master-game

# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000 in your browser
```

### Alternative Setup Methods

#### Using Create React App
```bash
npx create-react-app maze-game --template typescript
cd maze-game
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Using Vite (Recommended)
```bash
npm create vite@latest maze-game -- --template react-ts
cd maze-game
npm install
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Using Next.js
```bash
npx create-next-app@latest maze-game --typescript --tailwind
cd maze-game
npm install lucide-react
```

## 📁 Project Structure

```
maze-game/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── MazeGame.tsx          # Main game orchestrator
│   │   ├── MainMenu.tsx          # Start screen & navigation
│   │   ├── GameHUD.tsx           # Stats & progress display
│   │   ├── MazeRenderer.tsx      # Maze visualization engine
│   │   ├── GameControls.tsx      # Input controls interface
│   │   └── GameModals.tsx        # Game state overlays
│   ├── hooks/
│   │   ├── useGameState.ts       # Game state management
│   │   ├── usePlayerMovement.ts  # Movement logic
│   │   ├── useEnemyAI.ts         # Enemy behavior
│   │   └── useGameTimer.ts       # Timer management
│   ├── types/
│   │   └── game.types.ts         # TypeScript interfaces
│   ├── utils/
│   │   ├── gameConstants.ts      # Game constants & levels
│   │   ├── mazeUtils.ts          # Maze helper functions
│   │   └── collision.ts          # Collision detection
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## 🎮 How to Play

### Objective
Navigate through each maze, collect all the yellow stars ⭐, and reach the green exit door 🚪 before time runs out!

### Controls

#### Keyboard Controls
- **Arrow Keys** (↑↓←→): Move player
- **WASD Keys**: Alternative movement
- **Spacebar**: Pause/resume game
- **R Key**: Reset current level
- **Escape**: Return to main menu

#### Touch Controls
- **Arrow Buttons**: Tap to move
- **Hold Buttons**: Continuous movement
- **Action Buttons**: Pause, reset, menu

### Game Elements
- **😊 Player**: Your character (blue)
- **👾 Enemy**: Avoid these red opponents 
- **⭐ Star**: Collect all to unlock exit
- **🚪 Exit**: Reach after collecting stars
- **⬛ Wall**: Impassable barriers
- **⬜ Path**: Walkable areas

### Scoring System
- **Base Points**: 100 per star collected
- **Time Bonus**: 10 points per second remaining
- **Perfect Run**: Extra bonus for flawless completion
- **Level Multiplier**: Higher levels = more points

## 🧩 Component Architecture

### Core Components

#### MazeGame.tsx - Main Orchestrator
- Manages overall game state and logic
- Coordinates all sub-components
- Handles game loop and timing
- Processes player input and collisions

#### MainMenu.tsx - Start Screen
- Animated title and navigation
- Level selection interface
- High scores leaderboard  
- Settings configuration
- How-to-play guide

#### GameHUD.tsx - Stats Display
- Real-time score and timer
- Progress indicators
- Collection status
- Performance ratings

#### MazeRenderer.tsx - Visual Engine
- Dynamic maze rendering
- Theme system support
- Animation management
- Entity positioning

#### GameControls.tsx - Input Interface
- Multi-input support (keyboard/touch)
- Responsive button sizing
- Control scheme detection
- Accessibility features

#### GameModals.tsx - State Overlays
- Win/lose screens
- Pause menu
- Level complete celebrations
- Game completion statistics

### Custom Hooks

```typescript
// Game state management
const useGameState = (initialState) => {
  // Handles game state transitions
  // Manages level progression
  // Tracks statistics
}

// Player movement
const usePlayerMovement = (maze, gameState) => {
  // Validates moves against walls
  // Handles collision detection
  // Updates player position
}

// Enemy AI
const useEnemyAI = (maze, playerPos) => {
  // Implements chase behavior
  // Manages patrol patterns
  // Handles collision avoidance
}
```

## 🎨 Themes

### Available Themes
- **Default**: Clean blue and gray design
- **Neon**: Cyberpunk with glowing effects
- **Forest**: Nature-inspired greens
- **Space**: Dark cosmic theme

### Theme Configuration
```typescript
const themes = {
  default: {
    wall: 'bg-gray-800',
    path: 'bg-gray-100',
    player: 'bg-blue-500',
    enemy: 'bg-red-500'
  },
  neon: {
    wall: 'bg-purple-900 shadow-purple-500/20',
    path: 'bg-gray-900',
    player: 'bg-cyan-400 shadow-cyan-400/50',
    enemy: 'bg-red-500 shadow-red-500/50'
  }
  // ... more themes
}
```

## 🔧 Configuration

### Game Settings
```typescript
interface GameSettings {
  soundEnabled: boolean;        // Audio feedback
  musicEnabled: boolean;        // Background music
  difficulty: 'easy' | 'normal' | 'hard';
  theme: 'default' | 'neon' | 'forest' | 'space';
  controlStyle: 'compact' | 'comfortable' | 'large';
  animations: boolean;          // Visual effects
}
```

### Level Configuration
```typescript
interface Level {
  id: number;
  name: string;
  maze: number[][];            // 2D array maze layout
  timeLimit: number;           // Seconds to complete
  collectibles: number;        // Stars to collect
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts for configuration
```

### Netlify
```bash
# Build the project
npm run build

# Deploy to Netlify
# Option 1: Drag & drop build folder to netlify.com
# Option 2: Use Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

### GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📱 Mobile Optimization

### Features
- **Touch Controls**: Large, finger-friendly buttons
- **Responsive Layout**: Adapts to all screen sizes
- **Performance**: Optimized for mobile devices
- **Offline Support**: Service worker implementation
- **PWA Ready**: Add to home screen capability

### Mobile-Specific CSS
```css
/* Touch-friendly controls */
@media (max-width: 768px) {
  .game-controls button {
    min-width: 48px;
    min-height: 48px;
    padding: 12px;
  }
}

/* Prevent zoom on input */
input, button {
  font-size: 16px;
}
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import MazeGame from './MazeGame';

test('renders game title', () => {
  render(<MazeGame />);
  const titleElement = screen.getByText(/maze master/i);
  expect(titleElement).toBeInTheDocument();
});
```

## 🎯 Performance Optimization

### React Optimizations
- **React.memo()**: Prevent unnecessary re-renders
- **useCallback()**: Stable function references  
- **useMemo()**: Expensive calculation caching
- **Code Splitting**: Lazy load components

### Bundle Optimization
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s  
- **Time to Interactive**: < 3.8s
- **Cumulative Layout Shift**: < 0.1

## 🔍 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# TypeScript errors
npm run type-check
```

#### Performance Issues
```bash
# Enable React DevTools Profiler
# Check for unnecessary re-renders
# Optimize heavy components with memo()
```

#### Mobile Issues
```bash
# Test on actual devices
# Check touch event handling
# Verify responsive breakpoints
```

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain component modularity
- Add tests for new features
- Update documentation
- Follow existing code style

### Code Style
```bash
# Install prettier and eslint
npm install -D prettier eslint

# Format code
npm run format

# Lint code
npm run lint
```

## 📝 Changelog

### v1.0.0 (2024-01-01)
- ✨ Initial release
- 🎮 Three complete levels
- 🎨 Four beautiful themes
- 📱 Mobile responsive design
- 🏆 Statistics and scoring system

### v1.1.0 (Coming Soon)
- 🎵 Background music system
- 🏗️ Level editor
- 🌐 Multiplayer support
- 📊 Advanced analytics

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide React** - For the beautiful icon set
- **TypeScript Team** - For type safety and developer experience

## 📞 Support

### Get Help
- 📧 Email: support@mazegame.com
- 💬 Discord: [Join our community](https://discord.gg/mazegame)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/maze-game/issues)
- 📖 Docs: [Documentation](https://mazegame.gitbook.io)

### FAQ

**Q: How do I add new levels?**
A: Edit the `LEVELS` array in `gameConstants.ts` with your maze layout.

**Q: Can I customize the themes?**
A: Yes! Modify the theme objects in `MazeRenderer.tsx`.

**Q: How do I enable sound effects?**
A: Toggle the sound setting in the main menu settings panel.

**Q: Is this game mobile-friendly?**
A: Absolutely! The game is fully responsive and optimized for mobile devices.

---

Made with ❤️ by [Your Name](https://github.com/yourusername)

**[⬆ Back to Top](#-maze-master-game)**
