import { User, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AddAdultsWalkinForm } from '@/components/guests/AddAdultsWalkinForm'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGuestConfirmationFlow } from '@/hooks/useGuestConfirmationFlow'
import { AddChildrenStep } from '@/pages/guest/steps/AddChildrenStep'
import { CompanionStep, type CompanionStepValues } from '@/pages/guest/steps/CompanionStep'
import { ConfirmResponsibleStep } from '@/pages/guest/steps/ConfirmResponsibleStep'
import { FinalConfirmationStep } from '@/pages/guest/steps/FinalConfirmationStep'

interface WalkinGuestRegistrationProps {
  onSuccess: () => void
}

function ChoiceCard({
  onClick,
  icon,
  title,
  description,
}: {
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="group cursor-pointer rounded-lg border p-6 text-center transition-colors hover:border-primary hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

interface GroupWithChildrenFlowProps {
  onSuccess: () => void
  onBack: () => void
}

function GroupWithChildrenFlow({ onSuccess: _onSuccess, onBack }: GroupWithChildrenFlowProps) {
  const onSuccessRef = useRef(_onSuccess)
  onSuccessRef.current = _onSuccess
  
  const {
    currentStep,
    flowState,
    isPending,
    childrenNeedingCompanion,
    handleNextFromResponsible,
    handleNextFromChildren,
    handleGroupSubmit,
    setCurrentStep,
  } = useGuestConfirmationFlow()

  // Efeito para chamar onSuccess quando o fluxo for concluído com sucesso
  useEffect(() => {
    if (currentStep === 'SUCCESS') {
      onSuccessRef.current()
    }
  }, [currentStep])

  const handleFamilySubmit = (
    companionStepData: CompanionStepValues | null,
    responsibleIsAttending?: boolean,
  ) => {
    const { responsible, children } = flowState
    if (!responsible || !children) return

    // Se não houver dados do acompanhante e o responsável não estiver comparecendo, não faz nada
    if (!companionStepData && !responsibleIsAttending) return

    // Prepara os dados do acompanhante para envio
    const companionData: CompanionStepValues = {
      companionType: responsibleIsAttending ? 'myself' : (companionStepData?.companionType || 'other'),
      isNanny: companionStepData?.isNanny || false,
      otherCompanionName: companionStepData?.otherCompanionName || '',
      otherCompanionPhone: companionStepData?.otherCompanionPhone || '',
    }

    // Envia os dados para o hook de confirmação
    handleGroupSubmit(companionData, responsibleIsAttending)
  }

  switch (currentStep) {
    case 'RESPONSIBLE':
      return (
        <ConfirmResponsibleStep
          onNext={handleNextFromResponsible}
          onBack={onBack}
          initialData={flowState.responsible}
        />
      )
    case 'CHILDREN':
      return (
        <AddChildrenStep
          onNext={handleNextFromChildren}
          onBack={() => setCurrentStep('RESPONSIBLE')}
          initialData={flowState.children ? { children: flowState.children } : undefined}
        />
      )
    case 'COMPANION':
      return (
        <CompanionStep
          onFinalSubmit={(data) => handleFamilySubmit(data, undefined)}
          onBack={() => setCurrentStep('CHILDREN')}
          childrenNeedingCompanion={childrenNeedingCompanion}
          isSubmitting={isPending}
          responsibleName={flowState.responsible?.responsibleName}
        />
      )
    case 'FINAL_CONFIRMATION':
      return (
        <FinalConfirmationStep
          onSubmit={(isAttending) => handleFamilySubmit(null, isAttending)}
          onBack={() => setCurrentStep('CHILDREN')}
          childrenData={flowState.children!}
          isSubmitting={isPending}
        />
      )
    case 'SUCCESS':
      return null
    case 'ERROR':
      return (
        <Card className="w-full text-center border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Ocorreu um Erro</CardTitle>
            <CardDescription>Não foi possível cadastrar o grupo. Tente novamente.</CardDescription>
          </CardHeader>
        </Card>
      )
    default:
      return (
        <ConfirmResponsibleStep 
          onNext={handleNextFromResponsible} 
          onBack={onBack}
          initialData={flowState.responsible}
        />
      )
  }
}

export function WalkinGuestRegistration({ onSuccess }: WalkinGuestRegistrationProps) {
  const [flowType, setFlowType] = useState<'selection' | 'adults' | 'family'>('selection')
  
  // Adiciona efeito para lidar com a tecla Escape globalmente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFlowType('selection')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (flowType === 'adults') {
    return <AddAdultsWalkinForm onSuccess={onSuccess} onBack={() => setFlowType('selection')} />
  }

  if (flowType === 'family') {
    return <GroupWithChildrenFlow onSuccess={onSuccess} onBack={() => setFlowType('selection')} />
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4" 
      role="region"
      aria-label="Opções de cadastro de convidados"
    >
      <ChoiceCard
        onClick={() => {
          setFlowType('adults')
        }}
        icon={<User className="size-6" />}
        title="Adicionar Adulto(s)"
        description="Para um ou mais convidados que não são responsáveis por crianças."
      />
      <ChoiceCard
        onClick={() => {
          setFlowType('family')
        }}
        icon={<Users className="size-6" />}
        title="Adicionar Grupo com Criança(s)"
        description="Para um ou mais convidados onde pelo menos um é criança."
      />
    </div>
  )
}
