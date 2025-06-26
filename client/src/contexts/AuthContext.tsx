import { useState, useEffect, type ReactNode } from 'react'

import {
  AuthContext,
  type AuthenticatedUser,
  type AuthState,
  type AuthContextType,
} from '@/contexts/authContextCore'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provides authentication context to its children components.
 *
 * This component initializes and maintains the authentication state
 * by storing and retrieving user data and token from localStorage.
 * It provides `login` and `logout` functions to manage user
 * authentication status and updates the context accordingly.
 *
 * @param {AuthProviderProps} props - Props containing children components.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: undefined,
    token: null,
  })

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('userToken')
      const storedUserJSON = localStorage.getItem('user')

      if (storedToken && storedUserJSON) {
        const storedUser: AuthenticatedUser = JSON.parse(storedUserJSON)
        setAuthState({
          isAuthenticated: true,
          user: storedUser,
          token: storedToken,
        })
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
        })
      }
    } catch (error) {
      console.error('AuthProvider: Erro ao restaurar sessão:', error)
      setAuthState({ isAuthenticated: false, user: null, token: null })
    }
  }, [])

  /**
   * Sets the authentication state to true and stores user data and
   * token in localStorage.
   * @param {AuthenticatedUser} userData - User data to be stored.
   * @param {string} [token] - Token to be stored.
   */
  const login = (userData: AuthenticatedUser, token?: string) => {
    setAuthState({
      isAuthenticated: true,
      user: userData,
      token: token || null,
    })
    localStorage.setItem('user', JSON.stringify(userData))
    if (token) {
      localStorage.setItem('userToken', token)
    }
  }

  /**
   * Logs out the user by clearing the authentication state and removing
   * user data and token from localStorage.
   *
   * This function sets the `isAuthenticated` state to false and nullifies
   * the `user` and `token` in the authentication state, effectively logging
   * out the current user. It also removes the stored user data and token
   * from localStorage to ensure no session data is retained.
   */
  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    })
    localStorage.removeItem('user')
    localStorage.removeItem('userToken')
  }

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
