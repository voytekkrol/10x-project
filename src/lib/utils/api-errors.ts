/**
 * API Error Handling Utilities
 *
 * Provides custom error classes and error handling functions for API calls
 */

import type { ErrorResponseDTO } from "../../types";

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorResponse?: ErrorResponseDTO
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends ApiError {
  constructor(message = "Authentication required", errorResponse?: ErrorResponseDTO) {
    super(message, 401, errorResponse);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends ApiError {
  constructor(
    message = "Rate limit exceeded",
    public retryAfter: number,
    errorResponse?: ErrorResponseDTO
  ) {
    super(message, 429, errorResponse);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message = "Service temporarily unavailable", errorResponse?: ErrorResponseDTO) {
    super(message, 503, errorResponse);
    this.name = "ServiceUnavailableError";
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends ApiError {
  constructor(message = "Validation failed", errorResponse?: ErrorResponseDTO) {
    super(message, 400, errorResponse);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network Error (no response from server)
 */
export class NetworkError extends Error {
  constructor(message = "Network request failed") {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Parses API error response and throws appropriate error class
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorResponse: ErrorResponseDTO;

  try {
    errorResponse = await response.json();
  } catch {
    // If JSON parsing fails, use default error structure
    errorResponse = {
      error: "API Error",
      message: `Request failed with status ${response.status}`,
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }

  const message = errorResponse.message || "An error occurred";

  switch (response.status) {
    case 401:
      throw new AuthenticationError(message, errorResponse);

    case 429: {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
      throw new RateLimitError(message, retryAfter, errorResponse);
    }

    case 503:
      throw new ServiceUnavailableError(message, errorResponse);

    case 400:
      throw new ValidationError(message, errorResponse);

    default:
      throw new ApiError(message, response.status, errorResponse);
  }
}

/**
 * Wraps fetch call with error handling
 */
export async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    // Re-throw our custom errors
    if (
      error instanceof ApiError ||
      error instanceof AuthenticationError ||
      error instanceof RateLimitError ||
      error instanceof ServiceUnavailableError ||
      error instanceof ValidationError
    ) {
      throw error;
    }

    // Wrap unknown errors as NetworkError
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new NetworkError("Unable to connect to server");
    }

    // Wrap other unknown errors
    throw new NetworkError(error instanceof Error ? error.message : "Unknown error occurred");
  }
}

/**
 * Gets user-friendly error message from error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Checks if error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof ServiceUnavailableError) {
    return true;
  }

  if (error instanceof RateLimitError) {
    return true; // Can retry after waiting
  }

  if (error instanceof ApiError) {
    // 5xx errors are generally recoverable
    return error.statusCode >= 500;
  }

  return false;
}
