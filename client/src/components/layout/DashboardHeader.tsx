import type { ReactNode } from 'react'

interface DashboardHeaderProps {
  title: string
  subtitle: string
  action?: ReactNode
}

export function DashboardHeader({ title, subtitle, action }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-lg text-muted-foreground">{subtitle}</p>
      </div>
      {action && <div className="w-full md:w-auto">{action}</div>}
    </header>
  )
}
