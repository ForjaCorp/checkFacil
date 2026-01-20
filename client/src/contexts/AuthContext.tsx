import axios from 'axios'
import { useState, useEffect, type ReactNode, useCallback } from 'react'

import {
  AuthContext,
  type AuthenticatedUser,
  type AuthState,
  type AuthContextType,
} from '@/contexts/authContextCore'
import api from '@/services/api'

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
    isLoading: true,
  })

  const logout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    })
    localStorage.removeItem('user')
    localStorage.removeItem('userToken')
  }, [])

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('userToken')

      if (!storedToken) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        })
        return
      }

      try {
        const response = await api.get('/auth/me')
        const { usuario } = response.data

        const authenticatedUser: AuthenticatedUser = {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          userType: usuario.tipoUsuario,
        }

        setAuthState({
          isAuthenticated: true,
          user: authenticatedUser,
          token: storedToken,
          isLoading: false,
        })
        localStorage.setItem('user', JSON.stringify(usuario))
      } catch (error: unknown) {
        console.error('Falha na validação da sessão, deslogando:', {
          message: axios.isAxiosError(error) ? error.message : 'Erro desconhecido',
          response: axios.isAxiosError(error) ? error.response?.data : undefined,
          status: axios.isAxiosError(error) ? error.response?.status : undefined,
        })
        logout()
      }
    }

    validateToken()
  }, [logout])

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
      isLoading: false,
    })
    localStorage.setItem('user', JSON.stringify(userData))
    if (token) {
      localStorage.setItem('userToken', token)
    }
  }

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
