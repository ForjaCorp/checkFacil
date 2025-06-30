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
    <div className="flex h-screen w-full">
      <SideBar />

      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 pb-16 md:px-6 lg:px-8 lg:pb-6">
            <Outlet />
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNavBar />
        </div>
      </div>
    </div>
  )
}
