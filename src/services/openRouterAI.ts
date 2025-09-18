// src/services/openRouterAI.ts - OpenRouter AI Integration for Enemy Behavior
import { Position } from '../types/game.types';

interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

interface GameContext {
  maze: number[][];
  playerPos: Position;
  playerHistory: Position[];
  enemies: Array<{
    id: string;
    pos: Position;
    personality: string;
    state: string;
    energy: number;
  }>;
  collectibles: Position[];
  gameTime: number;
  difficulty: string;
}

interface AIResponse {
  enemyMoves: Array<{
    enemyId: string;
    newPosition: Position;
    newState: string;
    reasoning: string;
    confidence: number;
  }>;
  playerPrediction: {
    nextMove: Position;
    probability: number;
    reasoning: string;
  };
  difficultyAdjustment: {
    newDifficulty: string;
    reasoning: string;
  };
  strategicInsights: string[];
}

class OpenRouterAIService {
  private config: OpenRouterConfig;
  private gameHistory: GameContext[] = [];
  private playerPatterns: Map<string, number> = new Map();
  
  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  /**
   * Get AI-powered enemy decisions using OpenRouter
   */
  async getEnemyDecisions(gameContext: GameContext): Promise<AIResponse> {
    try {
      const prompt = this.buildGamePrompt(gameContext);
      
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Maze Game AI'
        },
        body: JSON.stringify({
          model: this.config.model, // e.g., "openai/gpt-4"
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt()
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      // Update game history for learning
      this.updateGameHistory(gameContext);
      
      return aiResponse;
    } catch (error) {
      console.warn('AI service error, falling back to basic AI:', error);
      return this.getFallbackDecisions(gameContext);
    }
  }

  /**
   * System prompt that defines the AI's role and capabilities
   */
  private getSystemPrompt(): string {
    return `You are an advanced AI system controlling enemies in a maze game. Your goal is to create challenging but fair gameplay by making intelligent decisions for each enemy.

ENEMY PERSONALITIES:
- Hunter: Aggressive, direct pursuit, high energy consumption
- Guardian: Defensive, protects areas, coordinated movement
- Scout: High intelligence, explores and tracks player patterns
- Ambusher: Patient, waits for opportunities, surprise attacks
- Swarm: Cooperates with others, collective intelligence

GAME RULES:
- Enemies move on a grid-based maze
- Player collects stars and reaches exit
- Enemies catch player by occupying same position
- Each enemy has energy (0-100) affecting performance
- Difficulty should adapt based on player skill

RESPONSE FORMAT:
Return JSON with:
- enemyMoves: Array of moves for each enemy
- playerPrediction: Predicted next player move
- difficultyAdjustment: Suggested difficulty changes
- strategicInsights: Analysis of current game state

Consider:
1. Player movement patterns and habits
2. Current game difficulty and player performance  
3. Enemy energy levels and states
4. Optimal pathfinding and coordination
5. Creating engaging but not frustrating gameplay`;
  }

  /**
   * Build detailed prompt with current game state
   */
  private buildGamePrompt(context: GameContext): string {
    const recentHistory = this.gameHistory.slice(-5);
    const playerPatternAnalysis = this.analyzePlayerPatterns(context.playerHistory);
    
    return `CURRENT GAME STATE:
Maze: ${context.maze.length}x${context.maze[0].length} grid
Player Position: (${context.playerPos.x}, ${context.playerPos.y})
Game Time: ${context.gameTime}s
Difficulty: ${context.difficulty}

PLAYER MOVEMENT HISTORY (last 10 moves):
${context.playerHistory.slice(-10).map((pos, i) => `${i}: (${pos.x}, ${pos.y})`).join('\n')}

PLAYER PATTERNS DETECTED:
${playerPatternAnalysis}

ENEMIES:
${context.enemies.map(enemy => 
  `${enemy.id}: ${enemy.personality} at (${enemy.pos.x}, ${enemy.pos.y}) - State: ${enemy.state}, Energy: ${enemy.energy}%`
).join('\n')}

COLLECTIBLES REMAINING: ${context.collectibles.length}
Positions: ${context.collectibles.map(c => `(${c.x}, ${c.y})`).join(', ')}

RECENT GAME PERFORMANCE:
${this.getPerformanceMetrics()}

Please analyze this situation and provide optimal enemy moves that create challenging but fair gameplay. Consider enemy personalities, current states, and player behavior patterns.`;
  }

  /**
   * Analyze player movement patterns for AI learning
   */
  private analyzePlayerPatterns(history: Position[]): string {
    if (history.length < 3) return "Insufficient data for pattern analysis";
    
    const directions = ['up', 'down', 'left', 'right'];
    const directionCounts = new Map<string, number>();
    const sequences = new Map<string, number>();
    
    // Analyze direction preferences
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      
      let direction = '';
      if (dx === 0 && dy === -1) direction = 'up';
      else if (dx === 0 && dy === 1) direction = 'down';
      else if (dx === -1 && dy === 0) direction = 'left';
      else if (dx === 1 && dy === 0) direction = 'right';
      
      if (direction) {
        directionCounts.set(direction, (directionCounts.get(direction) || 0) + 1);
      }
    }
    
    // Analyze 3-move sequences
    for (let i = 2; i < history.length; i++) {
      const seq = `${history[i-2].x},${history[i-2].y}->${history[i-1].x},${history[i-1].y}->${history[i].x},${history[i].y}`;
      sequences.set(seq, (sequences.get(seq) || 0) + 1);
    }
    
    const preferredDirection = Array.from(directionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
    
    const commonSequence = Array.from(sequences.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
    
    return `Preferred Direction: ${preferredDirection}
Most Common 3-Move Pattern: ${commonSequence}
Movement Consistency: ${this.calculateConsistency(history)}`;
  }

  /**
   * Calculate movement consistency score
   */
  private calculateConsistency(history: Position[]): string {
    if (history.length < 5) return "Low (insufficient data)";
    
    let consistentMoves = 0;
    for (let i = 2; i < history.length; i++) {
      const direction1 = this.getDirection(history[i-2], history[i-1]);
      const direction2 = this.getDirection(history[i-1], history[i]);
      if (direction1 === direction2) consistentMoves++;
    }
    
    const consistency = consistentMoves / (history.length - 2);
    if (consistency > 0.7) return "High";
    if (consistency > 0.4) return "Medium";
    return "Low";
  }

  /**
   * Get direction between two positions
   */
  private getDirection(from: Position, to: Position): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    if (dx === 0 && dy === -1) return 'up';
    if (dx === 0 && dy === 1) return 'down';
    if (dx === -1 && dy === 0) return 'left';
    if (dx === 1 && dy === 0) return 'right';
    return 'unknown';
  }

  /**
   * Get performance metrics for AI analysis
   */
  private getPerformanceMetrics(): string {
    if (this.gameHistory.length < 3) return "Insufficient game history";
    
    const recent = this.gameHistory.slice(-5);
    const avgGameTime = recent.reduce((sum, game) => sum + game.gameTime, 0) / recent.length;
    const playerCaught = recent.filter(game => game.enemies.some(e => 
      e.pos.x === game.playerPos.x && e.pos.y === game.playerPos.y
    )).length;
    
    return `Average Game Duration: ${avgGameTime.toFixed(1)}s
Player Caught Rate: ${(playerCaught / recent.length * 100).toFixed(1)}%
Games Analyzed: ${recent.length}`;
  }

  /**
   * Update game history for learning
   */
  private updateGameHistory(context: GameContext): void {
    this.gameHistory.push({ ...context });
    
    // Keep only last 50 games for performance
    if (this.gameHistory.length > 50) {
      this.gameHistory.shift();
    }
    
    // Update player pattern tracking
    this.updatePlayerPatterns(context.playerHistory);
  }

  /**
   * Update player pattern recognition
   */
  private updatePlayerPatterns(history: Position[]): void {
    if (history.length < 3) return;
    
    for (let i = 2; i < history.length; i++) {
      const pattern = `${history[i-2].x},${history[i-2].y}->${history[i-1].x},${history[i-1].y}->${history[i].x},${history[i].y}`;
      this.playerPatterns.set(pattern, (this.playerPatterns.get(pattern) || 0) + 1);
    }
  }

  /**
   * Fallback decisions when AI service is unavailable
   */
  private getFallbackDecisions(context: GameContext): AIResponse {
    const enemyMoves = context.enemies.map(enemy => ({
      enemyId: enemy.id,
      newPosition: this.getBasicMove(enemy.pos, context.playerPos, context.maze),
      newState: enemy.state,
      reasoning: "Fallback: Basic pathfinding",
      confidence: 0.5
    }));

    return {
      enemyMoves,
      playerPrediction: {
        nextMove: context.playerPos,
        probability: 0.3,
        reasoning: "Fallback: No prediction available"
      },
      difficultyAdjustment: {
        newDifficulty: context.difficulty,
        reasoning: "Fallback: Maintaining current difficulty"
      },
      strategicInsights: ["AI service unavailable, using basic enemy behavior"]
    };
  }

  /**
   * Basic movement calculation for fallback
   */
  private getBasicMove(enemyPos: Position, playerPos: Position, maze: number[][]): Position {
    const directions = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    
    let bestMove = enemyPos;
    let shortestDistance = Infinity;
    
    for (const dir of directions) {
      const newPos = { x: enemyPos.x + dir.x, y: enemyPos.y + dir.y };
      
      // Check bounds and walls
      if (newPos.y < 0 || newPos.y >= maze.length || 
          newPos.x < 0 || newPos.x >= maze[0].length || 
          maze[newPos.y][newPos.x] === 1) {
        continue;
      }
      
      const distance = Math.abs(newPos.x - playerPos.x) + Math.abs(newPos.y - playerPos.y);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestMove = newPos;
      }
    }
    
    return bestMove;
  }

