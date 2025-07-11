import { User, Users } from 'lucide-react'
import { useState } from 'react'

import { AddAdultsWalkinForm } from '@/components/guests/AddAdultsWalkinForm'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGuestConfirmationFlow } from '@/hooks/useGuestConfirmationFlow'
import { unformatPhoneNumber } from '@/lib/phoneUtils'
import { AddChildrenStep, type AddChildrenStepValues } from '@/pages/guest/steps/AddChildrenStep'
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

function GroupWithChildrenFlow({ onSuccess }: { onSuccess: () => void }) {
  const {
    currentStep,
    flowState,
    isPending,
    childrenNeedingCompanion,
    handleNextFromResponsible,
    handleNextFromChildren,
    submitGuests,
    setCurrentStep,
  } = useGuestConfirmationFlow()

  const handleFamilySubmit = (
    companionData: CompanionStepValues | null,
    responsibleIsAttending?: boolean,
  ) => {
    const { responsible, children } = flowState
    if (!responsible || !children) return

    const allGuests: object[] = children.map((child: AddChildrenStepValues['children'][0]) => ({
      nome: child.name,
      tipo_convidado: 'CRIANCA_PAGANTE',
      dataNascimento: child.dob!.toISOString().split('T')[0],
      isCriancaAtipica: child.isAtypical,
      cadastrado_na_hora: true,
    }))

    if (companionData?.companionType === 'myself' || responsibleIsAttending) {
      allGuests.push({
        nome: responsible.responsibleName,
        tipo_convidado: 'ADULTO_PAGANTE',
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
        cadastrado_na_hora: true,
      })
    } else if (companionData?.companionType === 'other' && companionData.otherCompanionName) {
      allGuests.push({
        nome: companionData.otherCompanionName,
        tipo_convidado: companionData.isNanny ? 'BABA' : 'ACOMPANHANTE_ATIPICO',
        telefone: unformatPhoneNumber(companionData.otherCompanionPhone),
        cadastrado_na_hora: true,
      })
    }

    const payload = {
      contatoResponsavel: {
        nome: responsible.responsibleName,
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
      },
      convidados: allGuests,
    }

    submitGuests(payload, { onSuccess })
  }

  switch (currentStep) {
    case 'RESPONSIBLE':
      return (
        <ConfirmResponsibleStep
          onNext={handleNextFromResponsible}
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
      return <ConfirmResponsibleStep onNext={handleNextFromResponsible} />
  }
}

export function WalkinGuestRegistration({ onSuccess }: WalkinGuestRegistrationProps) {
  const [flowType, setFlowType] = useState<'selection' | 'adults' | 'family'>('selection')

  if (flowType === 'adults') {
    return <AddAdultsWalkinForm onSuccess={onSuccess} />
  }

  if (flowType === 'family') {
    return <GroupWithChildrenFlow onSuccess={onSuccess} />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      <ChoiceCard
        onClick={() => setFlowType('adults')}
        icon={<User className="size-6" />}
        title="Adicionar Adulto(s)"
        description="Para um ou mais convidados que não são responsáveis por crianças."
      />
      <ChoiceCard
        onClick={() => setFlowType('family')}
        icon={<Users className="size-6" />}
        title="Adicionar Grupo com Criança(s)"
        description="Para um ou mais convidados onde pelo menos um é criança."
      />
    </div>
  )
}
