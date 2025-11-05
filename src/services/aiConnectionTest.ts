/**
 * AI Connection Test Utility
 * 
 * Tests connectivity and functionality of AI providers
 * Run this before implementing knowledge graph features
 */

import { configureAI, generateAIResponse, getAIConfig } from './aiService';

/**
 * Strip markdown code blocks from AI response
 * Handles: ```json ... ```, ``` ... ```, or plain JSON
 */
function stripMarkdownCodeBlocks(text: string): string {
  // Remove ```json ... ``` or ``` ... ```
  return text
    .replace(/^```(?:json)?\s*\n?/gm, '')  // Remove opening ```json or ```
    .replace(/\n?```\s*$/gm, '')           // Remove closing ```
    .trim();
}

export interface TestResult {
  success: boolean;
  provider: string;
  responseTime: number;
  error?: string;
  sampleResponse?: string;
}

/**
 * Test OpenAI connectivity
 */
export async function testOpenAI(apiKey: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const currentConfig = getAIConfig();
    console.log('[Test] Testing OpenAI with current config:', {
      keyPrefix: apiKey.substring(0, 7) + '...',
      model: currentConfig.model || 'default'
    });

    // Simple test prompt
    const response = await generateAIResponse([
      { role: 'user', content: 'Say "Hello" if you can hear me.' }
    ]);

    console.log('[Test] OpenAI response received:', response);

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      provider: 'openai',
      responseTime,
      sampleResponse: response,
    };
  } catch (error: any) {
    console.error('[Test] OpenAI test failed:', error);
    return {
      success: false,
      provider: 'openai',
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test Anthropic Claude connectivity
 */
export async function testAnthropic(apiKey: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const currentConfig = getAIConfig();
    console.log('[Test] Testing Anthropic with current config:', {
      keyPrefix: apiKey.substring(0, 7) + '...',
      model: currentConfig.model || 'default'
    });

    const response = await generateAIResponse([
      { role: 'user', content: 'Say "Hello" if you can hear me.' }
    ]);

    console.log('[Test] Anthropic response received:', response);

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      provider: 'anthropic',
      responseTime,
      sampleResponse: response,
    };
  } catch (error: any) {
    console.error('[Test] Anthropic test failed:', error);
    return {
      success: false,
      provider: 'anthropic',
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test Google Gemini connectivity
 */
export async function testGemini(apiKey: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const currentConfig = getAIConfig();
    console.log('[Test] Testing Gemini with current config:', {
      keyPrefix: apiKey.substring(0, 10) + '...',
      model: currentConfig.model || 'default'
    });

    const response = await generateAIResponse([
      { role: 'user', content: 'Say "Hello" if you can hear me.' }
    ]);

    console.log('[Test] Gemini response received:', response);

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      provider: 'gemini',
      responseTime,
      sampleResponse: response,
    };
  } catch (error: any) {
    console.error('[Test] Gemini test failed:', error);
    return {
      success: false,
      provider: 'gemini',
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test entity extraction (for knowledge graph)
 */
export async function testEntityExtraction(apiKey: string, provider: 'openai' | 'anthropic' | 'gemini' = 'openai'): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Use already-configured settings from Settings screen
    const currentConfig = getAIConfig();
    console.log('[Test] Entity extraction using config:', { provider: currentConfig.provider, model: currentConfig.model });

    const testEntry = "I had coffee with Sarah at Starbucks today. She told me about her new job at Google.";

    const extractionPrompt = `Extract entities and relationships from this diary entry. Return ONLY valid JSON.

Entry: "${testEntry}"

Return format:
{
  "entities": [{"name": "string", "type": "person|place|organization"}],
  "relationships": [{"from": "string", "to": "string", "type": "string"}]
}`;

    const response = await generateAIResponse([
      { role: 'system', content: 'You are a data extraction assistant. Return only valid JSON.' },
      { role: 'user', content: extractionPrompt }
    ]);

    const responseTime = Date.now() - startTime;

    // Strip markdown code blocks if present
    const cleanedResponse = stripMarkdownCodeBlocks(response);

    // Try to parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (e) {
      throw new Error('AI did not return valid JSON: ' + cleanedResponse);
    }

    // Validate structure
    if (!parsed.entities || !Array.isArray(parsed.entities)) {
      throw new Error('Invalid entities structure');
    }

    return {
      success: true,
      provider,
      responseTime,
      sampleResponse: JSON.stringify(parsed, null, 2),
    };
  } catch (error: any) {
    return {
      success: false,
      provider,
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test emotion detection (for knowledge graph)
 */
export async function testEmotionDetection(apiKey: string, provider: 'openai' | 'anthropic' | 'gemini' = 'openai'): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Use already-configured settings from Settings screen
    const currentConfig = getAIConfig();
    console.log('[Test] Emotion detection using config:', { provider: currentConfig.provider, model: currentConfig.model });

    const testEntry = "I'm having dreams of my ex and I wonder if I would ever have a beautiful girlfriend like her.";

    const emotionPrompt = `Analyze emotions in this diary entry. Return ONLY valid JSON.

Entry: "${testEntry}"

Return format:
{
  "emotions": [{"type": "string", "intensity": 1-10, "target": "string"}],
  "themes": ["string"]
}`;

    const response = await generateAIResponse([
      { role: 'system', content: 'You are an emotion analysis assistant. Return only valid JSON.' },
      { role: 'user', content: emotionPrompt }
    ]);

    const responseTime = Date.now() - startTime;

    // Strip markdown code blocks if present
    const cleanedResponse = stripMarkdownCodeBlocks(response);

    // Try to parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (e) {
      throw new Error('AI did not return valid JSON: ' + cleanedResponse);
    }

    // Validate structure
    if (!parsed.emotions || !Array.isArray(parsed.emotions)) {
      throw new Error('Invalid emotions structure');
    }

    return {
      success: true,
      provider,
      responseTime,
      sampleResponse: JSON.stringify(parsed, null, 2),
    };
  } catch (error: any) {
    return {
      success: false,
      provider,
      responseTime: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Run comprehensive AI tests
 */
export async function runAllTests(apiKey: string, provider: 'openai' | 'anthropic' | 'gemini' = 'openai') {
  console.log(`🧪 Testing ${provider.toUpperCase()} connection...`);
  
  const results = {
    basicConnection: await (provider === 'openai' ? testOpenAI(apiKey) : provider === 'anthropic' ? testAnthropic(apiKey) : testGemini(apiKey)),
    entityExtraction: await testEntityExtraction(apiKey, provider),
    emotionDetection: await testEmotionDetection(apiKey, provider),
  };

  console.log('\n📊 Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log(`\n✓ Basic Connection:`);
  console.log(`  Success: ${results.basicConnection.success ? '✅' : '❌'}`);
  console.log(`  Time: ${results.basicConnection.responseTime}ms`);
  if (results.basicConnection.error) {
    console.log(`  Error: ${results.basicConnection.error}`);
  }
  
  console.log(`\n✓ Entity Extraction:`);
  console.log(`  Success: ${results.entityExtraction.success ? '✅' : '❌'}`);
  console.log(`  Time: ${results.entityExtraction.responseTime}ms`);
  if (results.entityExtraction.sampleResponse) {
    console.log(`  Sample:\n${results.entityExtraction.sampleResponse}`);
  }
  if (results.entityExtraction.error) {
    console.log(`  Error: ${results.entityExtraction.error}`);
  }
  
  console.log(`\n✓ Emotion Detection:`);
  console.log(`  Success: ${results.emotionDetection.success ? '✅' : '❌'}`);
  console.log(`  Time: ${results.emotionDetection.responseTime}ms`);
  if (results.emotionDetection.sampleResponse) {
    console.log(`  Sample:\n${results.emotionDetection.sampleResponse}`);
  }
  if (results.emotionDetection.error) {
    console.log(`  Error: ${results.emotionDetection.error}`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const allPassed = results.basicConnection.success && results.entityExtraction.success && results.emotionDetection.success;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! AI is ready for knowledge graph.');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.');
  }
  
  return {
    allPassed,
    results,
  };
}

