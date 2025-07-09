import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGuestConfirmationFlow } from '@/hooks/useGuestConfirmationFlow'; // Importando nosso novo hook

import { AddChildrenStep } from './steps/AddChildrenStep';
import { CompanionStep } from './steps/CompanionStep';
import { ConfirmResponsibleStep } from './steps/ConfirmResponsibleStep';
import { FinalConfirmationStep } from './steps/FinalConfirmationStep';
import { SuccessStep } from './steps/SuccessStep';

export default function ConfirmChildrenFlowPage() {
  const {
    currentStep,
    eventData,
    flowState,
    isPending,
    childrenNeedingCompanion,
    handleNextFromResponsible,
    handleNextFromChildren,
    handleSubmitFlow,
    setCurrentStep,
  } = useGuestConfirmationFlow();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      {currentStep === 'RESPONSIBLE' && (
        <ConfirmResponsibleStep
          onNext={handleNextFromResponsible}
          initialData={flowState.responsible}
        />
      )}
      {currentStep === 'CHILDREN' && (
        <AddChildrenStep onNext={handleNextFromChildren} onBack={() => setCurrentStep('RESPONSIBLE')} />
      )}
      {currentStep === 'COMPANION' && (
        <CompanionStep
          onFinalSubmit={(data) => handleSubmitFlow(data)}
          onBack={() => setCurrentStep('CHILDREN')}
          childrenNeedingCompanion={childrenNeedingCompanion}
          isSubmitting={isPending}
        />
      )}
      {currentStep === 'FINAL_CONFIRMATION' && (
        <FinalConfirmationStep
          onSubmit={(isAttending) => handleSubmitFlow(null, isAttending)}
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
              Não foi possível confirmar a presença. Por favor, tente novamente mais tarde ou contate o
              organizador da festa.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
