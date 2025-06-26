import { Outlet } from 'react-router-dom'

import { BottomNavBar } from '@/components/layout/BottomNavBar'
import { SideBar } from '@/components/layout/SideBar'

/**
 * Renders the application layout with a sidebar and bottom navigation bar.
 *
 * This layout adapts for different screen sizes: it shows a sidebar on large
 * screens and a bottom navigation bar on smaller screens. The main content
 * is rendered in a scrollable area between these components.
 *
 * @returns The AppLayout component.
 */
export function AppLayout() {
  return (
    <div className="grid h-screen w-full lg:grid-cols-[280px_1fr]">
      <SideBar />

      <div className="flex flex-col relative">
        <main className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>

        <div className="lg:hidden">
          <BottomNavBar />
        </div>
      </div>
    </div>
  )
}
