// client/src/components/layout/DashboardFilters.tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import type { DateRange } from 'react-day-picker'

interface DashboardFiltersProps {
  statusFilter: string
  setStatusFilter: (value: string) => void
  dateRange: DateRange | undefined
  setDateRange: (value: DateRange | undefined) => void
  applyCategoryFilter: (category: 'this_month' | 'upcoming' | 'completed') => void
  activeCategory: 'this_month' | 'upcoming' | 'completed' | null
  clearFilters: () => void
}

function FilterControls({
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  applyCategoryFilter,
  activeCategory,
  clearFilters,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          variant={activeCategory === 'this_month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyCategoryFilter('this_month')}
        >
          Festas do Mês
        </Button>
        <Button
          variant={activeCategory === 'upcoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyCategoryFilter('upcoming')}
        >
          Próximas Festas
        </Button>
        <Button
          variant={activeCategory === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyCategoryFilter('completed')}
        >
          Festas Concluídas
        </Button>
      </div>

      {/* Filtros Detalhados */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos os Status</SelectItem>
          <SelectItem value="RASCUNHO">Pendente</SelectItem>
          <SelectItem value="PRONTA">Confirmada</SelectItem>
          <SelectItem value="EM_ANDAMENTO">Ao Vivo</SelectItem>
          <SelectItem value="CONCLUIDA">Finalizada</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y', { locale: ptBR })} -{' '}
                  {format(dateRange.to, 'LLL dd, y', { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y', { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        onClick={clearFilters}
        className="text-destructive hover:text-destructive/80"
      >
        <X className="mr-2 h-4 w-4" />
        Limpar Filtros
      </Button>
    </div>
  )
}

export function DashboardFilters(props: DashboardFiltersProps) {
  return (
    <>
      {/* Layout para Mobile (dentro de um Sheet) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Mais Filtros
            </Button>
          </SheetTrigger>
          <SheetContent className="p-6">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Refine sua busca para encontrar os eventos que procura.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterControls {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Layout para Desktop */}
      <div className="hidden md:flex flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={props.activeCategory === 'this_month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => props.applyCategoryFilter('this_month')}
          >
            Festas do Mês
          </Button>
          <Button
            variant={props.activeCategory === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => props.applyCategoryFilter('upcoming')}
          >
            Próximas Festas
          </Button>
          <Button
            variant={props.activeCategory === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => props.applyCategoryFilter('completed')}
          >
            Festas Concluídas
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={props.statusFilter} onValueChange={props.setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os Status</SelectItem>
              <SelectItem value="RASCUNHO">Pendente</SelectItem>
              <SelectItem value="PRONTA">Confirmada</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Ao Vivo</SelectItem>
              <SelectItem value="CONCLUIDA">Finalizada</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[300px] justify-start text-left font-normal',
                  !props.dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {props.dateRange?.from ? (
                  props.dateRange.to ? (
                    <>
                      {format(props.dateRange.from, 'LLL dd, y', { locale: ptBR })} -{' '}
                      {format(props.dateRange.to, 'LLL dd, y', { locale: ptBR })}
                    </>
                  ) : (
                    format(props.dateRange.from, 'LLL dd, y', { locale: ptBR })
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={props.dateRange?.from}
                selected={props.dateRange}
                onSelect={props.setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            onClick={props.clearFilters}
            size="icon"
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Limpar Filtros</span>
          </Button>
        </div>
      </div>
    </>
  )
}
