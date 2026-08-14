# Webhooks n8n — Documentação para Migração

Este documento descreve todos os pontos do código que disparam webhooks para o n8n.
O objetivo é mapear cada webhook para podermos trazer a lógica do n8n para dentro do código.

---

## Visão Geral

| # | Função | Arquivo | Linha | Webhook URL | Ação | Status |
|---|---|---|---|---|---|---|
| 1 | `criarFesta` (cliente novo) | festaController.js | ~56 | ~~`webhook.4growthbr.space/.../2cd048a2`~~ | Boas-vindas + link de senha | ✅ MIGRADO — `enviarBoasVindasClienteNovo()` |
| 2 | `criarFesta` (cliente existente) | festaController.js | ~82 | `webhook.4growthbr.space/.../642999e9` | Notificação de nova festa | ⬜ Pendente |
| 3 | `checkinConvidado` | festaController.js | ~772 | `webhook.4growthbr.space/.../ab98ae95` | Notificação de check-in | ⬜ Pendente |
| 4 | `checkoutConvidado` | festaController.js | ~831 | `webhook.4growthbr.space/.../730bdcaf` | Notificação de check-out | ⬜ Pendente |
| 5 | `dispararMensagem` | festaController.js | ~1090 | `webhook.4growthbr.space/.../f87a6169` | Disparo de WhatsApp em massa | ⬜ Pendente |
| 6 | `solicitarRedefinicaoSenha` | authController.js | ~242 | `workflows.4growthbr.space/.../8a71a943` | Link de reset de senha | ⬜ Pendente |

Todos usam `axios.post()` para enviar dados para o n8n, que processa e dispara mensagens via Evolution API (WhatsApp).

---

## Detalhamento de cada Webhook

### 1. Criar Festa — Cliente Novo

**Arquivo:** `server/src/controllers/festaController.js` — função `criarFesta()`

**Quando dispara:** Um `Adm_espaco` cria uma festa para um cliente que ainda não tem conta no sistema.

**O que o n8n provavelmente faz:**
- Recebe os dados do cliente + token de definição de senha
- Envia mensagem de WhatsApp com link para o cliente definir sua senha
- Pode enviar detalhes da festa criada

**Payload enviado:**
```json
{
  "nomeCliente": "Nome do Cliente",
  "emailCliente": "cliente@email.com",
  "telefoneCliente": "+5511999999999",
  "dataFesta": "2026-01-15",
  "horaInicio": "14:00",
  "horaFim": "18:00",
  "localFesta": "Endereço",
  "descricao": "Descrição da festa",
  "pacote_escolhido": "KIDS",
  "numeroConvidados": 30,
  "token": "token_hex_para_definir_senha"
}
```

**Webhook URL:** `https://webhook.4growthbr.space/webhook/2cd048a2-c416-4e42-8202-e0979aa36cca`

**Tipo de envio:** Assíncrono (fire-and-forget com `.catch()`)

---

### 2. Criar Festa — Cliente Existente

**Arquivo:** `server/src/controllers/festaController.js` — função `criarFesta()`

**Quando dispara:** Um `Adm_espaco` cria uma festa para um cliente que já tem conta.

**O que o n8n provavelmente faz:**
- Notifica o cliente sobre a nova festa via WhatsApp
- Envia detalhes do evento

**Payload enviado:**
```json
{
  "nomeCliente": "Nome do Cliente",
  "emailCliente": "cliente@email.com",
  "telefoneCliente": "+5511999999999",
  "dataFesta": "2026-01-15",
  "horaInicio": "14:00",
  "horaFim": "18:00",
  "localFesta": "Endereço",
  "descricao": "Descrição da festa",
  "pacote_escolhido": "KIDS",
  "numeroConvidados": 30
}
```

> Nota: Não envia o `token` (cliente já tem senha).

**Webhook URL:** `https://webhook.4growthbr.space/webhook/642999e9-678f-4a15-ac9d-cbcb01f34bba`

**Tipo de envio:** Assíncrono (fire-and-forget com `.catch()`)

---

### 3. Check-in de Convidado

**Arquivo:** `server/src/controllers/festaController.js` — função `checkinConvidado()`

**Quando dispara:** Staff faz check-in de um convidado (individualmente).

**O que o n8n provavelmente faz:**
- Envia confirmação de check-in via WhatsApp para o responsável

**Payload enviado:**
```json
{
  "nomeCrianca": "Nome da Criança",
  "nomeResponsavel": "Nome do Responsável",
  "telefoneResponsavel": "+5511999999999",
  "horarioCheckin": "2026-01-15T14:30:00.000Z",
  "mensagem": "Check-in realizado para este convidado"
}
```

