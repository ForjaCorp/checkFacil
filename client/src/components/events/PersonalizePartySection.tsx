import { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import type { CompleteDetailsFormValues } from '@/schemas/eventSchemas'
import type { UseFormReturn } from 'react-hook-form'

interface Playlist {
  id: number
  nome: string
  link: string
}

interface PersonalizePartySectionProps {
  form: UseFormReturn<CompleteDetailsFormValues>
  playlists: Playlist[]
}

export function PersonalizePartySection({ form, playlists }: PersonalizePartySectionProps) {
  const [playlistChoice, setPlaylistChoice] = useState<'custom' | 'predefined'>('custom')

  const handlePlaylistSelect = (playlistLink: string) => {
    form.setValue('spotifyPlaylistLink', playlistLink, { shouldValidate: true })
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">Personalize Sua Festa</h3>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="birthdayPersonName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Aniversariante</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome do(a) aniversariante"
                  {...field}
                  className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="birthdayPersonAge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idade a Comemorar (Aniversariante)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ex: 7"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : +e.target.value)
                  }
                  className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partyTheme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tema da Festa (Opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Super Heróis, Princesas"
                  {...field}
                  className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Festa (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalhes adicionais sobre a festa..."
                  className="resize-y focus:border-primary focus:ring-2 focus:ring-primary/30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isDropOffParty"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Festa no modelo &quot;Deixa e Pega&quot;?</FormLabel>
                <FormDescription className="text-left">
                  Marque se as crianças podem ficar desacompanhadas (conforme regras de idade do
                  Espaço Criar).
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allowsImageUse"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Contratante autoriza uso de imagem?</FormLabel>
                <FormDescription className="text-left">
                  Permissão para o Espaço Criar usar imagens do evento para divulgação.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientInstagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram do Cliente (Opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://instagram.com/usuario"
                  {...field}
                  className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="guestNotInListPolicy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedimento para Convidados Não Cadastrados</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger className="focus:border-primary focus:ring-2 focus:ring-primary/30">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PERMITIR_ANOTAR">Permitir e Anotar na Lista</SelectItem>
                  <SelectItem value="CHAMAR_ANFITRIAO">Chamar Anfitrião para Autorizar</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <div className="space-y-4 rounded-md border p-4">
          <h4 className="font-medium">Música da Festa</h4>
          <RadioGroup
            value={playlistChoice}
            onValueChange={(value: 'custom' | 'predefined') => setPlaylistChoice(value)}
            className="space-y-2"
          >
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <RadioGroupItem value="custom" />
              </FormControl>
              <FormLabel className="font-normal">Usar minha própria playlist do Spotify</FormLabel>
            </FormItem>
            <FormItem className="flex items-center space-x-3 space-y-0">
              <FormControl>
                <RadioGroupItem value="predefined" />
              </FormControl>
              <FormLabel className="font-normal">Escolher uma playlist pré-definida</FormLabel>
            </FormItem>
          </RadioGroup>

          {playlistChoice === 'custom' ? (
            <FormField
              control={form.control}
              name="spotifyPlaylistLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link da Playlist do Spotify</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://open.spotify.com/playlist/..."
                      {...field}
                      className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="spotifyPlaylistLink"
              render={() => (
                <FormItem>
                  <FormLabel>Playlists do Espaço Criar</FormLabel>
                  <Select onValueChange={handlePlaylistSelect}>
                    <FormControl>
                      <SelectTrigger className="focus:border-primary focus:ring-2 focus:ring-primary/30">
                        <SelectValue placeholder="Selecione uma playlist..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.link}>
                          {playlist.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="partyObservations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações Adicionais (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre a festa..."
                  className="resize-y focus:border-primary focus:ring-2 focus:ring-primary/30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
