/**
 * Forgot Password Form Component
 *
 * Form for requesting password reset email with validation and success message
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { getSupabaseBrowser } from "../../lib/utils/supabase-browser";
import { EmailSchema } from "../../lib/validation/auth.schemas";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous states
    setError(null);

    // Validate email with Zod schema
    const result = EmailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowser();

      // Get the current origin for the redirect URL
      const redirectTo = `${window.location.origin}/auth/confirm`;

      console.log("Sending password reset email to:", email);
      console.log("Redirect URL:", redirectTo);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        console.error("Password reset error:", resetError);
        setError(resetError.message || "Failed to send reset email. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success! Show confirmation message
      console.log("Password reset email sent successfully");
      setIsLoading(false);
      setSuccess(true);
    } catch (err) {
      console.error("Unexpected error during password reset:", err);
      setError("Connection error. Please check your internet and try again.");
      setIsLoading(false);
    }
  };

  // If reset email was sent, show confirmation message
  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-8 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            >
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground">Check your email</h3>
        <p className="text-muted-foreground">
          If an account exists with this email address, we&apos;ve sent password reset instructions.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/auth/login">Back to Login</a>
        </Button>
      </div>
    );
  }

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
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

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
            aria-describedby={error ? "forgot-password-error" : undefined}
          />
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>

        {/* Login link */}
        <p className="text-sm text-center text-muted-foreground">
          Remembered your password?{" "}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Back to login
          </a>
        </p>
      </form>
    </div>
  );
}
