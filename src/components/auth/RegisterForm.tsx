/**
 * Register Form Component
 * 
 * Registration form with email, password, confirmation and validation
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous states
    setError(null);
    setSuccess(false);
    
    // Form validation (simple client-side checks)
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (!password) {
      setError("Password is required");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (!hasUppercase(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    
    if (!hasLowercase(password)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }
    
    if (!hasDigit(password)) {
      setError("Password must contain at least one number");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords must match");
      return;
    }

    setIsLoading(true);
    
    // Note: In a real implementation, this would call supabase.auth.signUp()
    // But as per instructions, we're not implementing backend functionality yet
    
    // Simulate loading state for UI demonstration purposes
    setTimeout(() => {
      setIsLoading(false);
      
      // For demo purposes, show success state
      if (import.meta.env.DEV) {
        setSuccess(true);
      }
    }, 1500);
  };
  
  // Simple validation helpers
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const hasUppercase = (str: string) => {
    return /[A-Z]/.test(str);
  };
  
  const hasLowercase = (str: string) => {
    return /[a-z]/.test(str);
  };
  
  const hasDigit = (str: string) => {
    return /[0-9]/.test(str);
  };

  // If registration was successful, show confirmation message
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
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground">Account created!</h3>
        <p className="text-muted-foreground">
          Please check your email to confirm your registration.
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
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Registration Failed</p>
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
            aria-describedby={error ? "register-error" : undefined}
          />
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Password
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
          />
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters and include uppercase, lowercase, and numbers.
          </p>
        </div>
        
        {/* Confirm Password field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Confirm Password
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
              Registering...
            </>
          ) : (
            "Register"
          )}
        </Button>

        {/* Login link */}
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}

