import { createContext, useContext } from 'react'

export const USER_ROLES = ['Adm_espaco', 'Adm_festa'] as const

export type UserRole = (typeof USER_ROLES)[number]

export interface AuthenticatedUser {
  id: string
  email: string
  name?: string
  userType: UserRole
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthenticatedUser | null | undefined
  token?: string | null
  isLoading: boolean
}

export interface AuthContextType extends AuthState {
  login: (userData: AuthenticatedUser, token?: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Custom hook to access the authentication context.
 *
 * This hook provides access to the AuthContext, which contains
 * authentication state and functions such as `login` and `logout`.
 *
 * @throws Will throw an error if used outside of an AuthProvider.
 * @returns {AuthContextType} The authentication context value.
 */

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
