# OpenRouter Service - Quick Reference

Quick reference guide for the most common operations with the OpenRouter service.

---

## 🚀 Quick Start

### 1. Environment Setup

```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_DEFAULT_MODEL=openai/gpt-4-turbo
```

### 2. Basic Usage

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';

const openRouter = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: 'openai/gpt-4-turbo',
});

const response = await openRouter.createChatCompletion({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.content);
```

---

## 📋 Common Operations

### Generate Flashcards

```typescript
import { generateFlashcards } from './lib/services/mock-ai.service';

const result = await generateFlashcards(sourceText);
// Returns: { proposals: [...], model: 'gpt-4', durationMs: 5000 }
```

### Structured JSON Output

```typescript
interface MyOutput {
  items: Array<{ title: string; description: string }>;
}

const response = await openRouter.createChatCompletion<MyOutput>({
  messages: [...],
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'my_output',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' }
              },
              required: ['title', 'description'],
              additionalProperties: false
            }
          }
        },
        required: ['items'],
        additionalProperties: false
      }
    }
  }
});

// TypeScript knows response.content is MyOutput
response.content.items.forEach(item => {
  console.log(item.title);
});
```

### Error Handling

```typescript
import {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  TimeoutError
} from './lib/utils/openrouter-errors';

try {
  const response = await openRouter.createChatCompletion({...});
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## 🎛️ Configuration Options

### Complete Configuration

```typescript
const openRouter = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,     // Required
  defaultModel: 'openai/gpt-4-turbo',             // Optional
  baseUrl: 'https://openrouter.ai/api/v1',        // Optional
  httpReferer: 'https://yourapp.com',             // Optional
  appName: 'YourApp',                             // Optional
  maxRetries: 3,                                  // Default: 3
  retryDelayMs: 1000,                             // Default: 1000
  timeoutMs: 30000,                               // Default: 30000
});
```

### Request Parameters

```typescript
await openRouter.createChatCompletion({
  messages: [...],                  // Required
  model: 'openai/gpt-4-turbo',     // Optional (uses defaultModel)
  temperature: 0.7,                 // 0.0-2.0, default: model default
  maxTokens: 1000,                  // Max tokens to generate
  topP: 1.0,                        // 0.0-1.0, nucleus sampling
  frequencyPenalty: 0,              // -2.0 to 2.0
  presencePenalty: 0,               // -2.0 to 2.0
  responseFormat: {...},            // For structured JSON output
});
```

---

## 🔧 Common Tasks

### Task 1: Test API Connection

```bash
# Start dev server
npm run dev

# Test with curl
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Test text for flashcard generation"}'
```

### Task 2: Run Integration Tests

```bash
node test-openrouter-integration.js http://localhost:4321
```

### Task 3: Validate API Key

```typescript
const isValid = await openRouter.validateApiKey();
console.log('API key valid:', isValid);
```

### Task 4: Change Model

```typescript
// Option 1: In environment
OPENROUTER_DEFAULT_MODEL=openai/gpt-3.5-turbo

// Option 2: Per request
const response = await openRouter.createChatCompletion({
  model: 'anthropic/claude-3-sonnet',
  messages: [...]
});
```

---

## 📊 Response Structure

### Chat Completion Response

```typescript
{
  content: string | T,          // Response content
  model: string,                 // Model used
  usage: {
    promptTokens: number,        // Input tokens
    completionTokens: number,    // Output tokens
    totalTokens: number          // Total tokens
  },
  durationMs: number,            // Request duration
  finishReason: string,          // "stop", "length", etc.
  requestId: string              // Request ID for tracking
}
```

### AI Generation Result (Flashcards)

```typescript
{
  proposals: [
    {
      front: string,
      back: string,
      source: "ai-full"
    }
  ],
  model: string,
  durationMs: number
}
```

---

## 🚨 Error Types

| Error Type | Status | Description | Retry? |
|------------|--------|-------------|--------|
| `AuthenticationError` | 401 | Invalid API key | No |
| `ValidationError` | 400 | Invalid parameters | No |
| `RateLimitError` | 429 | Rate limit exceeded | Yes |
| `ServiceUnavailableError` | 503 | Service down | Yes |
| `TimeoutError` | - | Request timeout | Yes |
| `NetworkError` | - | Network failure | Yes |
| `OpenRouterError` | Various | General API error | Depends |
| `StructuredOutputError` | - | JSON parse failed | No |

---

## 💡 Tips & Best Practices

### 1. Choose the Right Model

```typescript
// For speed and cost:
defaultModel: 'openai/gpt-3.5-turbo'

// For quality:
defaultModel: 'openai/gpt-4-turbo'

// For balance:
defaultModel: 'anthropic/claude-3-sonnet'
```

### 2. Optimize Token Usage

```typescript
// Use appropriate maxTokens
maxTokens: 500,  // For short responses
maxTokens: 2000, // For flashcards (5 cards)
maxTokens: 4000, // For long content

// Use lower temperature for consistency
temperature: 0.3,  // More deterministic
temperature: 0.7,  // Balanced (default)
temperature: 1.0,  // More creative
```

### 3. Handle Rate Limits

```typescript
try {
  const response = await openRouter.createChatCompletion({...});
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
    await new Promise(r => setTimeout(r, error.retryAfter * 1000));
    // Retry request
  }
}
```

### 4. Use Structured Output

Always use `responseFormat` for predictable outputs:

```typescript
// ✅ Good: Structured output
responseFormat: { type: 'json_schema', json_schema: {...} }

// ❌ Bad: Parsing text output
// "Please return JSON format..."
```

### 5. Monitor Costs

```typescript
console.log('Tokens used:', response.usage.totalTokens);
console.log('Estimated cost:', response.usage.totalTokens * 0.00001); // $0.01 per 1K tokens
```

---

## 🔍 Debugging

### Check API Key

```bash
echo $OPENROUTER_API_KEY
# Should output: sk-or-v1-...
```

### Enable Verbose Logging

```typescript
try {
  const response = await openRouter.createChatCompletion({...});
  console.log('Response:', response);
} catch (error) {
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    requestId: error.requestId,
  });
}
```

### Test Endpoint Directly

```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

---

## 📞 Common Issues

### Issue: "Invalid API key"

**Solution:**
- Check OPENROUTER_API_KEY is set correctly
- Verify no extra spaces or quotes
- Confirm key is active on OpenRouter dashboard

### Issue: "Request timed out"

**Solution:**
- Increase timeoutMs in config
- Check network connectivity
- Try a faster model (gpt-3.5-turbo)

### Issue: "Rate limit exceeded"

**Solution:**
- Wait for the retry period
- Reduce request frequency
- Upgrade OpenRouter plan

### Issue: "Structured output parsing failed"

**Solution:**
- Verify JSON schema is correct
- Check model supports structured output
- Use strict: true in schema

---

## 📚 Resources

- **Full Documentation**: `src/lib/services/README.md`
- **Usage Examples**: `src/lib/services/openrouter.examples.ts`
- **Test Scripts**: `test-openrouter-service.js`, `test-openrouter-integration.js`
- **Implementation Summary**: `OPENROUTER_IMPLEMENTATION_SUMMARY.md`

---

## 🎯 Quick Commands

```bash
# Start development server
npm run dev

# Run integration test
node test-openrouter-integration.js

# Test generation endpoint
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Your text here"}'

# List available models
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

---

**Last Updated**: 2025-10-20  
**Version**: 1.0.0  
**Status**: Production Ready ✅

