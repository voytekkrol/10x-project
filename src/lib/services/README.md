# OpenRouter Service Documentation

## Overview

The OpenRouter Service provides a robust, type-safe abstraction layer for interacting with the OpenRouter API to execute LLM-based chat completions with structured JSON outputs.

## Features

- ✅ **Type-Safe API**: Full TypeScript support with generics for type-safe responses
- ✅ **Structured Output**: JSON schema validation for predictable responses
- ✅ **Error Handling**: Comprehensive error handling with custom error types
- ✅ **Retry Logic**: Automatic retry with exponential backoff for transient failures
- ✅ **Timeout Protection**: Configurable request timeouts with AbortController
- ✅ **Security**: Secure API key management and input validation

## Installation

The service is already integrated into the project. No additional dependencies required.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_DEFAULT_MODEL=openai/gpt-4-turbo
```

### Service Configuration

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';

const openRouter = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: 'openai/gpt-4-turbo',
  httpReferer: 'https://yourapp.com',
  appName: 'YourApp',
  maxRetries: 3,           // Default: 3
  retryDelayMs: 1000,      // Default: 1000ms
  timeoutMs: 30000,        // Default: 30000ms (30 seconds)
});
```

## Usage Examples

### Basic Chat Completion

```typescript
const response = await openRouter.createChatCompletion({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing in simple terms.' }
  ],
  temperature: 0.7,
  maxTokens: 500,
});

console.log(response.content); // AI response as string
console.log(response.model);   // Model used
console.log(response.durationMs); // Request duration
```

### Structured JSON Output

```typescript
// Define your expected output structure
interface FlashcardOutput {
  flashcards: Array<{
    front: string;
    back: string;
  }>;
}

// Create JSON schema
const schema = {
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
              back: { type: 'string' }
            },
            required: ['front', 'back'],
            additionalProperties: false
          }
        }
      },
      required: ['flashcards'],
      additionalProperties: false
    }
  }
};

// Make request with structured output
const response = await openRouter.createChatCompletion<FlashcardOutput>({
  messages: [
    { role: 'system', content: 'Create educational flashcards.' },
    { role: 'user', content: 'Create 3 flashcards about photosynthesis.' }
  ],
  responseFormat: schema,
  temperature: 0.7,
  maxTokens: 1000,
});

// TypeScript knows response.content is FlashcardOutput
response.content.flashcards.forEach(card => {
  console.log(`Q: ${card.front}`);
  console.log(`A: ${card.back}\n`);
});
```

### Error Handling

