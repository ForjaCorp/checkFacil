import { createContext } from 'react'

export interface PageHeaderContextType {
  title: string | null
  setTitle: (title: string | null) => void
}

export const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined)
