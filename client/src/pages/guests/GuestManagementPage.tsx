import { useQuery } from '@tanstack/react-query';
import { Loader2, Download, Edit, Trash2, MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

// UI Components
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { SearchAndFilterBar } from '@/components/common/SearchAndFilterBar';
import { ShareInviteLink } from '@/components/events/ShareInviteLink';
import { GuestForm } from '@/components/guests/GuestForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Hooks
import { useGuestOperations } from '@/hooks/useGuestOperations'; // <-- CORREÇÃO APLICADA AQUI
import { usePageHeader } from '@/hooks/usePageHeader';
// Schemas
import { type EditGuestFormValues } from '@/schemas/guestSchemas';
// Services
import api from '@/services/api';

// Types & Constants
import type { AppGuest, GuestType, GuestFilterOptions } from '@/types/guest';

// Opções de filtro para o dropdown
const GUEST_TYPE_OPTIONS: GuestFilterOptions[] = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'ADULTO_PAGANTE', label: 'Adulto' },
  { value: 'CRIANCA_PAGANTE', label: 'Criança' },
  { value: 'CRIANCA_ATE_1_ANO', label: 'Bebê' },
  { value: 'BABA', label: 'Babá' },
  { value: 'ANFITRIAO_FAMILIA_DIRETA', label: 'Família' },
  { value: 'ACOMPANHANTE_ATIPICO', label: 'Acompanhante' },
];

// Mapeamento de tipos de convidado para exibição
const GUEST_TYPE_LABELS: Record<GuestType, string> = {
  ADULTO_PAGANTE: 'Adulto',
  CRIANCA_PAGANTE: 'Criança',
  CRIANCA_ATE_1_ANO: 'Bebê (até 1 ano)',
  BABA: 'Babá',
  ANFITRIAO_FAMILIA_DIRETA: 'Família do Anfitrião',
  ACOMPANHANTE_ATIPICO: 'Acompanhante Atípico',
};

