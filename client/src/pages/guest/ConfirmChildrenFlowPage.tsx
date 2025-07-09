import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { unformatPhoneNumber } from '@/lib/phoneUtils'
import { AddChildrenStep, type AddChildrenStepValues } from '@/pages/guest/steps/AddChildrenStep'
import { CompanionStep, type CompanionStepValues } from '@/pages/guest/steps/CompanionStep'
import {
  ConfirmResponsibleStep,
  type ResponsibleStepValues,
} from '@/pages/guest/steps/ConfirmResponsibleStep'
import { FinalConfirmationStep } from '@/pages/guest/steps/FinalConfirmationStep'
import { SuccessStep } from '@/pages/guest/steps/SuccessStep'
import api from '@/services/api'


type Step = 'RESPONSIBLE' | 'CHILDREN' | 'COMPANION' | 'FINAL_CONFIRMATION' | 'SUCCESS' | 'ERROR'

export interface ChildNeedingCompanion {
  name: string
  reason: 'Menor de 6 anos' | 'Criança atípica'
}

interface GuestFlowState {
  responsible: ResponsibleStepValues | null
  children: AddChildrenStepValues['children'] | null
}

const calculateAge = (dob: Date) => {
  const diff = Date.now() - dob.getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export default function ConfirmChildrenFlowPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [currentStep, setCurrentStep] = useState<Step>('RESPONSIBLE')
  const [flowState, setFlowState] = useState<GuestFlowState>({
    responsible: null,
    children: null,
  })

  // Query para buscar dados do evento para a tela de sucesso
  const { data: eventData } = useQuery({
    queryKey: ['public-event', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}/public`)
      return response.data
    },
    enabled: !!eventId,
  })

  const { mutate: submitGuests, isPending } = useMutation({
    mutationFn: (payload: object) => api.post(`/festa/${eventId}/register-guest-group`, payload),
    onSuccess: () => {
      toast.success('Presença confirmada com sucesso!')
      setCurrentStep('SUCCESS')
    },
    onError: () => {
      toast.error('Houve um erro ao confirmar a presença.')
      setCurrentStep('ERROR')
    },
  })

  const handleSubmitFlow = (
    companionData: CompanionStepValues | null,
    responsibleIsAttending?: boolean,
  ) => {
    const { responsible, children } = flowState
    if (!responsible || !children) return

    let allGuests: object[] = children.map((child) => ({
      nome: child.name,
      tipo_convidado: 'CRIANCA_PAGANTE',
      dataNascimento: child.dob!.toISOString().split('T')[0],
      isCriancaAtipica: child.isAtypical,
    }))

    if (companionData?.companionType === 'myself') {
      allGuests.push({
        nome: responsible.responsibleName,
        tipo_convidado: 'ACOMPANHANTE_ATIPICO',
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
      })
    } else if (companionData?.companionType === 'other' && companionData.otherCompanionName) {
      allGuests.push({
        nome: companionData.otherCompanionName,
        tipo_convidado: companionData.isNanny ? 'BABA' : 'ACOMPANHANTE_ATIPICO',
        telefone: unformatPhoneNumber(companionData.otherCompanionPhone),
      })
    } else if (responsibleIsAttending) {
      allGuests.push({
        nome: responsible.responsibleName,
        tipo_convidado: 'ADULTO_PAGANTE',
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
      })
    }

    submitGuests({
      contatoResponsavel: {
        nome: responsible.responsibleName,
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
      },
      convidados: allGuests,
    })
  }

  const handleNextFromResponsible = (data: ResponsibleStepValues) => {
    setFlowState({ responsible: data, children: null })
    setCurrentStep('CHILDREN')
  }

  const handleNextFromChildren = (data: AddChildrenStepValues) => {
    setFlowState((prev) => ({ ...prev, children: data.children }))
    const needsCompanion = data.children.some(
      (child) => child.isAtypical || calculateAge(child.dob!) < 6,
    )
    setCurrentStep(needsCompanion ? 'COMPANION' : 'FINAL_CONFIRMATION')
  }

  const childrenNeedingCompanion: ChildNeedingCompanion[] =
    flowState.children
      ?.filter((c) => c.isAtypical || calculateAge(c.dob!) < 6)
      .map((c) => ({
        name: c.name,
        reason: c.isAtypical ? 'Criança atípica' : 'Menor de 6 anos',
      })) || []

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
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
        />
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
              Não foi possível confirmar a presença. Por favor, tente novamente mais tarde ou
              contate o organizador da festa.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
