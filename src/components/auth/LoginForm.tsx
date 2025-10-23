/**
 * Login Form Component
 * 
 * Email/password form with validation and error display
 */

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { getSupabaseBrowser } from "../../lib/utils/supabase-browser";
import { LoginFormSchema, type LoginFormValues } from "../../lib/validation/auth.schemas";
import { mapAuthError } from "../../lib/utils/auth-errors";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Use zod schema for validation
    const result = LoginFormSchema.safeParse({ email, password });
    if (!result.success) {
      // Get the first validation error
      const fieldErrors = result.error.formErrors.fieldErrors;
      const firstError = 
        fieldErrors.email?.[0] || 
        fieldErrors.password?.[0] || 
        "Invalid form data";
      setError(firstError);
      return;
    }

    setIsLoading(true);
    
    try {
      const supabase = getSupabaseBrowser();
      console.log("Attempting to sign in with:", { email });
      
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign in response:", { 
        success: !supabaseError, 
        hasSession: !!data?.session,
        error: supabaseError ? supabaseError.message : null
      });

      if (supabaseError) {
        // Map the error to a user-friendly message
        setError(mapAuthError(supabaseError));
        setIsLoading(false);
        return;
      }
      
      // Success! Redirect to the appropriate page
      if (data.session) {
        console.log("Login successful, redirecting to:", redirectTo || "/generate");
        
        // Add a small delay before redirecting to ensure cookies are set
        setTimeout(() => {
          window.location.href = redirectTo || "/generate";
        }, 500);
      } else {
        console.error("No session returned despite successful login");
        setError("Authentication error. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please check your internet");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
          role="alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Login Failed</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            className={cn(
              "w-full px-3 py-2 rounded-md border text-sm",
              "bg-background text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Password
            </label>
            <a href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
            className={cn(
              "w-full px-3 py-2 rounded-md border text-sm",
              "bg-background text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        </div>

        {/* Submit button */}
        <Button 
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>

        {/* Register link */}
        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{" "}
          <a href="/auth/register" className="text-primary hover:underline font-medium">
            Register
          </a>
        </p>

        {/* Hidden field for redirect URL */}
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      </form>
    </div>
  );
}

