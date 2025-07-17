import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { GuestFilterOptions } from '@/types/guest'

interface SearchAndFilterBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  filterOptions: GuestFilterOptions[]
  selectedFilter: string
  onFilterChange: (value: string) => void
  searchPlaceholder?: string
  filterPlaceholder?: string
  className?: string
}

export function SearchAndFilterBar({
  searchTerm,
  onSearchChange,
  filterOptions,
  selectedFilter,
  onFilterChange,
  searchPlaceholder = 'Buscar...',
  filterPlaceholder = 'Filtrar por...',
  className = '',
}: SearchAndFilterBarProps) {
  return (
    <div className={`grid gap-4 ${className}`}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={filterPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
