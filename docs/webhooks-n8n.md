# Webhooks n8n — Migração para Evolution API direta

Este documento descreve todos os pontos do código que disparavam webhooks para o n8n.
A migração substituiu o n8n por chamadas diretas à Evolution API no próprio backend,
centralizadas em `server/src/services/whatsappService.js`.

---

## Visão Geral — ✅ MIGRAÇÃO CONCLUÍDA

| # | Função | Arquivo | Serviço | Ação | Status |
|---|---|---|---|---|---|
| 1 | `criarFesta` (cliente novo) | festaController.js | `enviarBoasVindasClienteNovo()` | Boas-vindas + link de senha | ✅ MIGRADO |
| 2 | `criarFesta` (cliente existente) | festaController.js | `enviarNovaFestaClienteExistente()` | Notificação de nova festa | ✅ MIGRADO |
| 3 | `checkinConvidado` | festaController.js | `enviarCheckinConvidado()` | Confirmação de check-in | ✅ MIGRADO |
| 4 | `checkoutConvidado` | festaController.js | `enviarCheckoutConvidado()` | Confirmação de check-out | ✅ MIGRADO |
| 5 | `dispararMensagem` | festaController.js | `enviarMensagemWhatsApp()` (loop) | Disparo em massa | ✅ MIGRADO |
| 6 | `solicitarRedefinicaoSenha` | authController.js | `enviarMensagemWhatsApp()` | Link de reset de senha | ✅ MIGRADO |

Todas as mensagens são enviadas via `enviarMensagemWhatsApp(telefone, mensagem)`, que:
- Normaliza o telefone (aceita com/sem 55, com máscara)
- Envia com delay de 1,2s e presença "digitando" (menos chance de bloqueio)
- Classifica erros com códigos (`TELEFONE_INVALIDO`, `EVO_CONEXAO`, `EVO_API_KEY`, `EVO_INSTANCIA`, `EVO_DESCONECTADO`, `EVO_ERRO`)

---

## Templates de Mensagem (implementados)

### 1. Boas-vindas — cliente novo (`enviarBoasVindasClienteNovo`)

Dispara quando um `Adm_espaco` cria uma festa para um cliente sem conta.

```
Ola, {nomeCliente}! 🎉

Sua festa foi agendada no Espaco Criar!

📅 Data: {dd/mm/aaaa}
🕐 Horario: {HH:MM} as {HH:MM}      (se existir)
📍 Local: {local}                    (se existir)

Para acompanhar sua festa e gerenciar os convidados, defina sua senha no link abaixo:
{FRONT_URL}/organizer/choosePassword/{token}

O link e valido por 24 horas.

Apos definir sua senha, entre com seu telefone e complete os dados da festa (aniversariante, tema, convidados e mais) no painel.

Ate logo! 🎈
```

### 2. Nova festa — cliente existente (`enviarNovaFestaClienteExistente`)

Dispara quando a festa é criada para um cliente que já tem conta.

```
Ola, {nomeCliente}! 🎉

Uma nova festa foi agendada para voce no Espaco Criar!

📅 Data: {dd/mm/aaaa}
🕐 Horario: {HH:MM} as {HH:MM}      (se existir)
📍 Local: {local}                    (se existir)

Qualquer duvida, estamos a disposicao. Ate a festa! 🎈
```

### 3. Check-in de convidado (`enviarCheckinConvidado`)

Dispara quando o staff faz check-in de um convidado. Enviado ao `telefone_responsavel_contato`.

```
✅ Check-in realizado!

{nome_convidado} acabou de entrar na festa.
🕐 Entrada às {HH:MM}.

Bom divertimento! 🎉
```

### 4. Check-out de convidado (`enviarCheckoutConvidado`)

Dispara quando o staff faz check-out. Enviado ao `telefone_responsavel_contato`.

```
👋 Check-out realizado!

{nome_convidado} acabou de sair da festa.
🕐 Entrada: {HH:MM}
🕐 Saída: {HH:MM}

Obrigado por comparecer! 🎈
```

### 5. Disparo em massa (`dispararMensagem` → `enviarMensagemWhatsApp` em loop)

Staff envia texto livre para convidados filtrados por status:
- `Presente` — com check-in e sem check-out
- `Saiu` — com check-out
- `Aguardando` — sem check-in e sem check-out

O texto é o que o staff digitou (sem template — mensagem pura), enviado um por vez
ao `telefone_responsavel_contato`. A resposta retorna `{ quantidade, enviados, falhas }`.

### 6. Redefinição de senha (`solicitarRedefinicaoSenha` → `enviarMensagemWhatsApp`)

Dispara na tela "Esqueci minha senha" (usuário informa **telefone** com DDD).

```
Ola, {nome}! Recebemos sua solicitação de redefinição de senha. Clique no link abaixo para redefinir:

{FRONT_URL}/organizer/choosePassword/{token}

Se não foi você, ignore esta mensagem.
```

Link com `FRONT_URL` do env. Diferente dos demais, falhas de envio **retornam erro**
(502) pro usuário final ver o motivo (ex.: WhatsApp desconectado).

---

## Detalhes técnicos por webhook

| # | Quando dispara | Se WhatsApp falha | Bloqueia a operação? |
|---|---|---|---|
| 1 | criarFesta, cliente novo | Loga `[WhatsApp] Falha [CÓDIGO]` | Não — festa é criada |
| 2 | criarFesta, cliente existente | Loga `[WhatsApp] Falha [CÓDIGO]` | Não — festa é criada |
| 3 | check-in | Loga `[WhatsApp] Falha [CÓDIGO]` | Não — check-in é salvo |
| 4 | check-out | Loga `[WhatsApp] Falha [CÓDIGO]` | Não — check-out é salvo |
| 5 | disparo em massa | Contabiliza `falhas` por convidado | Não — continua o loop |
| 6 | esqueci senha | **Retorna 502 ao frontend** | Sim — usuário vê o erro |

---

## Variáveis de Ambiente

| Variável | Uso |
|---|---|
| `EVOLUTION_API_URL` | URL base da Evolution (ex: `https://evo4.4growthbr.space`) |
| `EVOLUTION_API_KEY` | Token da instância (apikey) |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância (ex: `Espaco`) — **sem espaços extras** |
| `EVOLUTION_GLOBAL_KEY` | Apikey GLOBAL (admin) da Evolution — usada apenas pelo botão "Recriar conexão" (`POST /evolution/reset`) |
| `FRONT_URL` | Base dos links enviados via WhatsApp |

> Instância travou ("Connection Closed" eterno)? Botão **"Recriar conexão"** no card do
> WhatsApp do app desloga, deleta e recria a instância com o mesmo nome/token, mostrando
> o QR pra escanear. Requer `EVOLUTION_GLOBAL_KEY` e `DEL_INSTANCE=TRUE` no container da Evolution.
