// Smart Model Router - Selects optimal model based on task complexity
// Uses cost-effective models for simple tasks, powerful models for complex ones

export type ModelTier = 'fast' | 'balanced' | 'powerful';

export interface ModelSelection {
  model: string;
  tier: ModelTier;
  estimatedCost: 'low' | 'medium' | 'high';
  reasoning: string;
}

/**
 * Analyze code editing task complexity to select the best model
 *
 * FAST (Haiku): Simple styling changes, color updates, single-line edits
 * BALANCED (Sonnet): Multi-line changes, refactoring, logic updates
 * POWERFUL (Opus): Complex refactoring, architectural changes, multi-file coordination
 */
export function selectModelForCodeEdit(
  instruction: string,
  fileType: 'html' | 'css' | 'js' | 'php',
  codeLength: number
): ModelSelection {
  const instructionLower = instruction.toLowerCase();

  // Simple CSS changes → Fast model
  const simpleStylePatterns = [
    /change.*color/i,
    /update.*color/i,
    /make.*bigger|larger|smaller/i,
    /add.*padding|margin/i,
    /change.*font/i,
    /update.*background/i,
  ];

  const isSimpleStyle = simpleStylePatterns.some(pattern => pattern.test(instruction));

  // Complex refactoring → Powerful model
  const complexPatterns = [
    /refactor/i,
    /restructure/i,
    /optimize/i,
    /rewrite/i,
    /convert.*to/i,
    /migrate/i,
  ];

  const isComplex = complexPatterns.some(pattern => pattern.test(instruction));

  // Code length consideration
  const isLargeFile = codeLength > 500; // lines
  const isSmallFile = codeLength < 100;

  // Decision logic
  // NOTE: Only use Haiku for generation mode (empty files), not diff editing
  // Haiku sometimes struggles with generating proper unified diffs
  if (isSimpleStyle && fileType === 'css' && isSmallFile && codeLength === 0) {
    return {
      model: 'anthropic/claude-haiku-4-5-20250929',
      tier: 'fast',
      estimatedCost: 'low',
      reasoning: 'Simple CSS generation from scratch - using fast model for efficiency'
    };
  }

  if (isComplex || isLargeFile || fileType === 'php') {
    return {
      model: 'anthropic/claude-sonnet-4-5-20250929',
      tier: 'powerful',
      estimatedCost: 'high',
      reasoning: 'Complex task or large file - using powerful model for accuracy'
    };
  }

  // Default: Balanced model (Sonnet)
  return {
    model: 'anthropic/claude-sonnet-4-5-20250929',
    tier: 'balanced',
    estimatedCost: 'medium',
    reasoning: 'Standard code editing task - using balanced model'
  };
}

/**
 * Get available models for manual override
 */
export const AVAILABLE_MODELS = {
  fast: 'anthropic/claude-haiku-4-5-20250929',
  balanced: 'anthropic/claude-sonnet-4-5-20250929',
  powerful: 'anthropic/claude-sonnet-4-5-20250929', // Using Sonnet as most powerful for now
} as const;
