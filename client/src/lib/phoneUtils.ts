import * as z from 'zod'

/**
 * Remove todos os caracteres não numéricos de uma string.
 * @param phone - A string do telefone (formatada ou não).
 * @returns Apenas os dígitos do número.
 */
export const unformatPhoneNumber = (phone: string | undefined | null): string => {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/**
 * Formata um número de telefone no padrão brasileiro.
 * Ex: 5579999999999 -> +55 (79) 99999-9999
 * @param value - O número de telefone (apenas dígitos).
 * @returns O número formatado.
 */
export const formatPhoneNumber = (value: string): string => {
  const digitsOnly = unformatPhoneNumber(value)

  if (digitsOnly.length === 0) {
    return ''
  }

  let formatted = `+${digitsOnly.substring(0, 2)}` // +55

  if (digitsOnly.length > 2) {
    formatted += ` (${digitsOnly.substring(2, 4)}` // +55 (79
  }

  if (digitsOnly.length > 4) {
    const part = digitsOnly.substring(4, 9)
    if (part.length > 0) formatted += `) ${part}` // +55 (79) 99999
  }

  if (digitsOnly.length > 9) {
    const part = digitsOnly.substring(9, 13)
    if (part.length > 0) formatted += `-${part}` // +55 (79) 99999-9999
  }

  return formatted
}

/**
 * Schema de validação Zod para números de telefone brasileiros.
 * Valida o formato, código de país, DDD e a presença do nono dígito.
 */
export const brazilianPhoneSchema = z
  .string()
  .transform((value) => unformatPhoneNumber(value))
  .refine((value) => value.length >= 13, {
    message: 'O telefone parece incompleto. Verifique o DDD e o número.',
  })
  .refine((value) => value.startsWith('55'), {
    message: 'O número deve começar com o código do país 55.',
  })
  .refine(
    (value) => {
      const ddd = parseInt(value.substring(2, 4), 10)
      const validDDDs = [
        11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42,
        43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74,
        75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
      ]
      return validDDDs.includes(ddd)
    },
    {
      message: 'O DDD informado é inválido.',
    },
  )
  .refine((value) => value.substring(4, 5) === '9', {
    message: 'O número de celular deve ter o 9º dígito.',
  })
