import * as z from 'zod'

export const playlistSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { message: 'O nome da playlist é obrigatório (mínimo 3 caracteres).' }),
  link: z.string().url({ message: 'Por favor, insira uma URL válida.' }),
})

export type PlaylistFormValues = z.infer<typeof playlistSchema>
