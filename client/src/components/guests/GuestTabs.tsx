import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type GuestTab = 'todos' | 'criancas' | 'adultos'

const guestTabs: GuestTab[] = ['todos', 'adultos', 'criancas']

function isGuestTab(value: string): value is GuestTab {
  return guestTabs.includes(value as GuestTab)
}

interface GuestTabsProps {
  activeTab: GuestTab
  onTabChange: (value: GuestTab) => void
  counts: {
    todos: number
    criancas: number
    adultos: number
  }
  className?: string
}

export function GuestTabs({ activeTab, onTabChange, counts, className }: GuestTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (isGuestTab(value)) {
          onTabChange(value)
        }
      }}
      className={className}
    >
      <TabsList className="h-auto w-full flex-wrap justify-start gap-2 border-none bg-transparent p-0">
        <TabsTrigger
          value="todos"
          className="rounded-full border border-transparent bg-gray-100 px-4 py-2 text-muted-foreground hover:bg-gray-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
        >
          Todos{' '}
          <span className="ml-2 min-w-[20px] rounded-full bg-black/10 px-2 py-0.5 text-center text-xs font-bold">
            {counts.todos}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="adultos"
          className="rounded-full border border-transparent bg-gray-100 px-4 py-2 text-muted-foreground hover:bg-gray-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
        >
          Adultos{' '}
          <span className="ml-2 min-w-[20px] rounded-full bg-black/10 px-2 py-0.5 text-center text-xs font-bold">
            {counts.adultos}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="criancas"
          className="rounded-full border border-transparent bg-gray-100 px-4 py-2 text-muted-foreground hover:bg-gray-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
        >
          Crianças{' '}
          <span className="ml-2 min-w-[20px] rounded-full bg-black/10 px-2 py-0.5 text-center text-xs font-bold">
            {counts.criancas}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
