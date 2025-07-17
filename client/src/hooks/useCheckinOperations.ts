import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import api from '@/services/api'

import type { CheckinGuest } from '@/types/checkin'

export function useCheckinOperations(eventId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['guests', eventId]
  const [isCheckinLoading, setIsCheckinLoading] = useState<number | null>(null)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<number | null>(null)

  const { mutate: handleCheckin } = useMutation({
    mutationFn: async (guestId: number) => {
      setIsCheckinLoading(guestId)
      try {
        const response = await api.patch(`/festa/${eventId}/convidados/${guestId}/checkin`)
        return response
      } finally {
        setIsCheckinLoading(null)
      }
    },
    onMutate: async (guestId: number) => {
      await queryClient.cancelQueries({ queryKey })
      const previousGuests = queryClient.getQueryData<CheckinGuest[]>(queryKey)
      
      queryClient.setQueryData<CheckinGuest[]>(queryKey, (oldGuests = []) =>
        oldGuests.map((guest) =>
          guest.id === guestId
            ? { ...guest, status: 'Presente', checkin_at: new Date().toISOString() }
            : guest,
        ),
      )
      
      return { previousGuests, guestId }
    },
    onSuccess: (_, guestId, context) => {
      const guest = context?.previousGuests?.find((g: CheckinGuest) => g.id === guestId)
      if (guest) {
        toast.success('Check-in realizado!', {
          description: `${guest.name} entrou no evento.`,
          duration: 3000,
        })
      }
    },
    onError: (error: unknown, _: number, context: { previousGuests?: CheckinGuest[] } | undefined) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(queryKey, context.previousGuests)
      }

      let errorMessage = 'Não foi possível fazer o check-in. Tente novamente.'
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error('Falha no Check-in', {
        description: errorMessage,
        duration: 5000,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const { mutate: handleCheckout } = useMutation({
    mutationFn: async (guestId: number) => {
      setIsCheckoutLoading(guestId)
      try {
        const response = await api.patch(`/festa/${eventId}/convidados/${guestId}/checkout`)
        return response
      } finally {
        setIsCheckoutLoading(null)
      }
    },
    onMutate: async (guestId: number) => {
      await queryClient.cancelQueries({ queryKey })
      const previousGuests = queryClient.getQueryData<CheckinGuest[]>(queryKey)
      
      queryClient.setQueryData<CheckinGuest[]>(queryKey, (oldGuests = []) =>
        oldGuests.map((guest) =>
          guest.id === guestId ? { ...guest, status: 'Saiu', checkout_at: new Date().toISOString() } : guest,
        ),
      )
      
      return { previousGuests, guestId }
    },
    onSuccess: (_, guestId, context) => {
      const guest = context?.previousGuests?.find((g: CheckinGuest) => g.id === guestId)
      if (guest) {
        toast.success('Check-out realizado!', {
          description: `${guest.name} saiu do evento.`,
          duration: 3000,
        })
      }
    },
    onError: (error: unknown, _: number, context: { previousGuests?: CheckinGuest[] } | undefined) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(queryKey, context.previousGuests)
      }

      let errorMessage = 'Não foi possível fazer o check-out. Tente novamente.'
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error('Falha no Check-out', {
        description: errorMessage,
        duration: 5000,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return { 
    handleCheckin, 
    handleCheckout, 
    isCheckinLoading, 
    isCheckoutLoading 
  }
}
