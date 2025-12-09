/**
 * Benchmark Service
 * 
 * Tests different strategies for AI response generation to identify
 * the most performant approach for the Wakatto app.
 * 
 * ANIMATION-PRESERVING Strategies (Phase 2):
 * - baseline: Current full animated scene prompt
 * - compact-prompt: Same animations, fewer instruction tokens
 * - compact-json: Shorter JSON field names in response
 * - parallel-save: Simulate parallel user message save
 * 
 * Legacy Strategies (for comparison):
 * - full-prompt: Alias for baseline
 * - minimal-prompt: Stripped-down (NO animations - not for production)
 * 
 * Usage:
 *   const benchmark = getBenchmarkRunner();
 *   const results = await benchmark.runAnimationBenchmark(2);
 *   benchmark.printResults(results);
 */

import { getProfiler, PROFILE_OPS, ProfileSession } from './profilingService';
import { generateAIResponse } from './aiService';
import { getCharacter, getCharacterPrompt } from '../config/characters';
import { supabase } from '../lib/supabase';

// ============================================
// Types
// ============================================

export type BenchmarkStrategy = 
  // Animation-preserving strategies (Phase 2)
  | 'baseline'          // Current production approach with full animations
  | 'compact-prompt'    // Same animations, optimized instruction text
  | 'compact-json'      // Shorter JSON field names in expected response
  | 'parallel-save'     // Full animations + simulated parallel save
  // Legacy strategies
  | 'full-prompt'       // Alias for baseline
  | 'minimal-prompt'    // Stripped-down prompt (NO animations)
  | 'cached-auth'       // Pre-cached auth session
  | 'parallel-ops'      // Parallel DB + AI operations
  | 'haiku-model'       // Claude 3.5 Haiku with minimal prompt
  | 'sonnet-model';     // Claude 3.5 Sonnet with minimal prompt

export interface BenchmarkConfig {
  strategy: BenchmarkStrategy;
  model?: string;
  numCharacters: number;
  messageLength: 'short' | 'medium' | 'long';
  iterations?: number;
  warmupRuns?: number;
}

export interface BenchmarkResult {
  config: BenchmarkConfig;
  iterations: number;
  durations: number[];
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  p50Ms: number;
  p90Ms: number;
  p99Ms: number;
  stdDev: number;
  tokenStats: {
    avgPromptTokens: number;
    avgResponseTokens: number;
  };
  errors: string[];
  sessions: ProfileSession[];
}

export interface BenchmarkReport {
  timestamp: Date;
  results: BenchmarkResult[];
  winner: {
    strategy: BenchmarkStrategy;
    improvement: number; // percentage improvement over full-prompt
  };
  summary: string;
}

// ============================================
// Sample Messages
// ============================================

const SAMPLE_MESSAGES = {
  short: "Hi, how are you?",
  medium: "I've been feeling a bit stressed lately about work. What do you think I should do?",
  long: "I've been going through a really difficult time lately. My job is stressful, my relationships are complicated, and I'm not sleeping well. I often feel overwhelmed and don't know where to start fixing things. Sometimes I wonder if I'm on the right path in life. What advice would you give someone in my situation? How do you think I should approach this?",
};

// ============================================
// Prompt Strategies
// ============================================

/**
 * Minimal prompt - NO animations (legacy, not for production)
 */
function buildMinimalPrompt(
  characterIds: string[],
  userMessage: string
): string {
  const characters = characterIds.map(id => {
    const char = getCharacter(id);
    return `${char.name} (${id}): ${char.description}`;
  }).join('\n');

  return `You are orchestrating responses from these Wakattor characters:
${characters}

Respond with JSON only:
{
  "scene": {
    "totalDuration": 5000,
    "characters": [
      {
        "character": "character_id",
        "content": "Response text",
        "startDelay": 0,
        "timeline": [{"animation": "talking", "duration": 3000}]
      }
    ]
  }
}

User message: ${userMessage}`;
}

/**
 * Compact prompt - KEEPS animations but uses fewer tokens for instructions
 * ~40% fewer instruction tokens while maintaining all features
 */
