# OpenRouter Service Implementation Plan

## 1. Service Overview

The OpenRouter Service provides an abstraction layer for interacting with the OpenRouter API to execute LLM-based chat completions with structured JSON outputs.

**Key Features:**
- Chat completions with system and user messages
- Structured JSON output with schema validation (response_format)
- Comprehensive error handling with custom error types
- Retry logic with exponential backoff for transient failures
- Full TypeScript support with generics for type-safe responses
- API key management and security best practices

## 2. Configuration

### Constructor Parameters

```typescript
interface OpenRouterConfig {
  apiKey: string;                // Required: OpenRouter API key from env
  baseUrl?: string;              // Default: "https://api.openrouter.ai/api/v1"
  defaultModel?: string;         // Default model if not specified in request
  httpReferer?: string;          // Optional: For OpenRouter analytics
  appName?: string;              // Optional: Application identifier
  maxRetries?: number;           // Default: 3
  retryDelayMs?: number;         // Default: 1000 (with exponential backoff)
  timeoutMs?: number;            // Default: 30000 (30 seconds)
}
```

### Example Usage

```typescript
const openRouter = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "openai/gpt-4-turbo",
  httpReferer: "https://myapp.com",
  appName: "FlashcardGenerator",
});
```

## 3. Public Methods

### Primary Method: createChatCompletion

```typescript
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionParams<T = unknown> {
  messages: ChatMessage[];           // Conversation messages (required)
  model?: string;                    // Model name (uses defaultModel if omitted)
  temperature?: number;              // 0.0-2.0, default: 0.7
  maxTokens?: number;                // Default: 1000
  topP?: number;                     // 0.0-1.0
  frequencyPenalty?: number;         // -2.0 to 2.0
  presencePenalty?: number;          // -2.0 to 2.0
  responseFormat?: {                 // For structured JSON output
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  };
}

interface ChatCompletionResponse<T = unknown> {
  content: T extends Record<string, unknown> ? T : string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  durationMs: number;
  finishReason: string;
  requestId: string;
}

async createChatCompletion<T = unknown>(
  params: ChatCompletionParams<T>
): Promise<ChatCompletionResponse<T>>
```

### Example: Simple Chat

```typescript
const response = await openRouter.createChatCompletion({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Create a flashcard about photosynthesis." }
  ],
  temperature: 0.7,
  maxTokens: 500,
});
```

### Example: Structured Output with JSON Schema

```typescript
interface FlashcardOutput {
  flashcards: Array<{ front: string; back: string }>;
}

const response = await openRouter.createChatCompletion<FlashcardOutput>({
  messages: [
    { role: "system", content: "You create educational flashcards." },
    { role: "user", content: "Create 3 flashcards about photosynthesis." }
  ],
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "flashcard_generation",
      strict: true,
      schema: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" }
              },
              required: ["front", "back"],
              additionalProperties: false
            }
          }
        },
        required: ["flashcards"],
        additionalProperties: false
      }
    }
  }
});

// TypeScript knows response.content is FlashcardOutput
console.log(response.content.flashcards[0].front);
```

## 4. Error Handling

### Custom Error Classes

Create in `src/lib/utils/openrouter-errors.ts`:

```typescript
export class OpenRouterError extends ApiError {
  constructor(message: string, statusCode: number, 
              public modelUsed?: string, public requestId?: string) {
    super(message, statusCode);
    this.name = "OpenRouterError";
  }
}

export class StructuredOutputError extends Error {
  constructor(message: string, public rawContent: string, 
              public expectedSchema: Record<string, unknown>) {
    super(message);
    this.name = "StructuredOutputError";
  }
}

export class TimeoutError extends Error {
  constructor(message = "Request timed out", public timeoutMs: number) {
    super(message);
    this.name = "TimeoutError";
  }
}
```

### Error Scenarios

| Scenario | Error Type | Retry? | User Message |
|----------|-----------|---------|--------------|
| Invalid API key | AuthenticationError | No | "Invalid API key" |
| Rate limit exceeded | RateLimitError | Yes | "Rate limit exceeded. Try again in {n} seconds" |
| Network failure | NetworkError | Yes | "Unable to connect to AI service" |
| Timeout | TimeoutError | Yes | "Request timed out" |
| Invalid params | ValidationError | No | "Invalid request parameters" |
| Service down | ServiceUnavailableError | Yes | "AI service temporarily unavailable" |
| Invalid JSON output | StructuredOutputError | No | "AI generated invalid response format" |

### Retry Strategy

- Retry on: 429 (rate limit), 503 (service unavailable), network errors
- Don't retry on: 400 (validation), 401 (auth), 404 (not found)
- Exponential backoff: delay = retryDelayMs × (2 ^ retryCount)
- Respect Retry-After header if present

