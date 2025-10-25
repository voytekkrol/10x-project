/**
 * OpenRouter Service Error Classes
 *
 * Custom error classes for OpenRouter API integration with detailed error information
 */

import { ApiError } from "./api-errors";

/**
 * OpenRouter-specific API error with model and request tracking
 */
export class OpenRouterError extends ApiError {
  constructor(
    message: string,
    statusCode: number,
    public modelUsed?: string,
    public requestId?: string
  ) {
    super(message, statusCode);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

/**
 * Error thrown when structured JSON output parsing fails or doesn't match expected schema
 */
export class StructuredOutputError extends Error {
  constructor(
    message: string,
    public rawContent: string,
    public expectedSchema: Record<string, unknown>
  ) {
    super(message);
    this.name = "StructuredOutputError";
    Object.setPrototypeOf(this, StructuredOutputError.prototype);
  }
}

/**
 * Error thrown when request exceeds timeout duration
 */
export class TimeoutError extends Error {
  constructor(
    message = "Request timed out",
    public timeoutMs: number
  ) {
    super(message);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when API key validation fails
 */
export class InvalidApiKeyError extends Error {
  constructor(message = "Invalid or missing API key") {
    super(message);
    this.name = "InvalidApiKeyError";
    Object.setPrototypeOf(this, InvalidApiKeyError.prototype);
  }
}
