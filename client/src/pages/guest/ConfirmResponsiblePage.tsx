import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import * as z from 'zod';

import { PhoneInput } from '@/components/forms/PhoneInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { brazilianPhoneSchema } from '@/lib/phoneUtils';

// Schema de validação para esta etapa
const responsibleStepSchema = z.object({
  responsibleName: z.string().min(3, 'O nome do responsável é obrigatório.'),
  responsiblePhone: brazilianPhoneSchema,
  isAttending: z.enum(['yes', 'no'], {
    required_error: 'Por favor, selecione uma opção.',
  }),
});

type ResponsibleStepValues = z.infer<typeof responsibleStepSchema>;

export default function ConfirmResponsiblePage() {
  // O eventId será usado nas próximas etapas
  const { eventId } = useParams<{ eventId: string }>();

  const form = useForm<ResponsibleStepValues>({
    resolver: zodResolver(responsibleStepSchema),
  });

  // A lógica de mutação será adicionada depois
  const isPending = false;

  const onSubmit = (data: ResponsibleStepValues) => {
    console.log('Dados da Etapa 1:', data);
    // Aqui, no futuro, salvaremos esses dados no estado e avançaremos para a próxima etapa
    alert('Próximo passo: Adicionar crianças! (Ainda não implementado)');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Responsável pelas Crianças</CardTitle>
          <CardDescription>
            Primeiro, precisamos dos dados de um adulto responsável para contato durante a festa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="responsibleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsiblePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu Telefone/WhatsApp</FormLabel>
                    <FormControl>
                      <PhoneInput placeholder="+55 (XX) 9XXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAttending"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Você (o responsável) também irá à festa?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <Label className="font-normal">Sim, estarei presente</Label>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <Label className="font-normal">
                            Não, apenas deixarei a(s) criança(s)
                          </Label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
