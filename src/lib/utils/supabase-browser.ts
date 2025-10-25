/**
 * Supabase Browser Client
 *
 * Client factory for browser-side authentication operations.
 * Uses PUBLIC_ prefixed environment variables.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../db/database.types";

// Private variable to hold singleton instance
let _supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Get supabase browser client - creates instance on first call only
export const getSupabaseBrowser = () => {
  // Only run in browser environment
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowser must be used in browser environment");
  }

  // Return existing instance if already created
  if (_supabaseClient !== null) {
    return _supabaseClient;
  }

  // Create new instance
  console.log("[Supabase Browser Client] Creating client with env:", {
    windowEnvExists: !!window.ENV,
    importMetaEnvExists: !!import.meta.env,
  });

  const supabaseUrl = window.ENV?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = window.ENV?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Supabase Browser Client] Missing required environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    });
  }

  _supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return _supabaseClient;
};
