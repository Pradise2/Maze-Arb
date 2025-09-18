// src/config/aiConfig.ts - OpenRouter AI Configuration
export interface AIConfig {
  enabled: boolean;
  provider: 'openrouter' | 'openai' | 'anthropic' | 'local';
  apiKey: string;
  model: string;
  baseURL: string;
  maxTokens: number;
  temperature: number;
  requestTimeout: number;
  rateLimitDelay: number;
  fallbackEnabled: boolean;
}

// Default configuration
export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  provider: 'openrouter',
  apiKey: '',
  model: 'openai/gpt-3.5-turbo',
  baseURL: 'https://openrouter.ai/api/v1',
  maxTokens: 1000,
  temperature: 0.7,
  requestTimeout: 10000,
  rateLimitDelay: 1000,
  fallbackEnabled: true
};

// Available models on OpenRouter with pricing and capabilities
export const OPENROUTER_MODELS = {
  // Fast and economical
  'openai/gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    cost: '$0.0015 / 1K tokens',
    speed: 'Fast',
    intelligence: 'Good',
    description: 'Best balance of speed and cost for game AI'
  },
  
  // Higher intelligence
  'openai/gpt-4': {
    name: 'GPT-4',
    provider: 'OpenAI',
    cost: '$0.03 / 1K tokens',
    speed: 'Medium',
    intelligence: 'Excellent',
    description: 'Superior strategic thinking for advanced players'
  },
  
  // Alternative providers
  'anthropic/claude-3-haiku': {
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    cost: '$0.00025 / 1K tokens',
    speed: 'Very Fast',
    intelligence: 'Good',
    description: 'Extremely fast and cost-effective'
  },
  
  'anthropic/claude-3-sonnet': {
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    cost: '$0.003 / 1K tokens',
    speed: 'Fast',
    intelligence: 'Excellent',
    description: 'Great balance of speed and intelligence'
  },
  
  // Open source options
  'meta-llama/llama-3.1-8b-instruct:free': {
    name: 'Llama 3.1 8B (Free)',
    provider: 'Meta',
    cost: 'Free',
    speed: 'Fast',
    intelligence: 'Good',
    description: 'Free option with decent performance'
  }
};

// Environment configuration helper
export const getAIConfigFromEnv = (): AIConfig => ({
  enabled: process.env.REACT_APP_AI_ENABLED === 'true',
  provider: (process.env.REACT_APP_AI_PROVIDER as any) || 'openrouter',
  apiKey: process.env.REACT_APP_OPENROUTER_API_KEY || '',
  model: process.env.REACT_APP_AI_MODEL || 'openai/gpt-3.5-turbo',
  baseURL: process.env.REACT_APP_AI_BASE_URL || 'https://openrouter.ai/api/v1',
  maxTokens: parseInt(process.env.REACT_APP_AI_MAX_TOKENS || '1000'),
  temperature: parseFloat(process.env.REACT_APP_AI_TEMPERATURE || '0.7'),
  requestTimeout: parseInt(process.env.REACT_APP_AI_TIMEOUT || '10000'),
  rateLimitDelay: parseInt(process.env.REACT_APP_AI_RATE_LIMIT || '1000'),
  fallbackEnabled: process.env.REACT_APP_AI_FALLBACK !== 'false'
});

