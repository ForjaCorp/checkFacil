interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="hidden lg:block mb-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      {description && <p className="text-lg text-muted-foreground mt-1">{description}</p>}
    </header>
  )
}
