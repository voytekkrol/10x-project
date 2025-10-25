/**
 * Auth Errors
 *
 * Maps Supabase authentication errors to user-friendly messages
 */

import type { AuthError } from "@supabase/supabase-js";

/**
 * Maps Supabase AuthError to a user-friendly error message
 */
export function mapAuthError(error: AuthError | null): string {
  if (!error) return "";

  // Check for specific error codes or messages
  if (error.message.includes("Invalid login credentials")) {
    return "Invalid email or password";
  }

  if (error.message.includes("Email not confirmed")) {
    return "Please confirm your email before logging in";
  }

  if (error.message.includes("User already registered")) {
    return "This email is already registered";
  }

  if (error.message.includes("Password should be")) {
    return "Password does not meet security requirements";
  }

  if (error.message.includes("Invalid refresh token")) {
    return "Your session has expired. Please log in again";
  }

  // Handle rate limiting
  if (error.status === 429) {
    return "Too many attempts. Please try again later";
  }

  // Fallback for unknown errors
  return "Authentication error. Please try again.";
}
