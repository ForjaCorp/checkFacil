import { useEffect } from 'react'
import { toast } from 'sonner'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGuestConfirmationFlow } from '@/hooks/useGuestConfirmationFlow'
import { usePageHeader } from '@/hooks/usePageHeader'

import { AddChildrenStep } from './steps/AddChildrenStep'
import { CompanionStep } from './steps/CompanionStep'
import { ConfirmResponsibleStep } from './steps/ConfirmResponsibleStep'
import { FinalConfirmationStep } from './steps/FinalConfirmationStep'
import { SuccessStep } from './steps/SuccessStep'

export type ChildNeedingCompanion = {
  name: string
  reason: string
}

export default function ConfirmChildrenFlowPage() {
  const {
    currentStep,
    eventData,
    flowState,
    isPending,
    childrenNeedingCompanion,
    handleNextFromResponsible,
    handleNextFromChildren,
    submitGuests,
    setCurrentStep,
  } = useGuestConfirmationFlow()

  const { setTitle } = usePageHeader()

  useEffect(() => {
    if (eventData?.nome_festa) {
      setTitle(`Festa de ${eventData.nome_festa}`)
    }
    return () => setTitle(null)
  }, [eventData, setTitle])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-0">
      {currentStep === 'RESPONSIBLE' && (
        <ConfirmResponsibleStep
          onNext={handleNextFromResponsible}
          initialData={flowState.responsible}
        />
      )}
      {currentStep === 'CHILDREN' && (
        <AddChildrenStep
          onNext={handleNextFromChildren}
          onBack={() => setCurrentStep('RESPONSIBLE')}
          initialData={flowState.children ? { children: flowState.children } : undefined}
        />
      )}
      {currentStep === 'COMPANION' && (
        <CompanionStep
          onFinalSubmit={(data) => submitGuests(data)}
          onBack={() => setCurrentStep('CHILDREN')}
          childrenNeedingCompanion={childrenNeedingCompanion}
          isSubmitting={isPending}
          responsibleName={flowState.responsible?.responsibleName}
        />
      )}
      {currentStep === 'FINAL_CONFIRMATION' && (
        <FinalConfirmationStep
          onSubmit={(isAttending) => {
            const payload = {
              responsible: flowState.responsible,
              children: flowState.children,
              isAttending,
            }
            if (payload.responsible && payload.children) {
              submitGuests(payload)
            } else {
              toast.error('Erro: dados de confirmação de presença inválidos')
            }
          }}
          onBack={() => setCurrentStep('CHILDREN')}
          childrenData={flowState.children!}
          isSubmitting={isPending}
        />
      )}
      {currentStep === 'SUCCESS' && eventData && <SuccessStep event={eventData} />}
      {currentStep === 'ERROR' && (
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Ocorreu um Erro</CardTitle>
            <CardDescription>
              Não foi possível confirmar a presença. Por favor, tente novamente mais tarde ou
              contate o organizador da festa.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
