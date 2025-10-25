/**
 * OpenRouter Service Type Definitions
 *
 * Type definitions for OpenRouter API integration including configuration,
 * chat messages, completion parameters, and responses.
 */

/**
 * Configuration options for OpenRouter service
 */
export interface OpenRouterConfig {
  /** OpenRouter API key (required) */
  apiKey: string;

  /** Base URL for OpenRouter API (default: "https://openrouter.ai/api/v1") */
  baseUrl?: string;

  /** Default model to use if not specified in request */
  defaultModel?: string;

  /** HTTP referer for OpenRouter analytics (optional) */
  httpReferer?: string;

  /** Application name identifier (optional) */
  appName?: string;

  /** Maximum number of retry attempts for transient failures (default: 3) */
  maxRetries?: number;

  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelayMs?: number;

  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

/**
 * Chat message with role and content
 */
export interface ChatMessage {
  /** Role of the message sender */
  role: "system" | "user" | "assistant";

  /** Content of the message */
  content: string;
}

/**
 * JSON schema definition for structured output
 */
export interface JsonSchema {
  /** Schema name identifier */
  name: string;

  /** Strict schema validation */
  strict: boolean;

  /** JSON schema object */
  schema: Record<string, unknown>;
}

/**
 * Response format configuration for structured JSON output
 */
export interface ResponseFormat {
  /** Response format type (only json_schema supported) */
  type: "json_schema";

  /** JSON schema definition */
  json_schema: JsonSchema;
}

/**
 * Parameters for chat completion request
 */
export interface ChatCompletionParams<T = unknown> {
  /** Array of conversation messages (required) */
  messages: ChatMessage[];

  /** Model name (uses defaultModel if omitted) */
  model?: string;

  /** Temperature for response randomness (0.0-2.0, default: 0.7) */
  temperature?: number;

  /** Maximum tokens to generate (default: 1000) */
  maxTokens?: number;

  /** Top-p nucleus sampling (0.0-1.0) */
  topP?: number;

  /** Frequency penalty (-2.0 to 2.0) */
  frequencyPenalty?: number;

  /** Presence penalty (-2.0 to 2.0) */
  presencePenalty?: number;

  /** Structured JSON output configuration */
  responseFormat?: ResponseFormat;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  /** Number of tokens in the prompt */
  promptTokens: number;

  /** Number of tokens in the completion */
  completionTokens: number;

  /** Total tokens used (prompt + completion) */
  totalTokens: number;
}

/**
 * Response from chat completion
 */
export interface ChatCompletionResponse<T = unknown> {
  /** Response content (string or structured object if responseFormat specified) */
  content: T extends Record<string, unknown> ? T : string;

  /** Model used for generation */
  model: string;

  /** Token usage statistics */
  usage: TokenUsage;

  /** Duration of request in milliseconds */
  durationMs: number;

  /** Finish reason (e.g., "stop", "length") */
  finishReason: string;

  /** Request ID for tracking */
  requestId: string;
}

/**
 * OpenRouter API request body structure
 */
export interface OpenRouterRequestBody {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

/**
 * OpenRouter API response structure
 */
export interface OpenRouterApiResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
