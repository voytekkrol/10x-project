/**
 * Email Confirmation & Password Reset Callback Handler
 *
 * Handles the client-side callback for:
 * - Email verification (signup confirmation)
 * - Password reset token exchange
 */

import { getSupabaseBrowser } from "./supabase-browser";

export async function handleAuthCallback() {
  try {
    const supabase = getSupabaseBrowser();

    // Check if we have a hash with auth tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    console.log("[Confirm] Auth callback - Type:", type, "Has token:", !!accessToken);

    if (!accessToken) {
      console.error("[Confirm] No access token found in URL hash");
      window.location.href = "/auth/login?error=no_token";
      return;
    }

    // Exchange the token for a session
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("[Confirm] Error getting session:", error);
      window.location.href = `/auth/login?error=${encodeURIComponent(error.message)}`;
      return;
    }

    console.log("[Confirm] Session obtained:", !!data.session);

    // Determine where to redirect based on the type
    if (type === "recovery") {
      // Password reset - redirect to reset password page
      console.log("[Confirm] Password reset confirmed, redirecting to reset-password");
      window.location.href = "/auth/reset-password";
    } else if (type === "signup" || type === "email_confirmation") {
      // Email confirmation - redirect to login with success message
      console.log("[Confirm] Email confirmed, redirecting to login");
      window.location.href = "/auth/login?confirmed=true";
    } else {
      // Unknown type, default to login
      console.log("[Confirm] Unknown type, redirecting to login");
      window.location.href = "/auth/login";
    }
  } catch (err) {
    console.error("[Confirm] Unexpected error during auth callback:", err);
    window.location.href = "/auth/login?error=unexpected_error";
  }
}
