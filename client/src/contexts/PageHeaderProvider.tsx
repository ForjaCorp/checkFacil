import { useState, type ReactNode } from 'react'

import { PageHeaderContext } from '@/contexts/PageHeaderContext'

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)

  return (
    <PageHeaderContext.Provider value={{ title, setTitle }}>{children}</PageHeaderContext.Provider>
  )
}