  /**
   * Get AI model usage statistics
   */
  getUsageStats(): {
    totalRequests: number;
    successfulRequests: number;
    averageResponseTime: number;
    costEstimate: number;
  } {
    return {
      totalRequests: this.gameHistory.length,
      successfulRequests: this.gameHistory.length, // Simplified
      averageResponseTime: 500, // ms, estimated
      costEstimate: this.gameHistory.length * 0.01 // $0.01 per request, estimated
    };
  }
}

// Hook for using OpenRouter AI in the game
export const useOpenRouterAI = (apiKey: string, model: string = "openai/gpt-4") => {
  const aiService = new OpenRouterAIService({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    model
  });

  const getAIDecisions = async (gameContext: GameContext): Promise<AIResponse> => {
    return await aiService.getEnemyDecisions(gameContext);
  };

  const getUsageStats = () => {
    return aiService.getUsageStats();
  };

  return {
    getAIDecisions,
    getUsageStats,
    isAvailable: !!apiKey
  };
};

// Integration with existing enemy AI hook
export const useAIEnhancedEnemyAI = (
  maze: number[][],
  playerPos: Position,
  gameState: string,
  difficulty: string,
  openRouterApiKey?: string
) => {
  const [enemies, setEnemies] = useState<any[]>([]);
  const [playerHistory, setPlayerHistory] = useState<Position[]>([]);
  const [aiInsights, setAIInsights] = useState<string[]>([]);
  
  const openRouterAI = useOpenRouterAI(openRouterApiKey || '', "openai/gpt-3.5-turbo");
  
  const updateEnemies = useCallback(async () => {
    if (gameState !== 'playing' || enemies.length === 0) return;
    
    // Update player history
    setPlayerHistory(prev => [...prev.slice(-20), playerPos]); // Keep last 20 moves
    
    if (openRouterAI.isAvailable && playerHistory.length > 5) {
      try {
        const gameContext: GameContext = {
          maze,
          playerPos,
          playerHistory,
          enemies: enemies.map(e => ({
            id: e.id,
            pos: { x: e.x, y: e.y },
            personality: e.personality.type,
            state: e.currentState,
            energy: e.energy
          })),
          collectibles: [], // Would need to extract from maze
          gameTime: Date.now(),
          difficulty
        };
        
        const aiResponse = await openRouterAI.getAIDecisions(gameContext);
        
        // Apply AI decisions to enemies
        setEnemies(prevEnemies => 
          prevEnemies.map(enemy => {
            const aiMove = aiResponse.enemyMoves.find(m => m.enemyId === enemy.id);
            if (aiMove) {
              return {
                ...enemy,
                x: aiMove.newPosition.x,
                y: aiMove.newPosition.y,
                currentState: aiMove.newState,
                aiReasoning: aiMove.reasoning,
                aiConfidence: aiMove.confidence
              };
            }
            return enemy;
          })
        );
        
        setAIInsights(aiResponse.strategicInsights);
        
      } catch (error) {
        console.warn('AI decision failed, using fallback:', error);
        // Fall back to basic AI logic
      }
    }
  }, [gameState, enemies, playerPos, playerHistory, maze, difficulty, openRouterAI]);
  
  return {
    enemies,
    updateEnemies,
    setEnemies,
    aiInsights,
    playerHistory,
    usageStats: openRouterAI.getUsageStats()
  };
};
