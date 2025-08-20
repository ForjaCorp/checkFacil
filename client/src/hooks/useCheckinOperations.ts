import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import api from '@/services/api'

// A interface CheckinGuest precisa estar acessível aqui. 
// Ajuste o caminho do import se necessário.


export function useCheckinOperations(eventId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['guests', eventId]
  
  // Reutilizaremos os mesmos estados de loading. Eles guardarão o ID do responsável durante a operação em grupo.
  const [isCheckinLoading, setIsCheckinLoading] = useState<number | null>(null)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<number | null>(null)

  // --- OPERAÇÕES INDIVIDUAIS (sem alterações) ---

  const { mutate: handleCheckin } = useMutation({
    mutationFn: async (guestId: number) => {
      setIsCheckinLoading(guestId)
      try {
        const response = await api.patch(`/festa/${eventId}/convidados/${guestId}/checkin`)
        return response.data // Retorna os dados para o onSuccess
      } finally {
        setIsCheckinLoading(null)
      }
    },
    onSuccess: (data) => {
      const guestName = data?.convidado?.nome_convidado || 'Convidado'
      toast.success('Check-in realizado!', {
        description: `${guestName} entrou no evento.`,
      })
    },
    onError: (error: unknown) => {
      let errorMessage = 'Não foi possível fazer o check-in.'
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      toast.error('Falha no Check-in', { description: errorMessage })
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
        return response.data
      } finally {
        setIsCheckoutLoading(null)
      }
    },
    onSuccess: (data) => {
      const guestName = data?.convidado?.nome_convidado || 'Convidado'
      toast.success('Check-out realizado!', {
        description: `${guestName} saiu do evento.`,
      })
    },
    onError: (error: unknown) => {
      let errorMessage = 'Não foi possível fazer o check-out.'
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      toast.error('Falha no Check-out', { description: errorMessage })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // --- NOVAS OPERAÇÕES EM GRUPO ---

  const { mutate: handleGroupCheckin } = useMutation({
    mutationFn: async (responsibleId: number) => {
      setIsCheckinLoading(responsibleId); // Mostra o loading no responsável
      try {
        const response = await api.post(`/festa/${eventId}/convidados/${responsibleId}/checkin-grupo`);
        return response.data;
      } finally {
        setIsCheckinLoading(null);
      }
    },
    onSuccess: (data) => {
      toast.success('Check-in de grupo realizado!', {
        description: data?.mensagem || 'O grupo entrou no evento.',
      });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Não foi possível fazer o check-in do grupo.';
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error('Falha no Check-in de Grupo', { description: errorMessage });
    },
    onSettled: () => {
      // Invalida a query para buscar os dados mais recentes do servidor
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const { mutate: handleGroupCheckout } = useMutation({
    mutationFn: async (responsibleId: number) => {
      setIsCheckoutLoading(responsibleId); // Mostra o loading no responsável
      try {
        const response = await api.post(`/festa/${eventId}/convidados/${responsibleId}/checkout-grupo`);
        return response.data;
      } finally {
        setIsCheckoutLoading(null);
      }
    },
    onSuccess: (data) => {
      toast.success('Check-out de grupo realizado!', {
        description: data?.mensagem || 'O grupo saiu do evento.',
      });
    },
    onError: (error: unknown) => {
      let errorMessage = 'Não foi possível fazer o check-out do grupo.';
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error('Falha no Check-out de Grupo', { description: errorMessage });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Retorna todas as funções para serem usadas no componente
  return { 
    handleCheckin, 
    handleCheckout, 
    handleGroupCheckin,
    handleGroupCheckout,
    isCheckinLoading, 
    isCheckoutLoading 
  }
}
