// ...código existente...
export interface UpdateEventPayload {
  nome_festa: string; // Adicione esta linha
  data_festa: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  pacote_escolhido: string;
  numero_convidados_contratado: number;
  telefone: string;
  descricao: string;
  nome_aniversariante: string;
  idade_aniversariante: number;
  tema_festa: string;
  festa_deixa_e_pegue: boolean;
  autoriza_uso_imagem: boolean;
  instagram_cliente: string;
  procedimento_convidado_fora_lista: string | null;
  link_playlist_spotify: string | null;
  observacoes_festa: string;
  status: string;
  decorador_nome: string;
  decorador_contato: string;
  // ...outras propriedades...
}
// ...código existente...