function buildCompactAnimatedPrompt(characterIds: string[]): string {
  const chars = characterIds.map((id, idx) => {
    const char = getCharacter(id);
    const pos = idx === 0 ? 'L' : idx === 1 ? 'C' : 'R';
    return `${char.name}(${id},${pos}): ${char.description.substring(0, 60)}`;
  }).join('\n');

  return `# Scene Orchestrator
Direct animated multi-character conversation.

## Characters
${chars}

## Animations
Body: idle,talking,thinking,nodding,waving,leaning_forward
Look: at_user,at_left_character,at_right_character,up,down
Eye: open,squint,wide | Mouth: closed,smile,open

## Output JSON
{"scene":{"totalDuration":MS,"characters":[{"character":"ID","content":"TEXT","startDelay":MS,"timeline":[{"animation":"NAME","duration":MS,"talking":BOOL,"look":"DIR"}]}]}}

Rules: 1-2 sentences, ID not name, no name prefix, first startDelay:0`;
}

/**
 * Compact JSON prompt - KEEPS animations but expects shorter response field names
 * Reduces response tokens by ~30%
 */
function buildCompactJsonPrompt(characterIds: string[]): string {
  const chars = characterIds.map((id, idx) => {
    const char = getCharacter(id);
    const pos = idx === 0 ? 'left' : idx === 1 ? 'center' : 'right';
    return `### ${char.name} (ID: ${id}, Position: ${pos})
${char.description}`;
  }).join('\n\n');

  return `# Animated Scene Orchestrator

## Characters
${chars}

## Animation Options
Animations: idle, talking, thinking, nodding, waving, leaning_forward
Look: at_user, at_left_character, at_right_character, up, down

## Response Format (COMPACT JSON)
Use short keys: c=character, t=content, d=startDelay, tl=timeline, a=animation, ms=duration, lk=look

{"s":{"dur":10000,"ch":[{"c":"char_id","t":"Response text","d":0,"tl":[{"a":"thinking","ms":1000},{"a":"talking","ms":3000,"lk":"at_user"}]}]}}

Rules:
- 1-2 sentences per response
- Use character ID in "c" field
- No name prefix in "t" field
- First character: d:0`;
}

/**
 * Full baseline prompt - current production approach
 */
function buildBaselinePrompt(characterIds: string[]): string {
  const characters = characterIds.map((id, idx) => {
    const char = getCharacter(id);
    return `### ${char.name} (ID: ${id}, Position: ${idx === 0 ? 'left' : idx === 1 ? 'center' : 'right'})
${char.description}

Approach: ${getCharacterPrompt(char)}`;
  }).join('\n\n');

  return `# Animated Multi-Character Scene Orchestrator

You are directing an ANIMATED conversation scene between multiple AI characters.

## Characters
${characters}

## Animation System
Available animations: idle, talking, thinking, nodding, waving, leaning_forward
Look directions: at_user, at_left_character, at_right_character, up, down
Eye states: open, squint, wide
Mouth states: closed, smile, open

## Response Format (JSON only)
{
  "scene": {
    "totalDuration": 10000,
    "characters": [
      {
        "character": "character_id",
        "content": "Response without name prefix",
        "startDelay": 0,
        "timeline": [
          {"animation": "thinking", "duration": 1000, "look": "up"},
          {"animation": "talking", "duration": 3000, "talking": true, "look": "at_user"}
        ]
      }
    ]
  }
}

## Rules
- Keep responses to 1-2 sentences
- Use character ID not display name in "character" field
- "content" should not have character name prefix
- First character starts at startDelay: 0
- Include at least 2 timeline segments per character`;
}

// ============================================
// Benchmark Runner
// ============================================

class BenchmarkRunner {
  private cachedSession: any = null;
  private sessionExpiry: number = 0;
  private isRunning: boolean = false;

