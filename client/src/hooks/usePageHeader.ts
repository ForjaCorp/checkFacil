import { useContext } from 'react'

import { PageHeaderContext } from '@/contexts/PageHeaderContext'

export function usePageHeader() {
  const context = useContext(PageHeaderContext)
  if (context === undefined) {
    throw new Error('usePageHeader deve ser usado dentro de um PageHeaderProvider')
  }
  return context
}
