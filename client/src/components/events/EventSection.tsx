import { Loader2 } from 'lucide-react'

import { EmptyStateCard } from '@/components/events/EmptyStateCard'
import { EventCard } from '@/components/events/EventCard'

import type { AppEvent } from '@/types'

interface EventSectionProps {
  isLoading: boolean
  events: AppEvent[]
  sectionTitle: string
  emptyStateTitle: string
  emptyStateDescription: string
  cardVariant: 'staff' | 'organizer'
}

export function EventSection({
  isLoading,
  events,
  sectionTitle,
  emptyStateTitle,
  emptyStateDescription,
  cardVariant,
}: EventSectionProps) {
  return (
    <section className="flex flex-col gap-4 flex-grow">
      <h2 className="text-2xl font-semibold text-foreground">{sectionTitle}</h2>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {events.map((event) => (
            <EventCard key={event.id} event={event} variant={cardVariant} />
          ))}
        </div>
      ) : (
        <EmptyStateCard title={emptyStateTitle} description={emptyStateDescription} />
      )}
    </section>
  )
}
