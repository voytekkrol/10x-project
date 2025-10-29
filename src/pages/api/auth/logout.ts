/**
 * Logout API Endpoint
 *
 * Handles user logout by clearing the session server-side
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return new Response(JSON.stringify({ error: "Supabase client not available" }), { status: 500 });
  }

  try {
    // Sign out the user - this clears the session cookies
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[Logout API] Error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    console.log("[Logout API] User logged out successfully");

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("[Logout API] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Failed to logout" }), { status: 500 });
  }
};
