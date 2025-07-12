import { Outlet } from 'react-router-dom'

import { MobileHeader } from '@/components/layout/MobileHeader'

export function PublicLayout() {
  return (
    <>
      <MobileHeader />
      <main className="pt-16 md:pt-0">
        <Outlet />
      </main>
    </>
  )
}
