import axios from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

// Define o tipo da função de mutação que o hook receberá.
type MutationFunction<TData, TVariables> = (variables: TVariables) => Promise<TData>

// Define as opções, agora usando 'unknown' para segurança de tipo.
interface UseApiMutationOptions<TData> {
  onSuccess?: (data: TData) => void
  onError?: (error: unknown) => void
}

/**
 * Hook customizado para lidar com mutações de API (POST, PATCH, DELETE).
 * Gerencia o estado de carregamento e exibe notificações de sucesso ou erro.
 *
 * @param mutationFn A função assíncrona que realiza a chamada de API.
 * @param successMessage A mensagem a ser exibida no toast em caso de sucesso.
 * @param options Callbacks opcionais para sucesso e erro.
 * @returns Um objeto com a função `mutate` para disparar a API e o estado `isLoading`.
 */
// Usa 'unknown' como padrão para os genéricos em vez de 'any'.
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  successMessage: string,
  options?: UseApiMutationOptions<TData>,
) {
  const [isLoading, setIsLoading] = useState(false)

  const mutate = async (variables: TVariables) => {
    setIsLoading(true)
    try {
      const result = await mutationFn(variables)

      if (successMessage) {
        toast.success(successMessage)
      }
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
      return result
    } catch (error) {
      let errorMessage = 'Ocorreu um erro inesperado.'
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error('Falha na operação', {
        description: errorMessage,
      })

      if (options?.onError) {
        options.onError(error)
      }

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return { mutate, isLoading }
}