```typescript
import {
  OpenRouterError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  StructuredOutputError
} from '../utils/openrouter-errors';

try {
  const response = await openRouter.createChatCompletion({
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  });
  
  console.log(response.content);
  
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limit exceeded. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof TimeoutError) {
    console.error(`Request timed out after ${error.timeoutMs}ms`);
  } else if (error instanceof StructuredOutputError) {
    console.error('AI returned invalid JSON format');
    console.log('Raw content:', error.rawContent);
  } else if (error instanceof OpenRouterError) {
    console.error(`OpenRouter API error: ${error.message}`);
    console.log('Model:', error.modelUsed);
    console.log('Request ID:', error.requestId);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### API Key Validation

```typescript
try {
  const isValid = await openRouter.validateApiKey();
  console.log('API key is valid:', isValid);
} catch (error) {
  console.error('API key validation failed:', error);
}
```

## API Reference

### OpenRouterService

#### Constructor

```typescript
constructor(config: OpenRouterConfig)
```

**Parameters:**

- `config.apiKey` (required): OpenRouter API key
- `config.baseUrl` (optional): API base URL (default: "https://openrouter.ai/api/v1")
- `config.defaultModel` (optional): Default model to use
- `config.httpReferer` (optional): HTTP referer for analytics
- `config.appName` (optional): Application name
- `config.maxRetries` (optional): Max retry attempts (default: 3)
- `config.retryDelayMs` (optional): Initial retry delay (default: 1000ms)
- `config.timeoutMs` (optional): Request timeout (default: 30000ms)

#### Methods

##### createChatCompletion\<T\>(params)

Creates a chat completion with optional structured JSON output.

**Parameters:**

- `messages` (required): Array of chat messages
- `model` (optional): Model name (uses defaultModel if omitted)
- `temperature` (optional): 0.0-2.0, controls randomness (default: 0.7)
- `maxTokens` (optional): Maximum tokens to generate (default: 1000)
- `topP` (optional): 0.0-1.0, nucleus sampling
- `frequencyPenalty` (optional): -2.0 to 2.0, penalize frequent tokens
- `presencePenalty` (optional): -2.0 to 2.0, penalize present tokens
- `responseFormat` (optional): JSON schema for structured output

**Returns:** `Promise<ChatCompletionResponse<T>>`

**Response Structure:**

```typescript
{
  content: T,              // String or typed object if responseFormat used
  model: string,           // Model used for generation
  usage: {
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  },
  durationMs: number,      // Request duration
  finishReason: string,    // Reason for completion
  requestId: string        // Request ID for tracking
}
```

##### validateApiKey()

Validates the API key by making a test request.

**Returns:** `Promise<boolean>`

## Error Types

### OpenRouterError

Base error for OpenRouter API errors.

**Properties:**
- `message`: Error message
- `statusCode`: HTTP status code
- `modelUsed`: Model that was used
- `requestId`: Request ID for tracking

### AuthenticationError

Thrown when API key is invalid or missing.

**Status Code:** 401

### RateLimitError

Thrown when rate limit is exceeded.

**Status Code:** 429

**Properties:**
- `retryAfter`: Seconds to wait before retrying

### ServiceUnavailableError

Thrown when OpenRouter service is unavailable.

**Status Code:** 503

### ValidationError

Thrown when request parameters are invalid.

**Status Code:** 400

### TimeoutError

Thrown when request exceeds timeout duration.

**Properties:**
- `timeoutMs`: Timeout duration in milliseconds

### StructuredOutputError

Thrown when structured JSON output parsing fails.

**Properties:**
- `rawContent`: Raw response content
- `expectedSchema`: Expected JSON schema

### NetworkError

Thrown when network request fails.

## Retry Behavior

The service automatically retries failed requests with exponential backoff:

**Retryable Errors:**
- Rate limit (429)
- Service unavailable (503)
- Network errors
- Timeout errors

**Non-Retryable Errors:**
- Authentication (401)
- Validation (400)
- Not found (404)

**Retry Strategy:**
- Initial delay: `retryDelayMs` (default: 1000ms)
- Exponential backoff: `delay × 2^attempt`
- Max retries: `maxRetries` (default: 3)
- Respects `Retry-After` header for rate limits

## Security Best Practices

1. **API Key Management**
   - Store API key in environment variables only
   - Never expose in client-side code or logs
   - Use service only in server-side code (Astro API routes)

2. **Input Validation**
   - All inputs are validated before making API requests
   - Message arrays must not be empty
   - Parameter ranges are enforced

3. **Response Validation**
   - Structured outputs are safely parsed with try-catch
   - Response content type is verified
   - JSON schema validation for structured outputs

4. **Logging**
   - Sensitive data is sanitized before logging
   - API keys are redacted in error messages

## Supported Models

The service supports any model available on OpenRouter. Popular choices:

- `openai/gpt-4-turbo` - GPT-4 Turbo (recommended)
- `openai/gpt-3.5-turbo` - GPT-3.5 Turbo (faster, cheaper)
- `anthropic/claude-3-opus` - Claude 3 Opus
- `anthropic/claude-3-sonnet` - Claude 3 Sonnet
- `google/gemini-pro` - Google Gemini Pro
- `meta-llama/llama-3-70b-instruct` - Llama 3 70B

See [OpenRouter Models](https://openrouter.ai/models) for the complete list.

## Performance Tips

1. **Choose the Right Model**
   - Use GPT-3.5 for simple tasks (faster, cheaper)
   - Use GPT-4 for complex reasoning (better quality)

2. **Optimize Token Usage**
   - Set appropriate `maxTokens` limits
   - Use concise prompts
   - Consider streaming for long responses

3. **Use Structured Output**
   - Always use `responseFormat` for predictable responses
   - Reduces parsing errors and improves reliability

4. **Handle Errors Gracefully**
   - Implement proper error handling
   - Show user-friendly error messages
   - Log errors for debugging

## Testing

Two test scripts are provided:

1. **test-openrouter-service.js** - Manual testing guide
2. **test-openrouter-integration.js** - End-to-end integration test

Run tests:

```bash
# Start development server
npm run dev

# Run integration test
node test-openrouter-integration.js http://localhost:4321
```

## Troubleshooting

### "Invalid API key" Error

- Verify `OPENROUTER_API_KEY` is set correctly
- Check API key is active on OpenRouter dashboard
- Ensure no extra spaces or quotes in the key

### "Request timed out" Error

- Increase `timeoutMs` in configuration
- Check network connectivity
- Verify OpenRouter service status

### "Rate limit exceeded" Error

- Wait for the duration specified in `retryAfter`
- Consider upgrading your OpenRouter plan
- Implement request queuing in your application

### "Structured output parsing failed" Error

- Verify JSON schema is correct
- Check model supports structured output
- Review AI response for format issues

## Integration with Flashcard Service

The OpenRouter service is integrated with the flashcard generation service:

```typescript
// src/lib/services/mock-ai.service.ts
import { OpenRouterService } from './openrouter.service';

export async function generateFlashcards(sourceText: string) {
  const openRouter = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL,
  });

  const response = await openRouter.createChatCompletion({
    messages: [
      { role: 'system', content: 'Create educational flashcards.' },
      { role: 'user', content: `Generate flashcards from:\n\n${sourceText}` }
    ],
    responseFormat: FLASHCARD_SCHEMA,
  });

  return {
    proposals: response.content.flashcards,
    model: response.model,
    durationMs: response.durationMs,
  };
}
```

## Additional Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [OpenRouter API Reference](https://openrouter.ai/docs/api-reference)

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review OpenRouter documentation
3. Check OpenRouter service status
4. Contact OpenRouter support

## License

This service implementation is part of the project and follows the project's license terms.

