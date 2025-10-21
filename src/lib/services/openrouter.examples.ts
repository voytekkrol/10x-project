/**
 * OpenRouter Service Usage Examples
 * 
 * This file contains practical examples of using the OpenRouter service
 * for various use cases. These are examples only - not meant to be imported.
 */

import { OpenRouterService } from './openrouter.service';
import type { ResponseFormat } from '../types/openrouter.types';

// =============================================================================
// Example 1: Simple Text Generation
// =============================================================================

async function example1_SimpleTextGeneration() {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-3.5-turbo',
  });

  const response = await openRouter.createChatCompletion({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain what TypeScript is in 2-3 sentences.' },
    ],
    temperature: 0.7,
    maxTokens: 150,
  });

  console.log(response.content);
  console.log(`Model: ${response.model}, Duration: ${response.durationMs}ms`);
}

// =============================================================================
// Example 2: Flashcard Generation with Structured Output
// =============================================================================

interface FlashcardOutput {
  flashcards: Array<{
    front: string;
    back: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

async function example2_FlashcardGeneration(sourceText: string) {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-4-turbo',
  });

  const schema: ResponseFormat = {
    type: 'json_schema',
    json_schema: {
      name: 'flashcard_generation',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: { type: 'string' },
                back: { type: 'string' },
                difficulty: {
                  type: 'string',
                  enum: ['easy', 'medium', 'hard'],
                },
              },
              required: ['front', 'back', 'difficulty'],
              additionalProperties: false,
            },
          },
        },
        required: ['flashcards'],
        additionalProperties: false,
      },
    },
  };

  const response = await openRouter.createChatCompletion<FlashcardOutput>({
    messages: [
      {
        role: 'system',
        content: `Create educational flashcards from the provided text. 
Generate 5 flashcards with varying difficulty levels.`,
      },
      { role: 'user', content: sourceText },
    ],
    temperature: 0.7,
    maxTokens: 2000,
    responseFormat: schema,
  });

  return response.content.flashcards;
}

// =============================================================================
// Example 3: Quiz Generation with Multiple Choice
// =============================================================================

interface QuizOutput {
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

async function example3_QuizGeneration(topic: string) {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-4-turbo',
  });

  const schema: ResponseFormat = {
    type: 'json_schema',
    json_schema: {
      name: 'quiz_generation',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 4,
                  maxItems: 4,
                },
                correctIndex: {
                  type: 'number',
                  minimum: 0,
                  maximum: 3,
                },
                explanation: { type: 'string' },
              },
              required: ['question', 'options', 'correctIndex', 'explanation'],
              additionalProperties: false,
            },
          },
        },
        required: ['questions'],
        additionalProperties: false,
      },
    },
  };

  const response = await openRouter.createChatCompletion<QuizOutput>({
    messages: [
      {
        role: 'system',
        content: 'Create multiple choice quiz questions. Each question should have 4 options.',
      },
      { role: 'user', content: `Create 3 quiz questions about: ${topic}` },
    ],
    responseFormat: schema,
  });

  return response.content.questions;
}

// =============================================================================
// Example 4: Text Summarization
// =============================================================================

interface SummaryOutput {
  summary: string;
  keyPoints: string[];
  wordCount: number;
}

async function example4_TextSummarization(text: string, maxWords: number = 100) {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-4-turbo',
  });

  const schema: ResponseFormat = {
    type: 'json_schema',
    json_schema: {
      name: 'text_summary',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          keyPoints: {
            type: 'array',
            items: { type: 'string' },
          },
          wordCount: { type: 'number' },
        },
        required: ['summary', 'keyPoints', 'wordCount'],
        additionalProperties: false,
      },
    },
  };

  const response = await openRouter.createChatCompletion<SummaryOutput>({
    messages: [
      {
        role: 'system',
        content: `Summarize the provided text in ${maxWords} words or less. 
Also extract 3-5 key points.`,
      },
      { role: 'user', content: text },
    ],
    temperature: 0.5,
    maxTokens: 1000,
    responseFormat: schema,
  });

  return response.content;
}