// Validate AI configuration
export const validateAIConfig = (config: AIConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (config.enabled && !config.apiKey) {
    errors.push('API key is required when AI is enabled');
  }
  
  if (!config.model) {
    errors.push('Model must be specified');
  }
  
  if (config.maxTokens < 100 || config.maxTokens > 4000) {
    errors.push('Max tokens should be between 100 and 4000');
  }
  
  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperature should be between 0 and 2');
  }
  
  if (!config.baseURL.startsWith('https://')) {
    errors.push('Base URL should use HTTPS');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Cost estimation helper
export const estimateAICost = (gameMinutes: number, difficulty: string): {
  tokensPerMinute: number;
  estimatedTokens: number;
  estimatedCost: number;
  model: string;
} => {
  // Estimate token usage based on game complexity
  const baseTokensPerMinute = difficulty === 'hard' ? 200 : difficulty === 'normal' ? 150 : 100;
  const estimatedTokens = gameMinutes * baseTokensPerMinute;
  
  // Get current model pricing (simplified)
  const model = DEFAULT_AI_CONFIG.model;
  const costPer1K = model.includes('gpt-4') ? 0.03 : 
                   model.includes('gpt-3.5') ? 0.0015 :
                   model.includes('claude-3-sonnet') ? 0.003 :
                   model.includes('claude-3-haiku') ? 0.00025 : 0;
  
  const estimatedCost = (estimatedTokens / 1000) * costPer1K;
  
  return {
    tokensPerMinute: baseTokensPerMinute,
    estimatedTokens,
    estimatedCost,
    model
  };
};

// .env template generator
export const generateEnvTemplate = (): string => {
  return `# AI Configuration for Maze Game
# Get your API key from https://openrouter.ai/

# Enable/disable AI features
REACT_APP_AI_ENABLED=true

# OpenRouter API Key (required if AI enabled)
REACT_APP_OPENROUTER_API_KEY=your_api_key_here

# AI Model Selection
# Recommended: openai/gpt-3.5-turbo (fast, affordable)
# Premium: openai/gpt-4 (smarter, more expensive)
# Budget: meta-llama/llama-3.1-8b-instruct:free (free)
REACT_APP_AI_MODEL=openai/gpt-3.5-turbo

# Advanced Settings (optional)
REACT_APP_AI_PROVIDER=openrouter
REACT_APP_AI_BASE_URL=https://openrouter.ai/api/v1
REACT_APP_AI_MAX_TOKENS=1000
REACT_APP_AI_TEMPERATURE=0.7
REACT_APP_AI_TIMEOUT=10000
REACT_APP_AI_RATE_LIMIT=1000
REACT_APP_AI_FALLBACK=true

# Cost Control (optional)
REACT_APP_AI_MAX_COST_PER_HOUR=0.50
REACT_APP_AI_WARN_THRESHOLD=0.10
`;
};

// Setup instructions
export const AI_SETUP_INSTRUCTIONS = {
  steps: [
    {
      title: "Get OpenRouter API Key",
      description: "Sign up at https://openrouter.ai and get your API key",
      action: "Visit OpenRouter website"
    },
    {
      title: "Add Environment Variables",
      description: "Add your API key and configuration to .env file",
      action: "Create .env file with template above"
    },
    {
      title: "Choose AI Model",
      description: "Select model based on your budget and performance needs",
      action: "Update REACT_APP_AI_MODEL in .env"
    },
    {
      title: "Test Configuration",
      description: "Start the game and check if AI features work",
      action: "Run npm start and test enemy behavior"
    }
  ],
  
  troubleshooting: [
    {
      issue: "API key not working",
      solution: "Check if key is valid and has sufficient credits"
    },
    {
      issue: "Slow AI responses",
      solution: "Switch to faster model like gpt-3.5-turbo or claude-3-haiku"
    },
    {
      issue: "High costs",
      solution: "Use free model or implement request rate limiting"
    },
    {
      issue: "AI not making smart moves",
      solution: "Try higher intelligence model like gpt-4 or claude-3-sonnet"
    }
  ],
  
  costOptimization: [
    "Use gpt-3.5-turbo for most scenarios",
    "Implement caching for similar game states",
    "Reduce AI update frequency during gameplay",
    "Use local fallback when API is expensive",
    "Set daily/hourly spending limits"
  ]
};

// React component for AI configuration UI
export const AIConfigPanel: React.FC<{
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
}> = ({ config, onConfigChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const validation = validateAIConfig(config);
  const costEstimate = estimateAICost(30, 'normal'); // 30 min session
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        🤖 AI Configuration
        <span className={`px-2 py-1 rounded text-xs ${
          config.enabled && validation.valid ? 'bg-green-600' : 'bg-gray-600'
        }`}>
          {config.enabled && validation.valid ? 'Active' : 'Disabled'}
        </span>
      </h3>
      
      {/* Enable/Disable Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onConfigChange({ ...config, enabled: e.target.checked })}
            className="w-4 h-4"
          />
          <span>Enable AI-Enhanced Enemy Behavior</span>
        </label>
      </div>
      
      {config.enabled && (
        <>
          {/* API Key */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
              placeholder="sk-or-..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
            <div className="text-xs text-gray-400 mt-1">
              Get your API key from{' '}
              <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" 
                 className="text-blue-400 hover:underline">
                openrouter.ai
              </a>
            </div>
          </div>
          
          {/* Model Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              AI Model
            </label>
            <select
              value={config.model}
              onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {Object.entries(OPENROUTER_MODELS).map(([key, model]) => (
                <option key={key} value={key}>
                  {model.name} - {model.cost} ({model.speed})
                </option>
              ))}
            </select>
          </div>
          
          {/* Cost Estimate */}
          <div className="mb-4 bg-gray-700 rounded p-3">
            <div className="text-sm font-medium mb-1">Estimated Cost (30 min session)</div>
            <div className="text-lg font-bold text-green-400">
              ${costEstimate.estimatedCost.toFixed(4)}
            </div>
            <div className="text-xs text-gray-400">
              ~{costEstimate.estimatedTokens} tokens with {costEstimate.model}
            </div>
          </div>
          
          {/* Advanced Settings */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-400 hover:underline text-sm mb-4"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>
          
          {showAdvanced && (
            <div className="space-y-3 mb-4 bg-gray-700 rounded p-3">
              <div>
                <label className="block text-sm font-medium mb-1">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => onConfigChange({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-400">
                  {config.temperature} (Lower = more predictable, Higher = more creative)
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Tokens</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={config.maxTokens}
                  onChange={(e) => onConfigChange({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Request Timeout (ms)</label>
                <input
                  type="number"
                  min="1000"
                  max="30000"
                  value={config.requestTimeout}
                  onChange={(e) => onConfigChange({ ...config, requestTimeout: parseInt(e.target.value) })}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white"
                />
              </div>
            </div>
          )}
          
          {/* Validation Errors */}
          {!validation.valid && (
            <div className="bg-red-900/50 border border-red-500 rounded p-3 mb-4">
              <div className="text-red-300 text-sm font-medium mb-2">Configuration Issues:</div>
              <ul className="text-red-200 text-sm space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-red-400">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};
