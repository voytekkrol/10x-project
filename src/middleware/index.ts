import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/confirm",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Create a Supabase instance for this request
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });
    
    // Store the Supabase instance in locals for use in API routes and server components
    locals.supabase = supabase;

    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    locals.session = session;
    
    // Debug info
    console.log(`[Middleware] Path: ${url.pathname}, Session exists: ${!!session}`);
    
    // If there's a session, get the user
    if (session) {
      const { data: { user } } = await supabase.auth.getUser();
      locals.user = user;
      
      // If user is authenticated and tries to access auth pages, redirect to /generate
      if (PUBLIC_PATHS.includes(url.pathname)) {
        return redirect('/generate');
      }
    } else {
      // No session, so no user
      locals.user = null;
      
      // If accessing a protected route without authentication, redirect to login
      if (!PUBLIC_PATHS.includes(url.pathname) && url.pathname !== '/') {
        // Save the attempted URL to redirect back after login
        return redirect(`/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
      }
    }

    return next();
  }
);
