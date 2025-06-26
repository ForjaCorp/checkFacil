import { EventSection } from '@/components/events/EventSection'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { dashboardConfig } from '@/config/dashboardConfig'
import { useAuth } from '@/contexts/authContextCore'
import { useFetchEvents } from '@/hooks/useFetchEvents'

export default function DashboardPage() {
  const { user } = useAuth()
  const userRole = user?.userType

  const { events, isLoading } = useFetchEvents(
    userRole ? dashboardConfig[userRole]?.fetchOptions : {},
  )

  if (!user || !userRole || !dashboardConfig[userRole]) {
    return null
  }

  const config = dashboardConfig[userRole]

  return (
    <div className="flex flex-col gap-6 h-full py-6">
      <DashboardHeader
        title={config.header.title}
        subtitle={config.header.getSubtitle(user.name || user.email)}
        action={config.header.action}
      />

      <EventSection
        isLoading={isLoading}
        events={events}
        sectionTitle={config.events.sectionTitle}
        emptyStateTitle={config.events.emptyStateTitle}
        emptyStateDescription={config.events.emptyStateDescription}
        cardVariant={config.events.cardVariant}
      />
    </div>
  )
}