**Webhook URL:** `https://webhook.4growthbr.space/webhook/ab98ae95-08c2-40b2-a942-c40071b588eb`

**Tipo de envio:** Assíncrono (fire-and-forget com `.catch()`)

---

### 4. Check-out de Convidado

**Arquivo:** `server/src/controllers/festaController.js` — função `checkoutConvidado()`

**Quando dispara:** Staff faz check-out de um convidado.

**O que o n8n provavelmente faz:**
- Envia confirmação de check-out via WhatsApp

**Payload enviado:**
```json
{
  "nomeCrianca": "Nome da Criança",
  "nomeResponsavel": "Nome do Responsável",
  "telefoneResponsavel": "+5511999999999",
  "horarioCheckin": "2026-01-15T14:30:00.000Z",
  "horarioCheckout": "2026-01-15T18:00:00.000Z",
  "mensagem": "Check-out feito 2026-01-15T14:30:00.000Z."
}
```

**Webhook URL:** `https://webhook.4growthbr.space/webhook/730bdcaf-8066-410c-a12c-1304b1bc65b0`

**Tipo de envio:** Assíncrono (fire-and-forget com `.catch()`)

---

### 5. Disparar Mensagem em Massa

**Arquivo:** `server/src/controllers/festaController.js` — função `dispararMensagem()`

**Quando dispara:** Staff envia uma mensagem personalizada para um grupo de convidados filtrados por status (Presente, Saiu, Aguardando).

**O que o n8n provavelmente faz:**
- Para cada convidado com telefone, envia a mensagem via WhatsApp

**Payload enviado (UM POR CONVIDADO, em loop):**
```json
{
  "telefone": "+5511999999999",
  "mensagem": "Texto da mensagem enviada pelo staff",
  "nome_responsavel": "Nome do Responsável",
  "nome_convidado": "Nome do Convidado"
}
```

**Webhook URL:** `https://webhook.4growthbr.space/webhook/f87a6169-3a30-452a-8fb5-2cefed7142ba`

**Tipo de envio:** Síncrono com `await` (um por vez, em loop)

> Atenção: Este é o único webhook que usa `await` — pode ser lento se houver muitos convidados.

---

### 6. Solicitar Redefinição de Senha

**Arquivo:** `server/src/controllers/authController.js` — função `solicitarRedefinicaoSenha()`

**Quando dispara:** Usuário clica em "Esqueci minha senha".

**O que o n8n provavelmente faz:**
- Envia link de redefinição de senha via WhatsApp

**Payload enviado:**
```json
{
  "telefone": "+5511999999999",
  "mensagem": "Olá, recebemos sua solicitação de redefinição de senha. Clique no link abaixo para redefinir:\n\nhttps://espacocriar.4growthbr.space/organizer/choosePassword/TOKEN_AQUI\n\nSe não foi você, ignore esta mensagem."
}
```

**Webhook URL:** `https://workflows.4growthbr.space/webhook/8a71a943-80d8-465c-998e-61aeab9847ec`

**Tipo de envio:** Síncrono com `await` (bloqueia a resposta até o n8n responder)

> Nota: O link de reset está hardcoded com `espacocriar.4growthbr.space`. Se mudar de domínio, precisa atualizar.

---

## Variáveis de Ambiente Relacionadas

O código já usa estas ENVs para a Evolution API (mas os webhooks não as usam — vão direto para o n8n):

| Variável | Uso atual |
|---|---|
| `EVOLUTION_API_URL` | Usada apenas no `EvolutionapiController.js` |
| `EVOLUTION_API_KEY` | Usada apenas no `EvolutionapiController.js` |
| `EVOLUTION_INSTANCE_NAME` | Usada apenas no `EvolutionapiController.js` |

> Após migrar os webhooks para código direto, as URLs de webhook hardcoded saem e a Evolution API passa a ser chamada diretamente do Node.js.

---

## Plano de Migração (sugestão)

Para cada webhook:

1. **Abrir o fluxo no n8n** e documentar o que ele faz exatamente (template de mensagem, condicionais, etc.)
2. **Criar um serviço de WhatsApp** no servidor (`server/src/services/whatsappService.js`) que chama a Evolution API diretamente
3. **Substituir cada `axios.post(webhookUrl, ...)`** por uma chamada ao serviço
4. **Mover templates de mensagem** para o código ou para variáveis de ambiente
5. **Testar** cada fluxo individualmente
