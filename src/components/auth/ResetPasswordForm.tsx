/**
 * Reset Password Form Component
 *
 * Form for setting a new password with confirmation and validation
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { getSupabaseBrowser } from "../../lib/utils/supabase-browser";
import { ResetPasswordFormSchema } from "../../lib/validation/auth.schemas";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);

    // Validate with Zod schema
    const result = ResetPasswordFormSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      const firstError = fieldErrors.password?.[0] || fieldErrors.confirmPassword?.[0] || "Invalid form data";
      setError(firstError);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowser();

      console.log("Updating user password...");

      // Update the user's password
      // The session should already be established from the password reset link
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        setError(updateError.message || "Failed to reset password. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        console.error("No user returned after password update");
        setError("Session expired. Please request a new password reset link.");
        setIsLoading(false);
        return;
      }

      // Success!
      console.log("Password updated successfully for user:", data.user.id);
      setIsLoading(false);
      setSuccess(true);

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (err) {
      console.error("Unexpected error during password reset:", err);
      setError("Connection error. Please check your internet and try again.");
      setIsLoading(false);
    }
  };

  // If password was reset successfully, show confirmation message
  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-8 text-green-600 dark:text-green-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground">Password Changed Successfully</h3>
        <p className="text-muted-foreground">
          Your password has been updated. You can now log in with your new password.
        </p>
        <Button asChild className="mt-4">
          <a href="/auth/login">Go to Login</a>
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
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Password Reset Failed</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">Enter your new password below to reset your account password.</p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
            className={cn(
              "w-full px-3 py-2 rounded-md border text-sm",
              "bg-background text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            aria-describedby={error ? "reset-password-error" : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters and include uppercase, lowercase, and numbers.
          </p>
        </div>

        {/* Confirm Password field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
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
              Resetting Password...
            </>
          ) : (
            "Reset Password"
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
