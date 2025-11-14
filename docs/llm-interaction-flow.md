# LLM Interaction Flow - Complete Architecture

This document provides a detailed overview of how messages flow from the user interface to the LLM (Large Language Model) and back, including all intermediate processing steps, data transformations, and architectural components.

## Overview

The Wakatto application uses a secure, server-side proxy architecture to interact with AI providers (Anthropic Claude, OpenAI GPT). This ensures API keys remain secure and enables centralized rate limiting, logging, and error handling.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            USER INTERACTION LAYER                            │
│                     (React Native Components - Web/Mobile)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: User Input Capture                                                 │
│ File: src/components/ChatInterface.tsx                                      │
│                                                                              │
│ • User types message in TextInput                                           │
│ • Clicks send button or presses Enter                                       │
│ • handleSend() function is triggered                                        │
│                                                                              │
│ Code: Line ~300-320                                                          │
│ const handleSend = async () => {                                            │
│   if (!inputText.trim() || !conversationId) return;                        │
│   const userMessage = inputText.trim();                                     │
│   setInputText('');                                                          │
│   dispatch(addMessage(conversationId, 'user', userMessage));               │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Message Orchestration                                              │
│ File: src/navigation/MainTabs.tsx                                           │
│                                                                              │
│ • Listens for new user messages in Redux store                             │
│ • Triggers handleNewUserMessage() when detected                             │
│ • Manages multi-character conversation flow                                 │
│                                                                              │
│ Code: Line ~180-250                                                          │
│ const handleNewUserMessage = async (message: Message) => {                 │
│   const characterIds = selectedCharacters.map(c => c.id);                  │
│   for (const charId of characterIds) {                                     │
│     await generateAIResponse(message.text, charId);                        │
│   }                                                                          │
│ };                                                                           │
│                                                                              │
│ Data Structure:                                                              │
│ {                                                                            │
│   id: string,                                                               │
│   conversationId: string,                                                   │
│   sender: 'user',                                                           │
│   text: string,                                                             │
│   timestamp: number                                                          │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Redux Action Dispatch                                              │
│ File: src/store/actions/conversationActions.ts                              │
│                                                                              │
│ • saveMessage() action is dispatched                                        │
│ • Message saved to Redux store                                              │
│ • Message persisted to Supabase database                                    │
│                                                                              │
│ Code: Line ~150-200                                                          │
│ export const saveMessage = (                                                │
│   conversationId: string,                                                   │
│   sender: 'user' | 'ai',                                                    │
│   text: string,                                                             │
│   characterId?: string                                                      │
│ ): AppThunk => async (dispatch, getState) => {                             │
│   const messageId = uuidv4();                                               │
│   const message: Message = {                                                │
│     id: messageId,                                                          │
│     conversationId,                                                         │
│     sender,                                                                 │
│     text,                                                                   │
│     characterId,                                                            │
│     timestamp: Date.now(),                                                  │
│   };                                                                         │
│                                                                              │
│   dispatch({ type: 'ADD_MESSAGE', payload: message });                     │
│                                                                              │
│   // Save to Supabase                                                       │
│   await supabase.from('messages').insert({                                  │
│     id: messageId,                                                          │
│     conversation_id: conversationId,                                        │
│     sender,                                                                 │
│     text,                                                                   │
│     character_id: characterId,                                              │
│     timestamp: new Date(message.timestamp).toISOString(),                   │
│   });                                                                        │
│ };                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: AI Service Call Preparation                                        │
│ File: src/services/aiService.ts                                             │
│                                                                              │
│ • generateResponse() function called                                        │
│ • Retrieves character configuration from characters.ts                      │
│ • Builds conversation history from Redux store                              │
│ • Constructs system prompt with character personality                       │
│                                                                              │
│ Code: Line ~50-120                                                           │
│ export const generateResponse = async (                                     │
│   userMessage: string,                                                      │
│   characterId: string,                                                      │
│   conversationHistory: Message[]                                            │
│ ): Promise<string> => {                                                     │
│   const character = CHARACTERS.find(c => c.id === characterId);            │
│   if (!character) throw new Error('Character not found');                  │
│                                                                              │
│   // Build messages array for API                                           │
│   const messages = conversationHistory.map(msg => ({                        │
│     role: msg.sender === 'user' ? 'user' : 'assistant',                   │
│     content: msg.text                                                       │
│   }));                                                                       │
│                                                                              │
│   messages.push({                                                            │
│     role: 'user',                                                           │
│     content: userMessage                                                    │
│   });                                                                        │
│                                                                              │
│   // Call edge function                                                     │
│   const response = await callEdgeFunction({                                 │
│     provider: character.provider || 'anthropic',                           │
│     model: character.model || 'claude-3-haiku-20240307',                   │
│     systemPrompt: character.systemPrompt,                                   │
│     messages,                                                               │
│     temperature: character.temperature || 0.7,                              │
│   });                                                                        │
│                                                                              │
│   return response.text;                                                     │
│ };                                                                           │
│                                                                              │
│ Character Configuration (src/config/characters.ts):                          │
│ {                                                                            │
│   id: 'freud',                                                              │
│   name: 'Dr. Freud',                                                        │
│   provider: 'anthropic',                                                    │
│   model: 'claude-3-haiku-20240307',                                         │
│   systemPrompt: '...',  // Character-specific prompt                       │
│   temperature: 0.7,                                                          │
│   traits: { empathy: 8, directness: 6, formality: 7, humor: 5 }           │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Edge Function HTTP Request                                         │
│ File: src/lib/supabase.ts (supabase client)                                │
│                                                                              │
│ • POST request to Supabase Edge Function                                    │
│ • URL: https://[project-id].supabase.co/functions/v1/ai-chat              │
│ • Authentication: Bearer token from Supabase Auth                           │
│                                                                              │
│ HTTP Request:                                                                │
│ POST /functions/v1/ai-chat                                                  │
│ Headers:                                                                     │
│   Authorization: Bearer [JWT_TOKEN]                                         │
│   Content-Type: application/json                                            │
│   apikey: [SUPABASE_ANON_KEY]                                              │
│                                                                              │
│ Request Body:                                                                │
│ {                                                                            │
│   provider: "anthropic",                                                    │
│   model: "claude-3-haiku-20240307",                                         │
│   systemPrompt: "You are Dr. Freud...",                                    │
│   messages: [                                                               │
│     { role: "user", content: "Tell me about dreams" },                     │
│     { role: "assistant", content: "Dreams are..." },                       │
│     { role: "user", content: "What about nightmares?" }                    │
│   ],                                                                         │
│   temperature: 0.7,                                                          │
│   maxTokens: 2000                                                           │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE EDGE FUNCTION                            │
│                         (Deno Runtime - Server-Side)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: Request Validation & Authentication                                │
│ File: supabase/functions/ai-chat/index.ts                                  │
│                                                                              │
│ • Validates JWT token from Authorization header                             │
│ • Extracts user ID from token                                               │
│ • Validates request body structure                                          │
│ • Checks for required fields (provider, messages, etc.)                    │
│                                                                              │
│ Code: Line ~20-60                                                            │
│ Deno.serve(async (req) => {                                                 │
│   // CORS headers                                                           │
│   if (req.method === 'OPTIONS') {                                          │
│     return new Response(null, { headers: corsHeaders });                   │
│   }                                                                          │
│                                                                              │
│   try {                                                                      │
│     // Get JWT token                                                        │
│     const authHeader = req.headers.get('Authorization');                   │
│     if (!authHeader) {                                                      │
│       throw new Error('Missing authorization header');                     │
│     }                                                                        │
│                                                                              │
│     // Verify user                                                          │
│     const token = authHeader.replace('Bearer ', '');                       │
│     const supabaseClient = createClient(                                    │
│       Deno.env.get('SUPABASE_URL') ?? '',                                  │
│       Deno.env.get('SUPABASE_ANON_KEY') ?? '',                             │
│       { global: { headers: { Authorization: authHeader } } }               │
│     );                                                                       │
│                                                                              │
│     const { data: { user }, error: userError } =                           │
│       await supabaseClient.auth.getUser(token);                            │
│                                                                              │
│     if (userError || !user) {                                              │
│       throw new Error('Invalid user token');                               │
│     }                                                                        │
│                                                                              │
│     // Parse request body                                                   │
│     const body = await req.json();                                          │
│     const { provider, model, systemPrompt, messages, temperature } = body; │
│                                                                              │
│     // Validate required fields                                             │
│     if (!provider || !messages || !Array.isArray(messages)) {             │
│       throw new Error('Invalid request body');                             │
│     }                                                                        │
│                                                                              │
│     // Continue to API call...                                              │
│   } catch (error) {                                                         │
│     return new Response(                                                    │
│       JSON.stringify({ error: error.message }),                            │
│       { status: 400, headers: corsHeaders }                                │
│     );                                                                       │
│   }                                                                          │
│ });                                                                          │
│                                                                              │
│ Security Features:                                                           │
│ • JWT token validation                                                       │
│ • User authentication                                                        │
│ • Request body validation                                                    │
│ • CORS headers configured                                                    │
│ • API keys stored as environment secrets (never exposed to client)          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: Provider Selection & API Key Retrieval                            │
│ File: supabase/functions/ai-chat/index.ts                                  │
│                                                                              │
│ • Determines which AI provider to use (Anthropic or OpenAI)                │
│ • Retrieves API key from environment secrets                                │
│ • Sets up provider-specific configuration                                   │
│                                                                              │
│ Code: Line ~80-100                                                           │
│ let apiKey: string;                                                         │
│ let apiUrl: string;                                                         │
│                                                                              │
│ if (provider === 'anthropic') {                                             │
│   apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';                        │
│   apiUrl = 'https://api.anthropic.com/v1/messages';                        │
│ } else if (provider === 'openai') {                                         │
│   apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';                           │
│   apiUrl = 'https://api.openai.com/v1/chat/completions';                   │
│ } else {                                                                     │
│   throw new Error(`Unsupported provider: ${provider}`);                    │
│ }                                                                            │
│                                                                              │
│ if (!apiKey) {                                                              │
│   throw new Error(`API key not configured for provider: ${provider}`);    │
│ }                                                                            │
│                                                                              │
│ Environment Secrets (stored in Supabase):                                   │
│ • ANTHROPIC_API_KEY=sk-ant-...                                              │
│ • OPENAI_API_KEY=sk-...                                                     │
│ • Set via: supabase secrets set ANTHROPIC_API_KEY=value                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: API Request Construction                                           │
│ File: supabase/functions/ai-chat/index.ts                                  │
│                                                                              │
│ • Builds provider-specific API request                                      │
│ • Anthropic uses Messages API format                                        │
│ • OpenAI uses Chat Completions API format                                   │
│                                                                              │
│ Code: Line ~110-180                                                          │
│                                                                              │
│ // For Anthropic Claude                                                     │
│ if (provider === 'anthropic') {                                             │
│   const requestBody = {                                                     │
│     model: model || 'claude-3-haiku-20240307',                             │
│     max_tokens: maxTokens || 2000,                                          │
│     temperature: temperature || 0.7,                                         │
│     system: systemPrompt || '',                                             │
│     messages: messages.map(msg => ({                                        │
│       role: msg.role,                                                       │
│       content: msg.content                                                  │
│     }))                                                                      │
│   };                                                                         │
│                                                                              │
│   const response = await fetch(apiUrl, {                                    │
│     method: 'POST',                                                         │
│     headers: {                                                              │
│       'Content-Type': 'application/json',                                  │
│       'x-api-key': apiKey,                                                 │
│       'anthropic-version': '2023-06-01'                                    │
│     },                                                                       │
│     body: JSON.stringify(requestBody)                                       │
│   });                                                                        │
│ }                                                                            │
│                                                                              │
│ // For OpenAI GPT                                                            │
│ else if (provider === 'openai') {                                           │
│   const requestBody = {                                                     │
│     model: model || 'gpt-4',                                               │
│     temperature: temperature || 0.7,                                         │
│     max_tokens: maxTokens || 2000,                                          │
│     messages: [                                                             │
│       { role: 'system', content: systemPrompt || '' },                     │
│       ...messages                                                           │
│     ]                                                                        │
│   };                                                                         │
│                                                                              │
│   const response = await fetch(apiUrl, {                                    │
│     method: 'POST',                                                         │
│     headers: {                                                              │
│       'Content-Type': 'application/json',                                  │
│       'Authorization': `Bearer ${apiKey}`                                  │
│     },                                                                       │
│     body: JSON.stringify(requestBody)                                       │
│   });                                                                        │
│ }                                                                            │
│                                                                              │
│ Anthropic Request Format:                                                   │
│ {                                                                            │
│   model: "claude-3-haiku-20240307",                                         │
│   max_tokens: 2000,                                                         │
│   temperature: 0.7,                                                          │
│   system: "You are Dr. Freud, a psychoanalyst...",                         │
│   messages: [                                                               │
│     { role: "user", content: "..." },                                      │
│     { role: "assistant", content: "..." },                                 │
│     { role: "user", content: "..." }                                       │
│   ]                                                                          │
│ }                                                                            │
│                                                                              │
│ OpenAI Request Format:                                                      │
│ {                                                                            │
│   model: "gpt-4",                                                           │
│   temperature: 0.7,                                                          │
│   max_tokens: 2000,                                                         │
│   messages: [                                                               │
│     { role: "system", content: "You are Dr. Freud..." },                   │
│     { role: "user", content: "..." },                                      │
│     { role: "assistant", content: "..." },                                 │
│     { role: "user", content: "..." }                                       │
│   ]                                                                          │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL API CALL                                  │
│                     (Anthropic Claude / OpenAI GPT)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 9: LLM Processing                                                     │
│ External Service: Anthropic API or OpenAI API                               │
│                                                                              │
│ • LLM processes the conversation context                                    │
│ • Considers system prompt (character personality)                           │
│ • Reviews entire conversation history                                       │
│ • Generates contextually appropriate response                               │
│ • Applies temperature setting for creativity/consistency balance            │
│                                                                              │
│ Anthropic Claude Response Format:                                           │
│ {                                                                            │
│   id: "msg_01...",                                                          │
│   type: "message",                                                          │
│   role: "assistant",                                                        │
│   content: [                                                                │
│     {                                                                        │
│       type: "text",                                                         │
│       text: "Based on your description of dreams..."                       │
│     }                                                                        │
│   ],                                                                         │
│   model: "claude-3-haiku-20240307",                                         │
│   stop_reason: "end_turn",                                                  │
│   usage: {                                                                  │
│     input_tokens: 245,                                                      │
│     output_tokens: 128                                                      │
│   }                                                                          │
│ }                                                                            │
│                                                                              │
│ OpenAI GPT Response Format:                                                 │
│ {                                                                            │
│   id: "chatcmpl-...",                                                       │
│   object: "chat.completion",                                                │
│   created: 1677858242,                                                      │
│   model: "gpt-4",                                                           │
│   choices: [                                                                │
│     {                                                                        │
│       index: 0,                                                             │
│       message: {                                                            │
│         role: "assistant",                                                  │
│         content: "Based on your description of dreams..."                  │
│       },                                                                     │
│       finish_reason: "stop"                                                 │
│     }                                                                        │
│   ],                                                                         │
│   usage: {                                                                  │
│     prompt_tokens: 245,                                                     │
│     completion_tokens: 128,                                                 │
│     total_tokens: 373                                                       │
│   }                                                                          │
│ }                                                                            │
│                                                                              │
│ Processing Time: Typically 1-5 seconds depending on:                        │
│ • Model size (Haiku < Sonnet < Opus / GPT-3.5 < GPT-4)                    │
│ • Response length                                                           │
│ • API load                                                                  │
│ • Network latency                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 10: Response Parsing & Error Handling                                │
│ File: supabase/functions/ai-chat/index.ts                                  │
│                                                                              │
│ • Receives HTTP response from AI provider                                   │
│ • Checks for HTTP errors (4xx, 5xx)                                        │
│ • Parses JSON response                                                      │
│ • Extracts text content from response                                       │
│ • Handles provider-specific response formats                                │
│                                                                              │
│ Code: Line ~190-250                                                          │
│ const apiResponse = await fetch(apiUrl, fetchOptions);                      │
│                                                                              │
│ if (!apiResponse.ok) {                                                      │
│   const errorText = await apiResponse.text();                              │
│   console.error('API Error:', errorText);                                  │
│   throw new Error(                                                          │
│     `AI API error (${apiResponse.status}): ${errorText}`                  │
│   );                                                                         │
│ }                                                                            │
│                                                                              │
│ const data = await apiResponse.json();                                      │
│                                                                              │
│ let responseText: string;                                                   │
│                                                                              │
│ // Extract text from Anthropic response                                     │
│ if (provider === 'anthropic') {                                             │
│   responseText = data.content?.[0]?.text || '';                            │
│   if (!responseText) {                                                      │
│     throw new Error('No text content in Anthropic response');              │
│   }                                                                          │
│ }                                                                            │
│                                                                              │
│ // Extract text from OpenAI response                                        │
│ else if (provider === 'openai') {                                           │
│   responseText = data.choices?.[0]?.message?.content || '';                │
│   if (!responseText) {                                                      │
│     throw new Error('No text content in OpenAI response');                 │
│   }                                                                          │
│ }                                                                            │
│                                                                              │
│ // Log usage for monitoring                                                 │
│ console.log('AI Response generated:', {                                     │
│   userId: user.id,                                                          │
│   provider,                                                                 │
│   model,                                                                    │
│   inputTokens: data.usage?.input_tokens || data.usage?.prompt_tokens,     │
│   outputTokens: data.usage?.output_tokens || data.usage?.completion_tokens,│
│   timestamp: new Date().toISOString()                                       │
│ });                                                                          │
│                                                                              │
│ Common Error Scenarios:                                                     │
│ • 401: Invalid API key                                                      │
│ • 429: Rate limit exceeded                                                  │
│ • 500: AI provider server error                                             │
│ • Network timeout                                                           │
│ • Invalid request format                                                    │
│ • Token limit exceeded                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 11: Edge Function Response                                            │
│ File: supabase/functions/ai-chat/index.ts                                  │
│                                                                              │
│ • Constructs successful response object                                     │
│ • Returns JSON with AI-generated text                                       │
│ • Includes CORS headers for browser access                                  │
│                                                                              │
│ Code: Line ~260-280                                                          │
│ return new Response(                                                        │
│   JSON.stringify({                                                          │
│     success: true,                                                          │
│     text: responseText,                                                     │
│     provider,                                                               │
│     model,                                                                  │
│     usage: {                                                                │
│       inputTokens: data.usage?.input_tokens ||                             │
│                    data.usage?.prompt_tokens || 0,                         │
│       outputTokens: data.usage?.output_tokens ||                           │
│                     data.usage?.completion_tokens || 0                     │
│     }                                                                        │
│   }),                                                                        │
│   {                                                                          │
│     status: 200,                                                            │
│     headers: {                                                              │
│       ...corsHeaders,                                                       │
│       'Content-Type': 'application/json'                                   │
│     }                                                                        │
│   }                                                                          │
│ );                                                                           │
│                                                                              │
│ Response Body:                                                               │
│ {                                                                            │
│   success: true,                                                            │
│   text: "Based on your description of dreams, I believe...",               │
│   provider: "anthropic",                                                    │
│   model: "claude-3-haiku-20240307",                                         │
│   usage: {                                                                  │
│     inputTokens: 245,                                                       │
│     outputTokens: 128                                                       │
│   }                                                                          │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESPONSE PROCESSING LAYER                            │
│                              (Client-Side)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 12: AI Service Response Handling                                      │
│ File: src/services/aiService.ts                                             │
│                                                                              │
│ • Receives HTTP response from Edge Function                                 │
│ • Parses JSON response                                                      │
│ • Extracts text content                                                     │
│ • Returns text to caller                                                    │
│                                                                              │
│ Code: Line ~130-160                                                          │
│ const callEdgeFunction = async (params) => {                               │
│   const { data: { session } } = await supabase.auth.getSession();         │
│                                                                              │
│   if (!session) {                                                           │
│     throw new Error('No active session');                                  │
│   }                                                                          │
│                                                                              │
│   const response = await fetch(                                             │
│     `${supabaseUrl}/functions/v1/ai-chat`,                                 │
│     {                                                                        │
│       method: 'POST',                                                       │
│       headers: {                                                            │
│         'Content-Type': 'application/json',                                │
│         'Authorization': `Bearer ${session.access_token}`,                │
│         'apikey': supabaseAnonKey                                          │
│       },                                                                     │
│       body: JSON.stringify(params)                                          │
│     }                                                                        │
│   );                                                                         │
│                                                                              │
│   if (!response.ok) {                                                       │
│     const error = await response.text();                                   │
│     throw new Error(`Edge function error: ${error}`);                      │
│   }                                                                          │
│                                                                              │
│   const data = await response.json();                                       │
│                                                                              │
│   if (!data.success || !data.text) {                                       │
│     throw new Error('Invalid response from edge function');                │
│   }                                                                          │
│                                                                              │
│   return data;  // { success: true, text: "...", provider, model, usage } │
│ };                                                                           │
│                                                                              │
│ export const generateResponse = async (...) => {                            │
│   // ... (earlier code)                                                     │
│   const response = await callEdgeFunction({...});                           │
│   return response.text;  // Returns just the text string                   │
│ };                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 13: Redux State Update                                                │
│ File: src/navigation/MainTabs.tsx                                           │
│                                                                              │
│ • Receives AI response text from aiService                                  │
│ • Dispatches Redux action to save AI message                                │
│ • Message added to Redux store                                              │
│ • Message persisted to Supabase database                                    │
│                                                                              │
│ Code: Line ~230-260                                                          │
│ const generateAIResponse = async (                                          │
│   userMessage: string,                                                      │
│   characterId: string                                                       │
│ ) => {                                                                       │
│   try {                                                                      │
│     setIsLoading(true);                                                     │
│                                                                              │
│     // Get conversation history from Redux                                  │
│     const state = store.getState();                                         │
│     const conversation = state.conversations.conversations                  │
│       .find(c => c.id === activeConversationId);                           │
│     const history = conversation?.messages || [];                           │
│                                                                              │
│     // Generate AI response                                                 │
│     const responseText = await generateResponse(                            │
│       userMessage,                                                          │
│       characterId,                                                          │
│       history                                                               │
│     );                                                                       │
│                                                                              │
│     // Save AI message to store and database                                │
│     dispatch(saveMessage(                                                   │
│       activeConversationId,                                                 │
│       'ai',                                                                 │
│       responseText,                                                         │
│       characterId                                                           │
│     ));                                                                      │
│                                                                              │
│     setIsLoading(false);                                                    │
│   } catch (error) {                                                         │
│     console.error('Error generating AI response:', error);                 │
│     setIsLoading(false);                                                    │
│     // Show error alert to user                                             │
│     Alert.alert('Error', 'Failed to generate AI response');                │
│   }                                                                          │
│ };                                                                           │
│                                                                              │
│ Redux State Structure:                                                      │
│ {                                                                            │
│   conversations: {                                                          │
│     conversations: [                                                        │
│       {                                                                      │
│         id: "conv-123",                                                     │
│         title: "Dream Analysis",                                           │
│         messages: [                                                         │
│           {                                                                  │
│             id: "msg-1",                                                    │
│             sender: "user",                                                 │
│             text: "Tell me about dreams",                                  │
│             timestamp: 1699123456789                                        │
│           },                                                                │
│           {                                                                  │
│             id: "msg-2",                                                    │
│             sender: "ai",                                                   │
│             text: "Dreams are...",                                         │
│             characterId: "freud",                                          │
│             timestamp: 1699123460123                                        │
│           }                                                                 │
│         ],                                                                  │
│         createdAt: 1699123456789                                            │
│       }                                                                      │
│     ],                                                                      │
│     activeConversationId: "conv-123"                                        │
│   }                                                                          │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 14: Database Persistence                                              │
│ Supabase PostgreSQL Database                                                │
│                                                                              │
│ • AI message inserted into 'messages' table                                 │
│ • Linked to conversation and character                                      │
│ • Available for future conversation history retrieval                       │
│                                                                              │
│ Database Schema:                                                             │
│                                                                              │
│ Table: messages                                                              │
│ ┌──────────────────┬─────────────┬─────────────────────────────────────┐  │
│ │ Column           │ Type        │ Description                         │  │
│ ├──────────────────┼─────────────┼─────────────────────────────────────┤  │
│ │ id               │ UUID        │ Primary key                         │  │
│ │ conversation_id  │ UUID        │ Foreign key to conversations        │  │
│ │ sender           │ TEXT        │ 'user' or 'ai'                      │  │
│ │ text             │ TEXT        │ Message content                     │  │
│ │ character_id     │ TEXT        │ Character ID (for AI messages)      │  │
│ │ timestamp        │ TIMESTAMPTZ │ Message creation time               │  │
│ │ user_id          │ UUID        │ Foreign key to auth.users           │  │
│ │ created_at       │ TIMESTAMPTZ │ Record creation time                │  │
│ └──────────────────┴─────────────┴─────────────────────────────────────┘  │
│                                                                              │
│ Table: conversations                                                         │
│ ┌──────────────────┬─────────────┬─────────────────────────────────────┐  │
│ │ Column           │ Type        │ Description                         │  │
│ ├──────────────────┼─────────────┼─────────────────────────────────────┤  │
│ │ id               │ UUID        │ Primary key                         │  │
│ │ user_id          │ UUID        │ Foreign key to auth.users           │  │
│ │ title            │ TEXT        │ Conversation title                  │  │
│ │ created_at       │ TIMESTAMPTZ │ Creation time                       │  │
│ │ updated_at       │ TIMESTAMPTZ │ Last update time                    │  │
│ └──────────────────┴─────────────┴─────────────────────────────────────┘  │
│                                                                              │
│ Example Insert:                                                              │
│ INSERT INTO messages (                                                      │
│   id,                                                                        │
│   conversation_id,                                                          │
│   sender,                                                                    │
│   text,                                                                      │
│   character_id,                                                             │
│   timestamp,                                                                │
│   user_id                                                                   │
│ ) VALUES (                                                                  │
│   'msg-uuid-456',                                                           │
│   'conv-uuid-123',                                                          │
│   'ai',                                                                     │
│   'Based on your description of dreams...',                                │
│   'freud',                                                                  │
│   '2024-11-06T12:34:56.789Z',                                              │
│   'user-uuid-789'                                                           │
│ );                                                                           │
│                                                                              │
│ Indexes:                                                                     │
│ • messages_conversation_id_idx (for fast conversation retrieval)            │
│ • messages_user_id_idx (for user-specific queries)                          │
│ • messages_timestamp_idx (for chronological ordering)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 15: UI State Update                                                   │
│ File: src/store/reducers/conversationReducer.ts                             │
│                                                                              │
│ • Redux reducer processes ADD_MESSAGE action                                │
│ • New AI message added to conversation in store                             │
│ • React components subscribed to store receive update                       │
│                                                                              │
│ Code: Line ~80-120                                                           │
│ const conversationReducer = (                                               │
│   state = initialState,                                                     │
│   action: ConversationAction                                                │
│ ): ConversationState => {                                                   │
│   switch (action.type) {                                                    │
│     case 'ADD_MESSAGE': {                                                   │
│       const { payload: message } = action;                                  │
│       return {                                                              │
│         ...state,                                                           │
│         conversations: state.conversations.map(conv => {                    │
│           if (conv.id === message.conversationId) {                        │
│             return {                                                        │
│               ...conv,                                                      │
│               messages: [...conv.messages, message],                       │
│               updatedAt: Date.now()                                         │
│             };                                                              │
│           }                                                                 │
│           return conv;                                                      │
│         })                                                                  │
│       };                                                                    │
│     }                                                                        │
│     // ... other cases                                                      │
│   }                                                                          │
│ };                                                                           │
│                                                                              │
│ State Update Flow:                                                          │
│ 1. Action dispatched: { type: 'ADD_MESSAGE', payload: message }            │
│ 2. Reducer creates new state object with message added                      │
│ 3. Redux store notifies all subscribers of state change                     │
│ 4. React components using useSelector() re-render                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 16: UI Rendering                                                      │
│ File: src/components/ChatInterface.tsx                                      │
│                                                                              │
│ • Component receives new message from Redux store                           │
│ • FlatList re-renders with updated messages array                           │
│ • New AI message bubble appears in chat                                     │
│ • Loading indicator disappears                                              │
│ • Character animation triggered (if enabled)                                │
│                                                                              │
│ Code: Line ~350-450                                                          │
│ const ChatInterface = ({ conversationId }: Props) => {                     │
│   // Subscribe to messages from Redux                                       │
│   const messages = useSelector((state: RootState) =>                       │
│     state.conversations.conversations                                       │
│       .find(c => c.id === conversationId)?.messages || []                  │
│   );                                                                         │
│                                                                              │
│   const [isLoading, setIsLoading] = useState(false);                       │
│                                                                              │
│   return (                                                                  │
│     <View style={styles.container}>                                         │
│       {/* Character Display */}                                             │
│       <View style={{ height: characterHeight }}>                           │
│         <CharacterDisplay3D                                                 │
│           characters={selectedCharacters}                                   │
│           animation={isLoading ? 'thinking' : 'idle'}                      │
│         />                                                                   │
│       </View>                                                               │
│                                                                              │
│       {/* Message List */}                                                  │
│       <FlatList                                                             │
│         data={messages}                                                     │
│         keyExtractor={(item) => item.id}                                    │
│         renderItem={({ item }) => (                                         │
│           <View style={[                                                    │
│             styles.messageBubble,                                           │
│             item.sender === 'user'                                          │
│               ? styles.userBubble                                           │
│               : styles.aiBubble                                             │
│           ]}>                                                               │
│             {item.sender === 'ai' && (                                     │
│               <Text style={styles.characterName}>                          │
│                 {getCharacterName(item.characterId)}                       │
│               </Text>                                                       │
│             )}                                                              │
│             <Text style={styles.messageText}>                              │
│               {item.text}                                                   │
│             </Text>                                                          │
│           </View>                                                           │
│         )}                                                                  │
│         onContentSizeChange={() => flatListRef.current?.scrollToEnd()}    │
│         ref={flatListRef}                                                   │
│       />                                                                     │
│                                                                              │
│       {/* Loading Indicator */}                                             │
│       {isLoading && (                                                       │
│         <View style={styles.loadingContainer}>                             │
│           <ActivityIndicator size="small" color="#8b5cf6" />              │
│           <Text style={styles.loadingText}>Thinking...</Text>              │
│         </View>                                                             │
│       )}                                                                     │
│                                                                              │
│       {/* Input Area */}                                                    │
│       <View style={styles.inputContainer}>                                 │
│         <TextInput                                                          │
│           value={inputText}                                                 │
│           onChangeText={setInputText}                                       │
│           placeholder="Type a message..."                                  │
│           style={styles.input}                                              │
│         />                                                                   │
│         <TouchableOpacity onPress={handleSend}>                            │
│           <Text style={styles.sendButton}>Send</Text>                      │
│         </TouchableOpacity>                                                 │
│       </View>                                                               │
│     </View>                                                                 │
│   );                                                                         │
│ };                                                                           │
│                                                                              │
│ Visual Update:                                                              │
│ • AI message bubble slides in from left                                     │
│ • Character name displayed above message (18px Arimo font)                  │
│ • Message text rendered in 16px Arimo font                                  │
│ • Character animation changes from 'thinking' to 'talking'                  │
│ • Character name label fades in above 3D character                          │
│ • Scroll view auto-scrolls to show new message                              │
└─────────────────────────────────────────────────────────────────────────────┘

```

## Performance Optimizations

### 1. Client-Side Optimizations
- **Redux Memoization**: Using `reselect` for efficient state selection
- **React.memo**: Preventing unnecessary re-renders of message components
- **FlatList Optimization**: Virtualized list rendering for long conversations
- **useCallback**: Memoizing event handlers to prevent re-creation

### 2. Server-Side Optimizations
- **Edge Function Location**: Deployed close to users for low latency
- **Streaming Responses**: (Future) Support for streaming AI responses
- **Caching**: (Future) Cache common responses or conversation patterns
- **Connection Pooling**: Reusing HTTP connections to AI APIs

### 3. Database Optimizations
- **Indexed Queries**: Fast lookups by conversation_id and user_id
- **Batch Inserts**: (Future) Grouping multiple message inserts
- **Connection Pooling**: Supabase manages database connections efficiently

## Security Architecture

### 1. Authentication
- **JWT Tokens**: Supabase Auth generates signed JWT tokens
- **Token Verification**: Edge function validates token on every request
- **Session Management**: Tokens expire after 1 hour, refresh tokens handle renewal

### 2. Authorization
- **Row Level Security (RLS)**: Database policies ensure users can only access their own data
- **User Isolation**: All queries filtered by authenticated user_id
- **API Key Protection**: API keys never exposed to client, stored as environment secrets

### 3. Data Protection
- **HTTPS Only**: All communication encrypted in transit
- **Secret Management**: API keys stored in Supabase secure vault
- **Input Validation**: Request body validated before processing
- **SQL Injection Prevention**: Supabase client uses parameterized queries

### 4. Rate Limiting (Future)
- **User-Based Limits**: Track API usage per user
- **IP-Based Limits**: Prevent abuse from specific IPs
- **Cost Management**: Monitor token usage to control expenses

## Error Handling

### Client-Side Errors
1. **Network Errors**: Display "Connection failed" message, allow retry
2. **Timeout Errors**: Show "Request timed out" message
3. **Authentication Errors**: Redirect to login screen
4. **Validation Errors**: Display inline validation messages

### Server-Side Errors
1. **Invalid API Key**: Log error, return 500 to client
2. **Rate Limit Exceeded**: Return 429 status, include retry-after header
3. **AI API Errors**: Log error details, return generic error to client
4. **Database Errors**: Log error, rollback transaction, return 500

### Monitoring & Logging
- **Console Logging**: Edge function logs all requests and errors
- **Supabase Logs**: Available in dashboard for debugging
- **Error Tracking**: (Future) Integration with Sentry or similar service

## Data Flow Summary

```
User Input (ChatInterface.tsx)
  → handleSend()
  → dispatch(addMessage()) (conversationActions.ts)
  → Redux Store Update (conversationReducer.ts)
  → Supabase Insert (messages table)
  → generateAIResponse() (MainTabs.tsx)
  → generateResponse() (aiService.ts)
  → HTTP POST to Edge Function (supabase/functions/ai-chat/index.ts)
  → Validate JWT & Request Body
  → Retrieve API Key from Secrets
  → Build Provider-Specific Request
  → HTTP POST to AI API (Anthropic/OpenAI)
  → AI Processing & Response
  → Parse API Response
  → Return JSON to Client
  → Extract Response Text (aiService.ts)
  → dispatch(saveMessage()) (conversationActions.ts)
  → Redux Store Update (conversationReducer.ts)
  → Supabase Insert (messages table)
  → FlatList Re-render (ChatInterface.tsx)
  → User Sees AI Response
```

## Key Files Reference

| File | Purpose | Lines of Code |
|------|---------|---------------|
| `src/components/ChatInterface.tsx` | Main chat UI component | ~650 |
| `src/components/CharacterDisplay3D.tsx` | 3D character rendering | ~400 |
| `src/navigation/MainTabs.tsx` | Message orchestration | ~350 |
| `src/store/actions/conversationActions.ts` | Redux actions | ~250 |
| `src/store/reducers/conversationReducer.ts` | Redux state management | ~200 |
| `src/services/aiService.ts` | AI API communication | ~180 |
| `supabase/functions/ai-chat/index.ts` | Edge function (proxy) | ~300 |
| `src/config/characters.ts` | Character configurations | ~150 |

## Technology Stack

- **Frontend**: React Native, React Native for Web, TypeScript
- **State Management**: Redux, Redux Thunk
- **3D Graphics**: React Three Fiber, Three.js
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Providers**: Anthropic Claude, OpenAI GPT
- **Runtime**: Deno (Edge Functions)
- **Deployment**: Supabase Platform, Vercel (Web Hosting)

## Future Enhancements

1. **Streaming Responses**: Display AI response as it's generated
2. **Message Editing**: Allow users to edit sent messages
3. **Message Reactions**: Add emoji reactions to messages
4. **Voice Input**: Speech-to-text for message input
5. **Voice Output**: Text-to-speech for AI responses
6. **Message Search**: Full-text search across conversations
7. **Export Conversations**: Download conversations as PDF/JSON
8. **Multi-Modal Input**: Support image and file uploads
9. **Character Voice Profiles**: Different TTS voices per character
10. **Advanced Analytics**: Track conversation metrics and insights