  /**
   * Pre-cache auth session
   */
  async warmupAuth(): Promise<void> {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      this.cachedSession = data.session;
      // Cache for 30 minutes
      this.sessionExpiry = Date.now() + 30 * 60 * 1000;
    }
  }

  /**
   * Get cached or fresh auth session
   */
  async getAuthSession(): Promise<any> {
    if (this.cachedSession && Date.now() < this.sessionExpiry) {
      return this.cachedSession;
    }
    await this.warmupAuth();
    return this.cachedSession;
  }

  /**
   * Run a single benchmark iteration
   */
  private async runIteration(
    config: BenchmarkConfig,
    profiler: ReturnType<typeof getProfiler>
  ): Promise<{ duration: number; tokens: { prompt: number; response: number } }> {
    const message = SAMPLE_MESSAGES[config.messageLength];
    const characterIds = this.getTestCharacters(config.numCharacters);

    profiler.startSession(`benchmark_${config.strategy}_${Date.now()}`);
    const timer = profiler.start(PROFILE_OPS.FULL_MESSAGE_FLOW);

    try {
      let prompt: string;
      let model = config.model;

      switch (config.strategy) {
        // ===== Animation-Preserving Strategies (Phase 2) =====
        case 'baseline':
        case 'full-prompt':
          // Current production approach with full animations
          prompt = buildBaselinePrompt(characterIds);
          break;
        
        case 'compact-prompt':
          // Same animations, ~40% fewer instruction tokens
          prompt = buildCompactAnimatedPrompt(characterIds);
          break;
        
        case 'compact-json':
          // Full animations, shorter response field names
          prompt = buildCompactJsonPrompt(characterIds);
          break;
        
        case 'parallel-save':
          // Full animations + simulated parallel save (no actual difference in API call)
          prompt = buildBaselinePrompt(characterIds);
          // Note: Real parallel save happens at MainTabs level, not here
          break;
        
        // ===== Legacy Strategies =====
        case 'minimal-prompt':
          // NO animations - not for production use
          prompt = buildMinimalPrompt(characterIds, message);
          break;
        
        case 'haiku-model':
          prompt = buildMinimalPrompt(characterIds, message);
          model = 'claude-3-5-haiku-20241022';
          break;
        
        case 'sonnet-model':
          prompt = buildMinimalPrompt(characterIds, message);
          model = 'claude-3-5-sonnet-20241022';
          break;
        
        case 'cached-auth':
          await this.getAuthSession();
          prompt = buildMinimalPrompt(characterIds, message);
          break;
        
        case 'parallel-ops':
          prompt = buildMinimalPrompt(characterIds, message);
          break;
        
        default:
          prompt = buildBaselinePrompt(characterIds);
          break;
      }

      const response = await generateAIResponse(
        [{ role: 'user', content: message }],
        prompt,
        'orchestrator'
      );

      const result = timer.stop({
        strategy: config.strategy,
        characterCount: config.numCharacters,
      });

      const session = profiler.endSession();
      
      // Estimate tokens
      const promptTokens = profiler.estimateTokens(prompt);
      const responseTokens = profiler.estimateTokens(response);

      return {
        duration: result.durationMs,
        tokens: { prompt: promptTokens, response: responseTokens },
      };
    } catch (error) {
      timer.stop({ error: error instanceof Error ? error.message : String(error) });
      profiler.endSession();
      throw error;
    }
  }

  /**
   * Get test character IDs
   */
  private getTestCharacters(count: number): string[] {
    const characters = ['freud', 'jung', 'nietzsche', 'nhathanh', 'adler'];
    return characters.slice(0, Math.min(count, characters.length));
  }

  /**
   * Calculate statistics from duration array
   */
  private calculateStats(durations: number[]): {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p99: number;
    stdDev: number;
  } {
    if (durations.length === 0) {
      return { avg: 0, min: 0, max: 0, p50: 0, p90: 0, p99: 0, stdDev: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    
    // Standard deviation
    const squareDiffs = durations.map(d => Math.pow(d - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / durations.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Percentiles
    const percentile = (p: number) => {
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, idx)];
    };

    return {
      avg,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: percentile(50),
      p90: percentile(90),
      p99: percentile(99),
      stdDev,
    };
  }

  /**
   * Run benchmark with given configurations
   */
  async run(configs: BenchmarkConfig[]): Promise<BenchmarkResult[]> {
    if (this.isRunning) {
      throw new Error('Benchmark already running');
    }

    this.isRunning = true;
    const results: BenchmarkResult[] = [];
    const profiler = getProfiler();

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              BENCHMARK STARTING                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
      // Warmup auth for cached-auth strategy
      await this.warmupAuth();

      for (const config of configs) {
        const iterations = config.iterations || 3;
        const warmupRuns = config.warmupRuns || 1;
        const durations: number[] = [];
        const tokens: { prompt: number; response: number }[] = [];
        const errors: string[] = [];
        const sessions: ProfileSession[] = [];

        console.log(`\n▶ Running: ${config.strategy} (${config.numCharacters} chars, ${config.messageLength} msg)`);

        // Warmup runs (not counted)
        for (let i = 0; i < warmupRuns; i++) {
          console.log(`  Warmup ${i + 1}/${warmupRuns}...`);
          try {
            await this.runIteration(config, profiler);
          } catch (e) {
            console.log(`  Warmup failed: ${e}`);
          }
        }

        // Actual runs
        for (let i = 0; i < iterations; i++) {
          console.log(`  Run ${i + 1}/${iterations}...`);
          try {
            const result = await this.runIteration(config, profiler);
            durations.push(result.duration);
            tokens.push(result.tokens);
            
            const session = profiler.getLastSession();
            if (session) sessions.push(session);
            
            console.log(`    ✓ ${result.duration.toFixed(0)}ms`);
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            errors.push(msg);
            console.log(`    ✗ Error: ${msg}`);
          }
          
          // Small delay between runs
          await new Promise(r => setTimeout(r, 500));
        }

        const stats = this.calculateStats(durations);
        const avgPromptTokens = tokens.length > 0
          ? tokens.reduce((a, t) => a + t.prompt, 0) / tokens.length
          : 0;
        const avgResponseTokens = tokens.length > 0
          ? tokens.reduce((a, t) => a + t.response, 0) / tokens.length
          : 0;

        results.push({
          config,
          iterations: durations.length,
          durations,
          avgDurationMs: stats.avg,
          minDurationMs: stats.min,
          maxDurationMs: stats.max,
          p50Ms: stats.p50,
          p90Ms: stats.p90,
          p99Ms: stats.p99,
          stdDev: stats.stdDev,
          tokenStats: {
            avgPromptTokens,
            avgResponseTokens,
          },
          errors,
          sessions,
        });
      }

      return results;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Generate a benchmark report
   */
  generateReport(results: BenchmarkResult[]): BenchmarkReport {
    // Find baseline (full-prompt)
    const baseline = results.find(r => r.config.strategy === 'full-prompt');
    const baselineAvg = baseline?.avgDurationMs || results[0]?.avgDurationMs || 1;

    // Find winner
    const validResults = results.filter(r => r.iterations > 0 && r.errors.length === 0);
    const sorted = [...validResults].sort((a, b) => a.avgDurationMs - b.avgDurationMs);
    const winner = sorted[0];
    const improvement = ((baselineAvg - winner.avgDurationMs) / baselineAvg) * 100;

    // Generate summary
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════════',
      '                    BENCHMARK REPORT',
      '═══════════════════════════════════════════════════════════════',
      '',
    ];

    for (const result of results) {
      const isWinner = result === winner;
      const prefix = isWinner ? '★ ' : '  ';
      const vsBaseline = baseline && result !== baseline
        ? ` (${result.avgDurationMs < baselineAvg ? '-' : '+'}${Math.abs(((result.avgDurationMs - baselineAvg) / baselineAvg) * 100).toFixed(1)}%)`
        : '';
      
      lines.push(`${prefix}${result.config.strategy.toUpperCase()}`);
      lines.push(`  Avg: ${result.avgDurationMs.toFixed(0)}ms${vsBaseline}`);
      lines.push(`  Range: ${result.minDurationMs.toFixed(0)}ms - ${result.maxDurationMs.toFixed(0)}ms`);
      lines.push(`  P50/P90/P99: ${result.p50Ms.toFixed(0)}/${result.p90Ms.toFixed(0)}/${result.p99Ms.toFixed(0)}ms`);
      lines.push(`  Tokens: ~${result.tokenStats.avgPromptTokens.toFixed(0)} prompt / ~${result.tokenStats.avgResponseTokens.toFixed(0)} response`);
      if (result.errors.length > 0) {
        lines.push(`  Errors: ${result.errors.length}`);
      }
      lines.push('');
    }

    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`WINNER: ${winner.config.strategy} (${improvement.toFixed(1)}% faster than full-prompt)`);
    lines.push('═══════════════════════════════════════════════════════════════');

    return {
      timestamp: new Date(),
      results,
      winner: {
        strategy: winner.config.strategy,
        improvement,
      },
      summary: lines.join('\n'),
    };
  }

  /**
   * Print results to console
   */
  printResults(results: BenchmarkResult[]): void {
    const report = this.generateReport(results);
    console.log('\n' + report.summary);
  }

  /**
   * Run a quick comparison between strategies (legacy)
   */
  async quickCompare(numCharacters: number = 2): Promise<BenchmarkReport> {
    const configs: BenchmarkConfig[] = [
      { strategy: 'full-prompt', numCharacters, messageLength: 'medium', iterations: 2 },
      { strategy: 'minimal-prompt', numCharacters, messageLength: 'medium', iterations: 2 },
      { strategy: 'haiku-model', numCharacters, messageLength: 'medium', iterations: 2 },
    ];

    const results = await this.run(configs);
    this.printResults(results);
    return this.generateReport(results);
  }

  /**
   * Run animation-preserving benchmark (Phase 2)
   * Tests strategies that KEEP all animation features
   */
  async runAnimationBenchmark(numCharacters: number = 2): Promise<BenchmarkReport> {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     ANIMATION-PRESERVING BENCHMARK (Phase 2)               ║');
    console.log('║     All strategies maintain full animation support         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const configs: BenchmarkConfig[] = [
      { 
        strategy: 'baseline', 
        numCharacters, 
        messageLength: 'medium', 
        iterations: 3,
        warmupRuns: 1 
      },
      { 
        strategy: 'compact-prompt', 
        numCharacters, 
        messageLength: 'medium', 
        iterations: 3,
        warmupRuns: 1 
      },
      { 
        strategy: 'compact-json', 
        numCharacters, 
        messageLength: 'medium', 
        iterations: 3,
        warmupRuns: 1 
      },
    ];

    const results = await this.run(configs);
    this.printAnimationResults(results);
    return this.generateReport(results);
  }

  /**
   * Print animation benchmark results with additional context
   */
  printAnimationResults(results: BenchmarkResult[]): void {
    const report = this.generateReport(results);
    
    console.log('\n' + report.summary);
    
    // Add interpretation
    console.log('\n📊 INTERPRETATION:');
    console.log('─────────────────────────────────────────────────────────────');
    
    const baseline = results.find(r => r.config.strategy === 'baseline');
    if (baseline) {
      console.log(`  Baseline (current production): ${baseline.avgDurationMs.toFixed(0)}ms`);
      console.log(`  Prompt tokens: ~${baseline.tokenStats.avgPromptTokens.toFixed(0)}`);
    }
    
    for (const result of results) {
      if (result.config.strategy === 'baseline') continue;
      
      const improvement = baseline 
        ? ((baseline.avgDurationMs - result.avgDurationMs) / baseline.avgDurationMs * 100).toFixed(1)
        : '0';
      const tokenReduction = baseline
        ? ((baseline.tokenStats.avgPromptTokens - result.tokenStats.avgPromptTokens) / baseline.tokenStats.avgPromptTokens * 100).toFixed(0)
        : '0';
      
      console.log(`\n  ${result.config.strategy}:`);
      console.log(`    Time: ${result.avgDurationMs.toFixed(0)}ms (${improvement}% ${parseFloat(improvement) > 0 ? 'faster' : 'slower'})`);
      console.log(`    Tokens: ~${result.tokenStats.avgPromptTokens.toFixed(0)} (${tokenReduction}% reduction)`);
    }
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  All strategies preserve full animation support.');
    console.log('  For best results, combine with:');
    console.log('  - Streaming (perceived instant response)');
    console.log('  - Prompt caching (reduces repeated token processing)');
    console.log('═══════════════════════════════════════════════════════════════\n');
  }
}

// Singleton instance
let benchmarkInstance: BenchmarkRunner | null = null;

/**
 * Get the benchmark runner instance
 */
export function getBenchmarkRunner(): BenchmarkRunner {
  if (!benchmarkInstance) {
    benchmarkInstance = new BenchmarkRunner();
  }
  return benchmarkInstance;
}

/**
 * Quick benchmark helper (legacy)
 */
export async function runQuickBenchmark(numCharacters: number = 2): Promise<BenchmarkReport> {
  return getBenchmarkRunner().quickCompare(numCharacters);
}

/**
 * Animation-preserving benchmark (Phase 2)
 * Tests strategies that maintain full animation support
 */
export async function runAnimationBenchmark(numCharacters: number = 2): Promise<BenchmarkReport> {
  return getBenchmarkRunner().runAnimationBenchmark(numCharacters);
}

