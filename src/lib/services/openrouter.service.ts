/**
 * OpenRouter Service
 *
 * Provides abstraction layer for interacting with OpenRouter API to execute
 * LLM-based chat completions with structured JSON outputs.
 *
 * Key Features:
 * - Chat completions with system and user messages
 * - Structured JSON output with schema validation
 * - Comprehensive error handling with custom error types
 * - Retry logic with exponential backoff for transient failures
 * - Full TypeScript support with generics for type-safe responses
 */

import type {
  OpenRouterConfig,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatMessage,
  OpenRouterRequestBody,
  OpenRouterApiResponse,
} from "../types/openrouter.types";

import { OpenRouterError, StructuredOutputError, TimeoutError, InvalidApiKeyError } from "../utils/openrouter-errors";

import {
  AuthenticationError,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
  NetworkError,
} from "../utils/api-errors";

/**
 * OpenRouter Service class for AI chat completions
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel?: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;

  /**
   * Creates new OpenRouter service instance
   *
   * @param config - Service configuration options
   * @throws {InvalidApiKeyError} If API key is not provided
   */
  constructor(config: OpenRouterConfig) {
    // Validate API key
    if (!config.apiKey || config.apiKey.trim() === "") {
      throw new InvalidApiKeyError("OpenRouter API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config.defaultModel;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
    this.timeoutMs = config.timeoutMs ?? 30000;

    // Build headers
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    if (config.httpReferer) {
      this.headers["HTTP-Referer"] = config.httpReferer;
    }

    if (config.appName) {
      this.headers["X-Title"] = config.appName;
    }
  }

  /**
   * Creates chat completion with optional structured JSON output
   *
   * @param params - Chat completion parameters
   * @returns Chat completion response with typed content
   * @throws {ValidationError} If parameters are invalid
   * @throws {AuthenticationError} If API key is invalid
   * @throws {RateLimitError} If rate limit exceeded
   * @throws {TimeoutError} If request times out
   * @throws {OpenRouterError} For other API errors
   */
  async createChatCompletion<T = unknown>(params: ChatCompletionParams<T>): Promise<ChatCompletionResponse<T>> {
    const startTime = Date.now();

    // Validate parameters
    this.validateMessages(params.messages);
    this.validateParameters(params);

    // Build request body
    const requestBody = this.buildRequestBody(params);

    // Execute request with retry logic
    const response = await this.executeRequest(requestBody);

    // Parse and return response
    return this.parseResponse<T>(response, startTime, params.responseFormat !== undefined);
  }

  /**
   * Validates API key by making a test request
   *
   * @returns True if API key is valid
   * @throws {AuthenticationError} If API key is invalid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.createChatCompletion({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say 'OK'." },
        ],
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      // Other errors don't necessarily mean invalid API key
      return false;
    }
  }

  /**
   * Validates messages array structure
   *
   * @param messages - Array of chat messages
   * @throws {ValidationError} If messages are invalid
   */
  private validateMessages(messages: ChatMessage[]): void {
    if (!messages || messages.length === 0) {
      throw new ValidationError("Messages array cannot be empty");
    }

    for (const message of messages) {
      if (!message.role || !["system", "user", "assistant"].includes(message.role)) {
        throw new ValidationError(`Invalid message role: ${message.role}. Must be "system", "user", or "assistant"`);
      }

      if (!message.content || typeof message.content !== "string") {
        throw new ValidationError("Message content must be a non-empty string");
      }
    }
  }

  /**
   * Validates request parameters
   *
   * @param params - Chat completion parameters
   * @throws {ValidationError} If parameters are invalid
   */
  private validateParameters(params: ChatCompletionParams): void {
    if (params.temperature !== undefined) {
      if (params.temperature < 0 || params.temperature > 2) {
        throw new ValidationError("Temperature must be between 0.0 and 2.0");
      }
    }

    if (params.maxTokens !== undefined) {
      if (params.maxTokens < 1 || params.maxTokens > 100000) {
        throw new ValidationError("Max tokens must be between 1 and 100000");
      }
    }

    if (params.topP !== undefined) {
      if (params.topP < 0 || params.topP > 1) {
        throw new ValidationError("Top-p must be between 0.0 and 1.0");
      }
    }

    if (params.frequencyPenalty !== undefined) {
      if (params.frequencyPenalty < -2 || params.frequencyPenalty > 2) {
        throw new ValidationError("Frequency penalty must be between -2.0 and 2.0");
      }
    }

    if (params.presencePenalty !== undefined) {
      if (params.presencePenalty < -2 || params.presencePenalty > 2) {
        throw new ValidationError("Presence penalty must be between -2.0 and 2.0");
      }
    }

    // Validate model
    const model = params.model || this.defaultModel;
    if (!model) {
      throw new ValidationError("Model must be specified in params or as defaultModel in config");
    }
  }

  /**
   * Builds OpenRouter API request body from parameters
   *
   * @param params - Chat completion parameters
   * @returns Request body for OpenRouter API
   */
  private buildRequestBody(params: ChatCompletionParams): OpenRouterRequestBody {
    const model = params.model || this.defaultModel;
    if (!model) {
      throw new ValidationError("Model is required");
    }

    const requestBody: OpenRouterRequestBody = {
      model,
      messages: params.messages,
    };

    if (params.temperature !== undefined) {
      requestBody.temperature = params.temperature;
    }

    if (params.maxTokens !== undefined) {
      requestBody.max_tokens = params.maxTokens;
    }

    if (params.topP !== undefined) {
      requestBody.top_p = params.topP;
    }

    if (params.frequencyPenalty !== undefined) {
      requestBody.frequency_penalty = params.frequencyPenalty;
    }

    if (params.presencePenalty !== undefined) {
      requestBody.presence_penalty = params.presencePenalty;
    }

    if (params.responseFormat) {
      requestBody.response_format = params.responseFormat;
    }

    return requestBody;
  }

  /**
   * Executes HTTP request with retry logic and timeout
   *
   * @param requestBody - Request body to send
   * @returns OpenRouter API response
   * @throws {TimeoutError} If request times out
   * @throws {NetworkError} If network request fails
   * @throws Various API errors based on response
   */
  private async executeRequest(requestBody: OpenRouterRequestBody): Promise<OpenRouterApiResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle error responses
        if (!response.ok) {
          await this.handleErrorResponse(response, requestBody.model);
        }

        // Parse and return successful response
        const data = (await response.json()) as OpenRouterApiResponse;
        return data;
      } catch (error) {
        // Handle abort/timeout
        if (error instanceof Error && error.name === "AbortError") {
          lastError = new TimeoutError(`Request timed out after ${this.timeoutMs}ms`, this.timeoutMs);
        }
        // Handle network errors
        else if (error instanceof TypeError && error.message.includes("fetch")) {
          lastError = new NetworkError("Unable to connect to OpenRouter API");
        }
        // Re-throw non-retryable errors immediately
        else if (error instanceof AuthenticationError || error instanceof ValidationError) {
          throw error;
        }
        // Store other errors for retry
        else {
          lastError = error instanceof Error ? error : new Error(String(error));
        }

        // Check if we should retry
        const shouldRetry =
          lastError instanceof TimeoutError ||
          lastError instanceof NetworkError ||
          lastError instanceof RateLimitError ||
          lastError instanceof ServiceUnavailableError;

        if (!shouldRetry || attempt === this.maxRetries) {
          throw lastError;
        }

        // Calculate backoff delay
        const retryAfter =
          lastError instanceof RateLimitError ? lastError.retryAfter * 1000 : this.retryDelayMs * Math.pow(2, attempt);

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new Error("Request failed after all retries");
  }

  /**
   * Handles error response from OpenRouter API
   *
   * @param response - Error response from API
   * @param model - Model used in request
   * @throws Appropriate error type based on status code
   */
  private async handleErrorResponse(response: Response, model: string): Promise<never> {
    let errorMessage = `OpenRouter API error: ${response.status}`;
    let requestId: string | undefined;

    // Try to parse error response
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
      requestId = errorData.id || response.headers.get("x-request-id") || undefined;
    } catch {
      // Use default error message if parsing fails
    }

    // Classify and throw appropriate error
    switch (response.status) {
      case 401:
        throw new AuthenticationError("Invalid OpenRouter API key");

      case 429: {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
        throw new RateLimitError(errorMessage || "Rate limit exceeded", retryAfter);
      }

      case 503:
        throw new ServiceUnavailableError(errorMessage || "OpenRouter service unavailable");

      case 400:
        throw new ValidationError(errorMessage || "Invalid request parameters");

      case 404:
        throw new OpenRouterError(errorMessage || "Model not found", 404, model, requestId);

      default:
        throw new OpenRouterError(errorMessage, response.status, model, requestId);
    }
  }

  /**
   * Parses OpenRouter API response and extracts completion
   *
   * @param response - API response
   * @param startTime - Request start time
   * @param isStructuredOutput - Whether structured JSON output was requested
   * @returns Parsed chat completion response
   * @throws {StructuredOutputError} If structured output parsing fails
   */
  private parseResponse<T>(
    response: OpenRouterApiResponse,
    startTime: number,
    isStructuredOutput: boolean
  ): ChatCompletionResponse<T> {
    const durationMs = Date.now() - startTime;

    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterError("No completion choices in response", 500, response.model);
    }

    const choice = response.choices[0];
    const rawContent = choice.message.content;

    // Parse structured output if expected
    let content: T | string = rawContent;
    if (isStructuredOutput) {
      try {
        content = JSON.parse(rawContent) as T;
      } catch {
        throw new StructuredOutputError("Failed to parse structured JSON output from AI response", rawContent, {});
      }
    }

    return {
      content: content as T extends Record<string, unknown> ? T : string,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      durationMs,
      finishReason: choice.finish_reason,
      requestId: response.id,
    };
  }

  /**
   * Sanitizes data for logging by removing sensitive information
   *
   * @param data - Data to sanitize
   * @returns Sanitized data safe for logging
   */
  private sanitizeForLogging(data: unknown): unknown {
    if (typeof data === "string") {
      // Remove potential API keys from strings
      return data.replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]");
    }

    if (typeof data === "object" && data !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes("key") || key.toLowerCase().includes("token")) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }

    return data;
  }
}
