import { Controller } from 'react-hook-form'

import { FornecedorInputGroup } from '@/components/common/FornecedorInputGroup'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import type { CompleteDetailsFormValues } from '@/schemas/eventSchemas'
import type { UseFormReturn } from 'react-hook-form'

interface FornecedorSectionProps {
  form: UseFormReturn<CompleteDetailsFormValues>
}

export function FornecedorSection({ form }: FornecedorSectionProps) {
  const temMaterialTerceirizado = form.watch('temMaterialTerceirizado')

  return (
    // Adicionando um fundo sutil para destacar a seção
    <div className="space-y-8 rounded-lg border p-6 mt-6">
      <h4 className="text-lg font-semibold">Fornecedores do Evento</h4>

      {/* Seção de Decoração - NOVO LAYOUT */}
      <div className="space-y-4">
        <h5 className="text-base font-semibold text-gray-600">Decoração</h5>

        {/* Nome e Contato do Decorador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="decoradorNome">Nome do Decorador</Label>
            <Input
              id="decoradorNome"
              {...form.register('decoradorNome')}
              placeholder="Ex: Maria Flores"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="decoradorContato">Contato do Decorador</Label>
            <Input
              id="decoradorContato"
              {...form.register('decoradorContato')}
              placeholder="(79) 99999-8888"
            />
          </div>
        </div>

        {/* Local da Decoração */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="localDecoracao">Local da Decoração</Label>
          <Controller
            name="localDecoracao"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger id="localDecoracao" className="w-full md:w-[240px]">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAY">PLAY</SelectItem>
                  <SelectItem value="CASINHAS">CASINHAS</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Grupo de Material Terceirizado */}
        <div className="space-y-2 rounded-md border border-dashed p-4">
          <div className="flex items-center gap-2">
            <Controller
              name="temMaterialTerceirizado"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="temMaterialTerceirizado"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="temMaterialTerceirizado" className="font-normal">
              Este decorador usa material terceirizado?
            </Label>
          </div>

          {/* O input agora aparece AQUI, bem conectado à sua checkbox */}
          {temMaterialTerceirizado && (
            <div className="pl-6 pt-2">
              <Label htmlFor="materialTerceirizadoContato">Contato do Fornecedor do Material</Label>
              <Input
                className="mt-1.5"
                id="materialTerceirizadoContato"
                {...form.register('materialTerceirizadoContato')}
                placeholder="Contato do fornecedor do material"
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Seção de Alimentação e Bebidas (agora mais limpa) */}
      <div className="space-y-6">
        <h5 className="text-base font-semibold text-gray-600">Alimentação & Bebidas</h5>
        <FornecedorInputGroup form={form} baseName="buffet" label="Buffet" />
        <FornecedorInputGroup
          form={form}
          baseName="bebidasFornecedor"
          label="Fornecedor de Bebidas"
        />
      </div>

      <Separator />

      {/* Seção Extra (agora mais limpa) */}
      <div className="space-y-4">
        <h5 className="text-base font-semibold text-gray-600">Outros</h5>
        <FornecedorInputGroup form={form} baseName="fornecedorExtra" label="Fornecedor Extra" />
      </div>
    </div>
  )
}
