import { Loader2, PartyPopper } from 'lucide-react'
import { useState } from 'react'

import { StepHeader } from '@/components/common/StepHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type AddChildrenStepValues } from '@/pages/guest/steps/AddChildrenStep'

interface FinalConfirmationStepProps {
  onSubmit: (isAttending: boolean) => void
  onBack: () => void
  childrenData: AddChildrenStepValues['children']
  isSubmitting: boolean
}

export function FinalConfirmationStep({
  onSubmit,
  onBack,
  childrenData,
  isSubmitting,
}: FinalConfirmationStepProps) {
  const [isConfirmingYes, setIsConfirmingYes] = useState(false)
  const [isConfirmingNo, setIsConfirmingNo] = useState(false)
  const childrenNames = childrenData.map((c) => c.name).join(', ')

  const handleConfirmYes = () => {
    setIsConfirmingYes(true)
    onSubmit(true)
  }

  const handleConfirmNo = () => {
    setIsConfirmingNo(true)
    onSubmit(false)
  }

  return (
    <Card className="w-full max-w-lg">
<StepHeader
        title="Quase lá!"
        description={`A presença de ${childrenNames} está pronta para ser confirmada. Só mais uma pergunta:`}
        onBack={onBack}
        // Passe o ícone com um tamanho menor para o alinhamento
        icon={<PartyPopper className="h-8 w-8" />}
      />
      <CardContent className="space-y-4">
        <p className="text-center font-semibold">Você (o responsável) também irá à festa?</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-16"
            onClick={handleConfirmYes}
            disabled={isConfirmingYes || isSubmitting}
          >
            {isConfirmingYes || isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Sim, estarei presente'
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-16"
            onClick={handleConfirmNo}
            disabled={isConfirmingNo || isSubmitting}
          >
            {isConfirmingNo || isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Não, apenas as crianças'
            )}
          </Button>
        </div>
        <Button variant="ghost" className="w-full" onClick={onBack} disabled={isSubmitting}>
          Voltar
        </Button>
      </CardContent>
    </Card>
  )
}
