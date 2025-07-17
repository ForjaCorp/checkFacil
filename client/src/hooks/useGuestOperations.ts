import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Schemas
import { type EditGuestFormValues } from '@/schemas/guestSchemas'
// Services
import api from '@/services/api'

// Types
import type { BaseGuest } from '@/types/guest'

export function useGuestOperations(eventId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['guests', eventId]

  const { mutate: editGuest, isPending: isEditing } = useMutation({
    mutationFn: ({ guestId, data }: { guestId: number; data: EditGuestFormValues }) =>
      api.patch(`/festa/${eventId}/convidados/${guestId}`, data),

    onMutate: async ({ guestId, data }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousGuests = queryClient.getQueryData<BaseGuest[]>(queryKey)

      queryClient.setQueryData<BaseGuest[]>(queryKey, (old = []) =>
        old.map((guest) =>
          guest.id === guestId
            ? {
                ...guest,
                ...data,
                // Garante que os campos opcionais sejam tratados corretamente
                nascimento_convidado: data.nascimento_convidado || null,
                e_crianca_atipica: data.e_crianca_atipica ?? false,
              }
            : guest,
        ),
      )

      return { previousGuests }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(queryKey, context.previousGuests)
      }
      toast.error('Falha ao salvar alterações.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const { mutate: deleteGuest, isPending: isDeleting } = useMutation({
    mutationFn: (guestId: number) => api.delete(`/festa/${eventId}/convidados/${guestId}`),

    onMutate: async (guestId) => {
      await queryClient.cancelQueries({ queryKey })
      const previousGuests = queryClient.getQueryData<BaseGuest[]>(queryKey)

      queryClient.setQueryData<BaseGuest[]>(queryKey, (old = []) =>
        old.filter((guest) => guest.id !== guestId),
      )

      return { previousGuests }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousGuests) {
        queryClient.setQueryData(queryKey, context.previousGuests)
      }
      toast.error('Falha ao remover convidado.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    editGuest,
    deleteGuest,
    isEditing,
    isDeleting,
  }
}
