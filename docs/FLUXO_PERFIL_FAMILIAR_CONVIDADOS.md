# Plano: perfil familiar e confirmação rápida de convidados

> Status em 16/08/2026: primeira versão implementada localmente, ainda sem commit. O canal escolhido foi WhatsApp; o token é vinculado à festa e expira em 30 minutos. A estrutura de banco aceita múltiplos responsáveis, mas a gestão desse segundo responsável ainda não possui tela pública. Política automática de retenção e recuperação de telefone continuam como decisões operacionais antes do deploy.

## Objetivo

Evitar que uma família preencha os mesmos dados em todas as festas, sem transformar o convidado em um `Usuario` do sistema e sem expor dados de crianças apenas pela consulta de um telefone.

Exemplo: Isadora cadastrou três filhos na festa de Gustavo. Ao receber o convite da festa de Tadeu, ela confirma o telefone, encontra os três filhos, marca somente os dois que irão, revisa os dados e responde apenas o que for específico dessa nova festa.

## Princípios da solução

- O perfil familiar será independente de `Usuario` e de `ConvidadoFesta`.
- O telefone só poderá recuperar dados após ser validado por código de uso único (OTP) enviado por WhatsApp ou SMS.
- `ConvidadoFesta` continuará representando uma participação específica e preservará o histórico daquela festa.
- Dados permanentes serão reaproveitados; decisões que podem mudar serão confirmadas em cada convite.
- A interface usará cartões, marcações e perguntas condicionais para reduzir digitação.
- A pessoa poderá continuar sem salvar um perfil familiar, quando aplicável.

## Experiência proposta

### 1. Identificação

O convite solicita o telefone da responsável. Após o envio do código, a tela não deve informar se o número já existe antes da validação.

Depois da validação:

- Perfil encontrado: mostrar “Encontramos sua família. Confira quem vai desta vez”.
- Perfil não encontrado: iniciar o cadastro e oferecer salvar os dados para os próximos convites.

### 2. Seleção rápida da família

Exibir cada pessoa em um cartão selecionável, com nome, idade calculada na data da festa e opção de editar.

Exemplo:

- [x] Pedro, 8 anos
- [x] Alice, 5 anos
- [ ] Lucas, 2 anos
- [ ] Isadora também irá
- `+ Adicionar outra pessoa`

Uma ação “Selecionar todos” pode aparecer quando houver três ou mais dependentes. Nenhuma pessoa deve ser selecionada automaticamente em nome do usuário.

### 3. Perguntas práticas e condicionais

As perguntas devem aparecer somente quando forem necessárias:

- **Quem vai?** Cartões com caixa de marcação para responsável e dependentes.
- **Quem acompanhará as crianças?** Se a responsável for, oferecer “Isadora acompanhará todas” como opção principal. Permitir alterar apenas uma criança quando necessário.
- **Outro adulto ou babá irá?** Usar marcação “Adicionar acompanhante” e só então abrir nome, telefone e relação.
- **Algo mudou?** Mostrar um resumo dos dados reaproveitados com ações “Está tudo certo” e “Revisar”.
- **Necessidades para esta festa?** Usar opções de múltipla escolha e um campo complementar opcional.

Sugestão de marcações para necessidades:

- Alimentação ou alergia
- Acessibilidade ou mobilidade
- Sensibilidade a som, luz ou aglomeração
- Necessidade de acompanhante
- Medicação ou cuidado importante
- Nenhuma necessidade para esta festa
- Outra (abre campo de texto)

“Nenhuma” deve desmarcar as demais opções. Informações médicas detalhadas não devem ser solicitadas quando uma orientação prática for suficiente.

### 4. Revisão final

Antes de concluir, mostrar um único resumo:

- pessoas confirmadas;
- responsável presente ou contato responsável;
- acompanhante de cada criança, somente quando diferente do padrão;
- necessidades informadas;
- consentimento para salvar ou atualizar o perfil familiar.

O botão final deve dizer claramente `Confirmar presença de X pessoas`.

## Dados permanentes e dados da festa

### Reaproveitados do perfil familiar

- nome e telefone da responsável;
- nome e data de nascimento dos dependentes;
- vínculo entre responsável e dependentes;
- preferências ou necessidades recorrentes, apenas com consentimento explícito e data da última revisão.

### Confirmados novamente em cada festa

- quem irá;
- presença da responsável;
- acompanhante de cada criança;
- babá ou outro adulto;
- necessidades aplicáveis àquela festa;
- confirmação de presença;
- tipo de convidado calculado pelas regras e pela data da festa;
- check-in e check-out.

## Modelagem proposta

### `responsaveis_familiares`

- `id` (UUID ou inteiro)
- `nome`
- `telefone_normalizado` (único)
- `telefone_verificado_em`
- `consentimento_dados_em`
- `created_at` e `updated_at`

### `dependentes`

- `id`
- `nome`
- `data_nascimento`
- `ativo`
- `necessidades_recorrentes` (estrutura a definir, preferencialmente categorias)
- `necessidades_revisadas_em`
- `created_at` e `updated_at`

