/**
 * ==============================================================================
 * File: src/hooks/useAuth.js
 * Description: Custom Hook for Easy Access to Authentication Context
 * 
 * Provides:
 * - `currentUser`: The currently signed-in user object or null.
 * - `loading`: Boolean indicating whether initial auth verification is active.
 * - `isAuthenticated`: Convenience boolean flag.
 * - `login(email, password)`: Function to perform admin sign-in.
 * - `logout()`: Function to log out.
 * ==============================================================================
 */

import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};

export default useAuth;
