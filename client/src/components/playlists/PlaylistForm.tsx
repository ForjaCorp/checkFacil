import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { playlistSchema, type PlaylistFormValues } from '@/schemas/playlistSchemas'

interface PlaylistFormProps {
  onSubmit: SubmitHandler<PlaylistFormValues>
  isLoading?: boolean
  initialValues?: Partial<PlaylistFormValues>
}

export function PlaylistForm({ onSubmit, isLoading, initialValues }: PlaylistFormProps) {
  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      nome: initialValues?.nome || '',
      link: initialValues?.link || '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Playlist</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Pop Anos 2000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link da Playlist no Spotify</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://open.spotify.com/playlist/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Playlist
        </Button>
      </form>
    </Form>
  )
}