### `responsaveis_dependentes`

Tabela de associação recomendada para permitir mais de um responsável pela mesma criança:

- `id_responsavel`
- `id_dependente`
- `parentesco_ou_relacao` (opcional)
- `pode_editar`

### Alterações em `convidadosFesta`

- adicionar `id_dependente` opcional;
- adicionar `id_responsavel_familiar` opcional para o adulto;
- manter nome, nascimento, idade, contatos, tipo e necessidades como fotografia histórica da festa;
- substituir gradualmente a dependência de `id_usuario` para convidados comuns;
- criar unicidade por `(id_festa, id_dependente)` quando `id_dependente` não for nulo, impedindo confirmação duplicada.

O perfil atualizado não deve alterar festas antigas. Na confirmação, os dados atuais serão copiados para `ConvidadoFesta`.

## Segurança e privacidade

- Nunca devolver nomes ou indicar que uma família existe antes da validação do telefone.
- OTP com validade curta, uso único, limite de tentativas e limite de envios por telefone/IP.
- Sessão temporária vinculada ao telefone validado e ao convite acessado.
- Normalizar números com DDI e DDD antes de comparar.
- Registrar consentimento para reutilização de dados e permitir corrigir ou excluir o perfil.
- Evitar diagnósticos; armazenar somente necessidades práticas para acolhimento.
- Definir política de retenção para perfis sem uso por período prolongado.
- Registrar auditoria de alterações relevantes, principalmente inclusão e remoção de dependentes.

## Regras e casos especiais

- **Telefone trocado:** oferecer recuperação assistida; não transferir dados somente pela informação do número antigo.
- **Telefone compartilhado:** permitir mais de um responsável ou nome de referência no mesmo núcleo, sem duplicar crianças.
- **Dois responsáveis:** a associação entre responsáveis e dependentes evita duplicidade em guarda compartilhada.
- **Crianças com nomes iguais:** identificar internamente por ID e exibir data de nascimento para diferenciação.
- **Envio repetido:** usar chave de idempotência e a restrição por festa/dependente.
- **Pessoa sem WhatsApp:** prever SMS ou preenchimento sem recuperação de perfil, conforme a infraestrutura disponível.
- **Responsável que depois contrata uma festa:** criar ou promover a conta `Adm_festa` normalmente e, opcionalmente, associá-la ao perfil após validar o mesmo telefone; isso não concede acesso administrativo automaticamente.

## API sugerida

- `POST /public/familias/otp/solicitar`
- `POST /public/familias/otp/validar`
- `GET /public/familias/me` (exige sessão temporária validada)
- `PUT /public/familias/me`
- `POST /public/familias/me/dependentes`
- `PUT /public/familias/me/dependentes/:id`
- adaptar `POST /festa/:id/register-guest-group` para aceitar IDs selecionados, novos participantes, dados específicos e chave de idempotência.

Os nomes finais devem seguir o padrão existente das rotas. A consulta da família nunca deverá ser uma rota pública baseada somente no telefone.

## Etapas de implementação

1. Criar migrações, modelos e associações do perfil familiar.
2. Implementar normalização de telefone, OTP, expiração, limites e sessão temporária.
3. Criar endpoints seguros de leitura e edição da família.
4. Adaptar o registro do grupo para criar fotografias em `ConvidadoFesta` e evitar duplicidade.
5. Refazer o fluxo público em seleção, revisão condicional e confirmação final.
6. Incluir consentimento, edição, exclusão e mensagens de privacidade.
7. Migrar com cuidado dados existentes somente quando houver correspondência confiável e consentimento; não juntar famílias automaticamente apenas por nome.
8. Testar dispositivos móveis, retorno ao convite, OTP expirado, submissão duplicada e múltiplos responsáveis.

## Critérios de aceite

- O telefone sozinho não revela nenhum dado.
- Após validar o código, uma responsável recorrente vê seus dependentes salvos.
- É possível escolher apenas parte dos dependentes e adicionar ou editar alguém.
- Perguntas de acompanhante aparecem somente quando necessárias.
- A confirmação cria um registro separado por participante na festa atual.
- Alterar o perfil não modifica o histórico de festas anteriores.
- Reabrir ou reenviar a confirmação não duplica participantes.
- Uma futura conta `Adm_festa` não é bloqueada nem recebe permissões indevidas por existir um perfil familiar.
- O fluxo funciona sem exigir uma conta de usuário e permite exclusão dos dados reutilizáveis.

## Decisões antes de desenvolver

- Canal do OTP: WhatsApp, SMS ou ambos.
- Se necessidades recorrentes serão salvas por padrão ou somente mediante uma marcação específica.
- Prazo de retenção de perfis inativos.
- Se o primeiro lançamento já aceitará múltiplos responsáveis por dependente.
- Como tratar convites em que o anfitrião pré-cadastra nomes antes de a família confirmar.
