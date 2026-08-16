import { Check, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'

import { StepHeader } from '@/components/common/StepHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

import { type SavedDependent } from './ConfirmResponsibleStep'

interface Props {
  dependents: SavedDependent[]
  onBack: () => void
  onAddNew: () => void
  onContinue: (selected: SavedDependent[]) => void
}

const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')

export function SelectFamilyStep({ dependents, onBack, onAddNew, onContinue }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const toggle = (id: number) => setSelectedIds((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
  )
  return (
    <Card className="w-full max-w-lg">
      <StepHeader title="Quem vai desta vez?" description="Marque somente as crianças que irão a esta festa." onBack={onBack} />
      <CardContent className="space-y-4">
        {dependents.map((dependent) => {
          const selected = selectedIds.includes(dependent.id)
          return (
            <button type="button" key={dependent.id} onClick={() => toggle(dependent.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}>
              <Checkbox checked={selected} aria-label={`Selecionar ${dependent.nome}`} />
              <span className="flex-1"><span className="block font-semibold">{dependent.nome}</span>
                <span className="text-sm text-muted-foreground">Nascimento: {formatDate(dependent.data_nascimento)}</span></span>
              {selected && <Check className="h-5 w-5 text-primary" />}
            </button>
          )
        })}
        <Button type="button" variant="outline" className="w-full" onClick={onAddNew}><Plus className="mr-2 h-4 w-4" />Adicionar outra criança</Button>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Pencil className="h-3.5 w-3.5" />Você poderá revisar os dados antes de confirmar.</p>
        <Button className="w-full" disabled={selectedIds.length === 0}
          onClick={() => onContinue(dependents.filter((item) => selectedIds.includes(item.id)))}>
          Continuar com {selectedIds.length} selecionada(s)
        </Button>
      </CardContent>
    </Card>
  )
}
