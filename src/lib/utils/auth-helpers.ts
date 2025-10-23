/**
 * Auth Helpers
 * 
 * Utility functions for authentication-related operations
 */

import type { Session, User } from '@supabase/supabase-js';

/**
 * Check if a session indicates the user is authenticated
 */
export function isAuthenticated(session: Session | null): boolean {
  return !!session;
}

/**
 * Get user ID from session, throws if not available
 */
export function getUserId(session: Session | null): string {
  if (!session?.user?.id) {
    throw new Error('User ID not found in session');
  }
  return session.user.id;
}

/**
 * Get user email from user object
 */
export function getUserEmail(user: User | null): string | null {
  return user?.email || null;
}

/**
 * Validate and sanitize a redirect path to prevent open redirect vulnerabilities
 */
export function validateRedirectPath(path: string | null): string {
  if (!path) {
    return '/generate';
  }
  
  // Basic validation to ensure the path is relative
  // and doesn't try to redirect to external sites
  if (path.startsWith('/') && !path.includes('://')) {
    // List of allowed paths
    const allowedPaths = ['/generate'];
    
    // Check if the path or its root is in allowed paths
    const rootPath = '/' + path.split('/')[1];
    if (allowedPaths.includes(path) || allowedPaths.includes(rootPath)) {
      return path;
    }
  }
  
  // Default to generate page if path is invalid
  return '/generate';
}

/**
 * Map auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password',
    'email_not_confirmed': 'Please confirm your email before logging in',
    'user_already_exists': 'This email is already registered',
    'weak_password': 'Password does not meet security requirements',
    'invalid_grant': 'Reset link has expired or is invalid',
    '429': 'Too many attempts. Please try again later',
  };
  
  return errorMessages[errorCode] || 'Authentication error. Please try again.';
}
