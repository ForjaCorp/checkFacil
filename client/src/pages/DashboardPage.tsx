import { useState } from 'react'

import { EventSection } from '@/components/events/EventSection'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { dashboardConfig } from '@/config/dashboardConfig'
import { useAuth } from '@/contexts/authContextCore'
import { useFetchEvents } from '@/hooks/useFetchEvents'

export default function DashboardPage() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)

  const userRole = user?.userType
  const config = userRole ? dashboardConfig[userRole] : null
  const fetchOptions = config ? { ...config.fetchOptions, page: currentPage, limit: 6 } : {}

  const { events, isLoading, pagination } = useFetchEvents(fetchOptions)

  if (!user || !config) {
    return null
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page)
    }
  }

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
        footer={
          pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(currentPage - 1)
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageChange(currentPage + 1)
                    }}
                    className={
                      currentPage === pagination.totalPages
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )
        }
      />
    </div>
  )
}
