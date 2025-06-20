import { useState, useEffect } from 'react'

import { AuthContext, type AuthenticatedUser, type AuthState } from './authContextCore'

import type { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Componente que fornece o contexto de autentica o para a aplica o.
 *
 * Verifica se o usuário está logado e restaura o estado de autentica o
 * com base nos dados armazenados no localStorage.
 *
 * Exibe um estado de carregamento inicial enquanto verifica o estado de
 * autenticação.
 *
 * Fornece as funções `login` e `logout` para gerenciar o estado de
 * autenticação.
 *
 * @example
 *
 **/
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  })
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const minimumDisplayTime = 1500

    const checkAuthStatus = async () => {
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
        }
      } catch (error) {
        console.error('AuthProvider: Erro ao restaurar sessão:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('userToken')
      }
    }

    const timerPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, minimumDisplayTime)
    })

    const authCheckPromise = checkAuthStatus()

    Promise.all([authCheckPromise, timerPromise]).then(() => {
      setInitialLoading(false)
    })
  }, [])

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

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    })
    localStorage.removeItem('user')
    localStorage.removeItem('userToken')
  }

  const value = {
    ...authState,
    initialLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