function GuestManagementPage() {
  const { setTitle } = usePageHeader();
  const { eventId = '' } = useParams<{ eventId: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [guestTypeFilter, setGuestTypeFilter] = useState<'all' | GuestType>('all');
  const [editingGuest, setEditingGuest] = useState<AppGuest | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<AppGuest | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { editGuest, deleteGuest, isEditing, isDeleting } = useGuestOperations(eventId);

  const { data: guests = [], isLoading } = useQuery<AppGuest[]>({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const response = await api.get(`/festa/${eventId}/convidados`);
      return response.data.map((guest: any) => ({
        ...guest,
        id: Number(guest.id),
        telefone_responsavel: guest.telefone_responsavel_contato,
        nome_responsavel: guest.nome_responsavel_contato,
      }));
    },
    enabled: !!eventId,
  });

  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const response = await api.get(`/festa/${eventId}`);
      return response.data;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    setTitle('Gerenciar Convidados');
    return () => setTitle(null);
  }, [setTitle]);

  const partyName = eventData?.nome_festa || '';

  const handleEditGuestSubmit = (formData: EditGuestFormValues) => {
    if (!editingGuest) return;

    const isChild = formData.tipo_convidado?.includes('CRIANCA') || false;
    const dataToSend: { [key: string]: any } = {
      nome_convidado: formData.nome_convidado,
      tipo_convidado: formData.tipo_convidado,
      e_crianca_atipica: formData.e_crianca_atipica ?? false,
    };

    if (isChild) {
      dataToSend.nome_responsavel_contato = formData.nome_responsavel || null;
      dataToSend.telefone_responsavel_contato = formData.telefone_responsavel?.replace(/\D/g, '') || null;
    } else {
      dataToSend.telefone_convidado = formData.telefone_convidado?.replace(/\D/g, '') || null;
    }

    if (formData.nascimento_convidado) {
      const date =
        formData.nascimento_convidado instanceof Date
          ? formData.nascimento_convidado
          : new Date(formData.nascimento_convidado);

      if (!isNaN(date.getTime())) {
        dataToSend.nascimento_convidado = date;
      }
    }

    editGuest(
      {
        guestId: editingGuest.id,
        data: dataToSend as EditGuestFormValues,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      },
    );
  };

  const confirmDeleteGuest = () => {
    if (guestToDelete) {
      deleteGuest(guestToDelete.id, {
        onSuccess: () => {
          setGuestToDelete(null);
        },
      });
    }
  };

  const handleEditClick = (guest: AppGuest) => {
    setEditingGuest(guest);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (guest: AppGuest) => {
    setGuestToDelete(guest);
  };

  const handleDownload = async () => {
    if (!eventId) return;
    setIsDownloading(true);
    toast.info('A preparar a sua folha de cálculo...');
    try {
      const response = await api.get(`/festa/${eventId}/convidados/download`, {
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `convidados_${partyName.replace(/\s+/g, '_')}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('O download da folha de cálculo foi iniciado!');
    } catch (err) {
      console.error('Erro ao baixar a folha de cálculo:', err);
      toast.error('Não foi possível baixar a folha de cálculo. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredAndSortedGuests = useMemo(() => {
    return guests
      .filter((guest) => {
        const matchesSearch = guest.nome_convidado.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = guestTypeFilter === 'all' || guest.tipo_convidado === guestTypeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => a.nome_convidado.localeCompare(b.nome_convidado));
  }, [guests, searchTerm, guestTypeFilter]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lista de Convidados</h1>
            <p className="text-muted-foreground">{partyName}</p>
          </div>
          {eventId && <ShareInviteLink eventId={eventId} />}
        </div>

        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="w-full flex-grow">
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterOptions={GUEST_TYPE_OPTIONS}
              selectedFilter={guestTypeFilter}
              onFilterChange={(value) => setGuestTypeFilter(value as 'all' | GuestType)}
              searchPlaceholder="Buscar convidado..."
              filterPlaceholder="Tipo de convidado"
            />
          </div>
          <Button onClick={handleDownload} disabled={isDownloading} variant="outline" className="w-full md:w-auto">
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Baixar Planilha
          </Button>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Convidado</DialogTitle>
            <DialogDescription>
              Altere os dados abaixo e clique em &quot;Salvar Alterações&quot;.
            </DialogDescription>
          </DialogHeader>
          {editingGuest && (
            <GuestForm
              onSubmit={handleEditGuestSubmit}
              isLoading={isEditing}
              initialValues={{
                nome_convidado: editingGuest.nome_convidado || '',
                tipo_convidado: editingGuest.tipo_convidado || '',
                nascimento_convidado: editingGuest.nascimento_convidado || null,
                e_crianca_atipica: editingGuest.e_crianca_atipica ?? false,
                telefone_convidado: editingGuest.telefone_convidado || '',
                telefone_responsavel: editingGuest.telefone_responsavel || '',
                telefone_acompanhante: editingGuest.telefone_acompanhante || '',
                nome_responsavel: editingGuest.nome_responsavel || '',
                nome_acompanhante: editingGuest.nome_acompanhante || '',
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>A carregar convidados...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Convidado</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedGuests.length > 0 ? (
                filteredAndSortedGuests.map((guest) => {
                  const phoneNumber = guest.telefone_convidado || guest.telefone_responsavel;
                  return (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            {guest.nome_convidado}
                            {guest.cadastrado_na_hora && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                Extra
                              </Badge>
                            )}
                          </span>
                          <span className="sm:hidden text-sm text-muted-foreground">
                            {GUEST_TYPE_LABELS[guest.tipo_convidado] || guest.tipo_convidado}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {GUEST_TYPE_LABELS[guest.tipo_convidado] || guest.tipo_convidado}
                      </TableCell>
                      <TableCell className="text-right">
                        {phoneNumber && (
                          <a
                            href={`https://wa.me/${phoneNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Enviar mensagem no WhatsApp"
                          >
                            <Button variant="ghost" size="icon">
                              <MessageSquare className="h-4 w-4 text-green-500" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(guest)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(guest)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {searchTerm || guestTypeFilter !== 'all'
                      ? 'Nenhum convidado encontrado com os filtros atuais.'
                      : 'Nenhum convidado cadastrado ainda.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmationDialog
        isOpen={!!guestToDelete}
        onClose={() => setGuestToDelete(null)}
        onConfirm={confirmDeleteGuest}
        title="Remover Convidado"
        description={
          guestToDelete
            ? `Tem a certeza de que deseja remover ${guestToDelete.nome_convidado}? Esta ação não pode ser desfeita.`
            : 'Tem a certeza de que deseja remover este convidado? Esta ação não pode ser desfeita.'
        }
        confirmText="Remover Convidado"
        cancelText="Cancelar"
        isConfirming={isDeleting}
      />
    </div>
  );
}

export default GuestManagementPage;