## 5. Security Considerations

### API Key Management
- Store API key in environment variables only
- Never expose in client-side code or logs
- Use service only in Astro API routes (server-side)

### Input Validation
- Validate message array not empty
- Validate role values ("system", "user", "assistant")
- Validate parameter ranges (temperature, maxTokens, etc.)
- Sanitize content before logging

### Response Validation
- Verify response content type is JSON
- Parse structured outputs safely with try-catch
- Validate JSON matches expected schema

## 6. Implementation Steps

### Step 1: Create Type Definitions
**File:** `src/lib/types/openrouter.types.ts`
- Define `OpenRouterConfig` interface
- Define `ChatMessage`, `ChatCompletionParams<T>`, `ChatCompletionResponse<T>`
- Export all types

### Step 2: Create Custom Error Classes
**File:** `src/lib/utils/openrouter-errors.ts`
- Implement `OpenRouterError` (extends ApiError)
- Implement `StructuredOutputError`
- Implement `TimeoutError`

### Step 3: Implement Service Class
**File:** `src/lib/services/openrouter.service.ts`

**Constructor:**
- Validate API key is provided
- Set default values for optional config
- Build base headers (Authorization, Content-Type, HTTP-Referer, X-Title)
- Store configuration

**Private Methods:**
- `validateMessages()` - Validate message array structure
- `validateParameters()` - Validate temperature, maxTokens, etc.
- `buildRequestBody()` - Map params to OpenRouter API format
- `executeRequest()` - HTTP request with timeout and retry logic
- `parseResponse()` - Parse API response, handle structured JSON
- `classifyError()` - Classify errors and throw appropriate error type
- `sanitizeForLogging()` - Remove sensitive data from logs

**Public Methods:**
- `createChatCompletion<T>()` - Main method for chat completions
- `validateApiKey()` - Test if API key is valid

### Step 4: Integrate with Mock AI Service
**File:** `src/lib/services/mock-ai.service.ts`

Replace mock implementation with OpenRouter:

```typescript
import { OpenRouterService } from "./openrouter.service";

const openRouter = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4-turbo",
  httpReferer: "https://yourapp.com",
  appName: "FlashcardGenerator",
});

export async function generateFlashcards(sourceText: string): Promise<AIGenerationResult> {
  interface FlashcardOutput {
    flashcards: Array<{ front: string; back: string }>;
  }

  const response = await openRouter.createChatCompletion<FlashcardOutput>({
    messages: [
      {
        role: "system",
        content: `You are an expert at creating educational flashcards.
Create 5 flashcards from the provided text with clear questions and concise answers.`
      },
      { role: "user", content: `Generate flashcards from:\n\n${sourceText}` }
    ],
    temperature: 0.7,
    maxTokens: 2000,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "flashcard_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            flashcards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  front: { type: "string" },
                  back: { type: "string" }
                },
                required: ["front", "back"],
                additionalProperties: false
              }
            }
          },
          required: ["flashcards"],
          additionalProperties: false
        }
      }
    }
  });

  return {
    proposals: response.content.flashcards.map(card => ({
      front: card.front,
      back: card.back,
      source: "ai-full" as const
    })),
    model: response.model,
    durationMs: response.durationMs
  };
}
```

### Step 5: Add Environment Variables

Update `src/env.d.ts`:
```typescript
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_DEFAULT_MODEL: string;
}
```

## 6. Implementation Checklist

- [ ] Create type definitions (`openrouter.types.ts`)
- [ ] Create custom error classes (`openrouter-errors.ts`)
- [ ] Implement OpenRouter service class (`openrouter.service.ts`)
- [ ] Update environment variables (`.env`, `env.d.ts`)
- [ ] Integrate with mock AI service (`mock-ai.service.ts`)
- [ ] Test API key validation
- [ ] Test simple chat completion
- [ ] Test structured JSON output
- [ ] Test error handling scenarios
- [ ] Add JSDoc comments to public methods

## 9. Notes

**Estimated Implementation Time:** 4-6 hours

**Key Files:**
1. `src/lib/services/openrouter.service.ts` (~300-400 lines)
2. `src/lib/types/openrouter.types.ts` (~100-150 lines)
3. `src/lib/utils/openrouter-errors.ts` (~80-100 lines)
4. `src/lib/services/mock-ai.service.ts` (update ~80 lines)

**Dependencies:**
- No additional required dependencies
- Optional: `ajv` for JSON schema validation

**Important:**
- Always use structured output with `response_format` for predictable responses
- Never log API keys or sensitive user data
- Implement retry logic only for transient failures
- Use TypeScript generics for type-safe structured outputs
