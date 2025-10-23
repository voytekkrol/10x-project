/**
 * Navigation Bar Component
 * 
 * Main navigation bar displayed on authenticated pages
 * Shows user email and logout button
 */

import { useState } from "react";
import { Button } from "../ui/button";

interface NavigationBarProps {
  userEmail?: string;
}

export function NavigationBar({ userEmail = "user@example.com" }: NavigationBarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Note: In a real implementation, this would call supabase.auth.signOut()
    // But as per instructions, we're not implementing backend functionality yet
    
    // Simulate loading state for UI demonstration purposes
    setTimeout(() => {
      if (import.meta.env.DEV) {
        window.location.href = "/auth/login";
      }
      setIsLoggingOut(false);
    }, 500);
  };

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and name */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">10x</span>
              </div>
              <span className="text-lg font-semibold text-foreground">Cards</span>
            </a>
          </div>
          
          {/* Navigation links - can be expanded later */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <a 
                href="/generate" 
                className="text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Generate
              </a>
              {/* Additional nav links would go here */}
            </div>
          </div>
          
          {/* User menu and logout button */}
          <div className="flex items-center gap-4">
            {/* User email display */}
            <span className="text-sm text-muted-foreground hidden sm:block">
              {userEmail}
            </span>
            
            {/* Logout button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                  <span className="sr-only">Logging out...</span>
                </>
              ) : (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className="w-4 h-4 mr-1"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" 
                      clipRule="evenodd" 
                    />
                    <path 
                      fillRule="evenodd" 
                      d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  Log out
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}