// =============================================================================
// Example 5: Content Enhancement/Rewriting
// =============================================================================

async function example5_ContentEnhancement(originalText: string) {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-4-turbo',
  });

  const response = await openRouter.createChatCompletion({
    messages: [
      {
        role: 'system',
        content: `You are an expert editor. Improve the provided text by:
1. Fixing grammar and spelling
2. Enhancing clarity and readability
3. Maintaining the original meaning
4. Using more precise vocabulary`,
      },
      { role: 'user', content: originalText },
    ],
    temperature: 0.3, // Lower temperature for more consistent output
    maxTokens: 1500,
  });

  return response.content;
}

// =============================================================================
// Example 6: Error Handling with Retry Logic
// =============================================================================

async function example6_ErrorHandlingWithRetry() {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-3.5-turbo',
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
  });

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const response = await openRouter.createChatCompletion({
        messages: [
          { role: 'user', content: 'Hello!' },
        ],
      });

      console.log('Success:', response.content);
      return response;

    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt >= maxAttempts) {
        console.error('Max attempts reached. Giving up.');
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// =============================================================================
// Example 7: Batch Processing with Rate Limiting
// =============================================================================

async function example7_BatchProcessing(texts: string[]) {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-3.5-turbo',
  });

  const results = [];
  const batchSize = 5;
  const delayBetweenBatches = 2000; // 2 seconds

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);
    
    const batchPromises = batch.map(text =>
      openRouter.createChatCompletion({
        messages: [
          { role: 'system', content: 'Summarize the text in one sentence.' },
          { role: 'user', content: text },
        ],
        maxTokens: 100,
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Wait between batches to avoid rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

// =============================================================================
// Example 8: Multi-Turn Conversation
// =============================================================================

async function example8_MultiTurnConversation() {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-4-turbo',
  });

  const conversationHistory = [
    { role: 'system' as const, content: 'You are a helpful math tutor.' },
    { role: 'user' as const, content: 'What is calculus?' },
  ];

  // First response
  let response = await openRouter.createChatCompletion({
    messages: conversationHistory,
  });

  console.log('AI:', response.content);
  conversationHistory.push({ role: 'assistant', content: response.content as string });

  // Continue conversation
  conversationHistory.push({
    role: 'user',
    content: 'Can you give me a simple example?',
  });

  response = await openRouter.createChatCompletion({
    messages: conversationHistory,
  });

  console.log('AI:', response.content);
  return conversationHistory;
}

// =============================================================================
// Example 9: Different Model Comparison
// =============================================================================

async function example9_ModelComparison(prompt: string) {
  const models = [
    'openai/gpt-3.5-turbo',
    'openai/gpt-4-turbo',
    'anthropic/claude-3-sonnet',
  ];

  const results = await Promise.all(
    models.map(async (model) => {
      const openRouter = new OpenRouterService({
        apiKey: import.meta.env.OPENROUTER_API_KEY,
        defaultModel: model,
      });

      const startTime = Date.now();
      const response = await openRouter.createChatCompletion({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 150,
      });

      return {
        model: response.model,
        content: response.content,
        duration: Date.now() - startTime,
        tokens: response.usage.totalTokens,
      };
    })
  );

  return results;
}

// =============================================================================
// Example 10: API Key Validation
// =============================================================================

async function example10_ApiKeyValidation() {
  try {
    const openRouter = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      defaultModel: 'openai/gpt-3.5-turbo',
    });

    console.log('Validating API key...');
    const isValid = await openRouter.validateApiKey();

    if (isValid) {
      console.log('✅ API key is valid');
    } else {
      console.log('❌ API key validation failed');
    }

    return isValid;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
}

// =============================================================================
// Export examples (for documentation purposes)
// =============================================================================

export const examples = {
  example1_SimpleTextGeneration,
  example2_FlashcardGeneration,
  example3_QuizGeneration,
  example4_TextSummarization,
  example5_ContentEnhancement,
  example6_ErrorHandlingWithRetry,
  example7_BatchProcessing,
  example8_MultiTurnConversation,
  example9_ModelComparison,
  example10_ApiKeyValidation,
};

