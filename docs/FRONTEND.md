# Documentação do Frontend (client/)

> PWA em **React 19 + TypeScript + Vite 6**, com **Tailwind CSS 4** e componentes **shadcn/ui**, **TanStack Query** (dados), **React Router v7** (lazy routes), **React Hook Form + Zod** (formulários) e **sonner** (toasts).
> Atualizado em: 2026-08-15

## Índice
1. [Como rodar](#como-rodar)
2. [Estrutura de pastas](#estrutura-de-pastas)
3. [Rotas e telas (pages/)](#rotas-e-telas)
4. [Componentes de layout](#componentes-de-layout)
5. [Componentes de domínio](#componentes-de-domínio)
6. [Componentes comuns](#componentes-comuns)
7. [Hooks customizados](#hooks-customizados)
8. [Contextos](#contextos)
9. [Serviços, lib e schemas](#serviços-lib-e-schemas)
10. [Tipos](#tipos)
11. [Convenções do projeto](#convenções-do-projeto)
12. [PWA e notificações push](#pwa-e-notificações-push)

---

## Como rodar

```bash
yarn install
yarn dev            # Vite em http://localhost:5173 (host 0.0.0.0 — acessível na rede local)
yarn build          # build de produção (client + service worker)
yarn lint           # ESLint
```

Acesso pelo celular (mesmo Wi-Fi): `http://<IP-do-PC>:5173`. O Vite faz proxy de `/api` e `/uploads` para o backend (`127.0.0.1:3001`).

---

## Estrutura de pastas

```
client/src/
├── App.tsx                 # Definição das rotas (lazy) + providers
├── main.tsx                # Bootstrap (QueryClient, Router, ThemeProvider, Toaster)
├── sw.js                   # Service worker custom (precache + push + notificationclick)
├── router/                 # Layouts de rota (Public, Protected, App)
├── pages/                  # Telas (uma por rota)
├── components/
│   ├── ui/                 # shadcn/ui (Button, Card, Dialog, ...)
│   ├── layout/             # Estrutura visual global (sidebar, headers, navbar)
│   ├── events/             # Festa/eventos (cards, calendário, banner)
│   ├── guests/             # Convidados (form, cards de check-in, skeletons)
│   ├── common/             # Genéricos (dialogs, botões, filtros)
│   ├── playlists/          # Form de playlist
│   └── SplashScreen.tsx
├── hooks/                  # Hooks customizados (dados, push, debounce)
├── contexts/               # Auth + PageHeader
├── services/api.ts         # Instância axios (baseURL /api + token)
├── schemas/                # Validações Zod (event, guest, playlist)
├── lib/                    # Utilitários puros (telefone, emails admin, cn)
├── types/                  # Tipos de domínio
└── config/dashboardConfig.tsx  # Configs visuais do dashboard (labels/ícones por status)
```

---

## Rotas e telas

Definidas em [App.tsx](../client/src/App.tsx) com `lazy()`. Layout em [router/AppLayout.tsx](../client/src/router/AppLayout.tsx) (logado), [router/PublicLayout.tsx](../client/src/router/PublicLayout.tsx) (público) e guarda em [router/ProtectedRoute.tsx](../client/src/router/ProtectedRoute.tsx).

### Públicas (sem login)
| Rota | Tela | Descrição |
|---|---|---|
| `/login` | [LoginPage](../client/src/pages/LoginPage.tsx) | Login por e-mail **ou telefone** + senha. |
| `/forgot-password` | [ForgotPasswordPage](../client/src/pages/ForgotPasswordPage.tsx) | Solicita redefinição (recebe link via WhatsApp). |
| `/set-password` | [SetPasswordPage](../client/src/pages/SetPasswordPage.tsx) | Define senha via token (convite/redefinição). |
| `/guest/*` | Fluxo do convidado | Confirmação de presença via link do convite — ver abaixo. |

### Fluxo do convidado (link do WhatsApp, sem login)
| Rota | Tela |
|---|---|
| `/guest/flow` | [FlowSelectionPage](../client/src/pages/guest/FlowSelectionPage.tsx) — escolha criança/adulto |
| `/guest/confirm-children` | [ConfirmChildrenFlowPage](../client/src/pages/guest/ConfirmChildrenFlowPage.tsx) + steps: AddChildrenStep → CompanionStep → ConfirmResponsibleStep → FinalConfirmationStep → SuccessStep (`pages/guest/steps/`) |
| `/guest/confirm-adult` | [ConfirmAdultPage](../client/src/pages/guest/ConfirmAdultPage.tsx) |
| *(orquestração)* | [useGuestConfirmationFlow](../client/src/hooks/useGuestConfirmationFlow.ts) |

### Logadas — visão do cliente (Adm_festa / organizador)
| Rota | Tela | Descrição |
|---|---|---|
| `/organizer/dashboard` | [DashboardPage](../client/src/pages/DashboardPage.tsx) | Calendário + lista de festas, filtros, banner de eventos do espaço, modal de push. |
| `/organizer/eventos` | [EventosEspacoClientePage](../client/src/pages/events/EventosEspacoClientePage.tsx) | Cards de eventos publicados + link Sympla + compartilhar. |
| `/profile` | [ProfilePage](../client/src/pages/ProfilePage.tsx) | Capa com logo, avatar, dados, redefinir senha, notificações. |

### Logadas — visão do espaço (staff, Adm_espaco)
| Rota | Tela | Descrição |
|---|---|---|
| `/staff/dashboard` | DashboardPage | Mesma tela, com permissões de staff. |
| `/staff/events/createEventDraft` | [CreateDraftEventPage](../client/src/pages/events/CreateDraftEventPage.tsx) | Criar festa (rascunho + contratante). |
| `/organizer/event/:id/details` | [CompleteEventDetailsPage](../client/src/pages/events/CompleteEventDetailsPage.tsx) | Detalhes/edição completa da festa (seções: contratados, personalização, fornecedores). |
| `/guest-management/:idFesta` | [GuestManagementPage](../client/src/pages/guests/GuestManagementPage.tsx) | Gestão de convidados (lista, adicionar, convite). |
| `/checkin/:idFesta` | [CheckinPage](../client/src/pages/operations/CheckinPage.tsx) | Operação de check-in/check-out do dia. |
| `/staff/playlists` | [PlaylistManagementPage](../client/src/pages/staff/PlaylistManagementPage.tsx) | CRUD de playlists Spotify. |
| `/staff/admins` | [AdminManagementPage](../client/src/pages/staff/AdminManagementPage.tsx) | Convidar/gerenciar administradores (só titulares). |
| `/staff/eventos-espaco` | [EventosEspacoPage](../client/src/pages/staff/EventosEspacoPage.tsx) | CRUD + publicação de eventos do espaço (só titulares). |

---

## Componentes de layout

`components/layout/`

| Componente | Função |
|---|---|
| [SideBar.tsx](../client/src/components/layout/SideBar.tsx) | Menu lateral (desktop, `lg:`). Rodapé com avatar+nome, "Ver perfil" e "Sair". Itens de staff apenas para titulares. |
| [SideBarLink.tsx](../client/src/components/layout/SideBarLink.tsx) | Item de menu com estado ativo + tooltip. |
| [BottomNavBar.tsx](../client/src/components/layout/BottomNavBar.tsx) | Navegação inferior (mobile). Aba "Perfil" vira a foto quando `photoUrl` existe. |
| [BottomNavLink.tsx](../client/src/components/layout/BottomNavLink.tsx) | Item da bottom nav. |
| [MobileHeader.tsx](../client/src/components/layout/MobileHeader.tsx) | Header superior no mobile (recebe título via PageHeader). |
| [PageHeader.tsx](../client/src/components/layout/PageHeader.tsx) | Título+descrição da página; renderiza no header (mobile) ou no corpo (desktop). |
| [DashboardFilters.tsx](../client/src/components/layout/DashboardFilters.tsx) | Filtros de busca/status/data do dashboard. |
| [EvolutionManager.tsx](../client/src/components/layout/EvolutionManager.tsx) | Gerencia conexão WhatsApp (QR, status) — modal da sidebar. |
| [WhatsAppStatusIndicator.tsx](../client/src/components/layout/WhatsAppStatusIndicator.tsx) | Chip de status da conexão WhatsApp (dashboard staff). |
| [PushNotificationsCard.tsx](../client/src/components/layout/PushNotificationsCard.tsx) | Ativar/desativar push do dispositivo + teste (teste só para titulares). |
| [PushAtivacaoModal.tsx](../client/src/components/layout/PushAtivacaoModal.tsx) | Modal de 1ª visita oferecendo ativar push (dashboard cliente). |

## Componentes de domínio

### `components/events/`
| Componente | Função |
|---|---|
| [EventCalendarView.tsx](../client/src/components/events/EventCalendarView.tsx) | Grade mensal (`grid-cols-7`) com chips das festas (truncate, sem scroll horizontal). |
| [EventSection.tsx](../client/src/components/events/EventSection.tsx) | Lista de festas com paginação. |
| [EventCard.tsx](../client/src/components/events/EventCard.tsx) | Card resumo da festa (data, tema, status). |
| [EmptyStateCard.tsx](../client/src/components/events/EmptyStateCard.tsx) | Estado vazio padronizado. |
| [ContractedDetailsSection.tsx](../client/src/components/events/ContractedDetailsSection.tsx) | Seção " contratado" (pacote, adultos/crianças) na edição da festa. |
| [PersonalizePartySection.tsx](../client/src/components/events/PersonalizePartySection.tsx) | Seção de personalização (tema, aniversariante, playlist, observações). |
| [FornecedorSection.tsx](../client/src/pages/events/FornecedorSection.tsx) | Dados de fornecedores (bolo, fotógrafo...). |
| [ShareInviteLink.tsx](../client/src/components/events/ShareInviteLink.tsx) | Gera/compartilha link do convite (WhatsApp). |
| [EventosEspacoBanner.tsx](../client/src/components/events/EventosEspacoBanner.tsx) | Carrossel de eventos do espaço no dashboard do cliente. |

### `components/guests/`
| Componente | Função |
|---|---|
| [GuestTabs.tsx](../client/src/components/guests/GuestTabs.tsx) | Abas da gestão de convidados (lista x cadastro etc.). |
| [GuestForm.tsx](../client/src/components/guests/GuestForm.tsx) | Formulário de convidado (usa PhoneInput, schemas Zod). |
| [GuestCard.tsx](../client/src/components/guests/GuestCard.tsx) | Card do convidado na lista. |
| [GuestCheckinCard.tsx](../client/src/components/guests/GuestCheckinCard.tsx) | Card do check-in com ações (check-in/out, grupo). |
| [GuestTypeBadge.tsx](../client/src/components/guests/GuestTypeBadge.tsx) | Badge do tipo (CRIANCA_PAGANTE etc.). |
| [ExtraBadge.tsx](../client/src/components/guests/ExtraBadge.tsx) | Badge de excedente/extra. |
| [WalkinGuestRegistration.tsx](../client/src/components/guests/WalkinGuestRegistration.tsx) | Registro walk-in no balcão. |
| [AddAdultsWalkinForm.tsx](../client/src/components/guests/AddAdultsWalkinForm.tsx) | Form de adultos avulsos. |
| `skeletons/` | GuestCardSkeleton, GuestCheckinCardSkeleton (loading). |

### `components/playlists/`
[PlaylistForm.tsx](../client/src/components/playlists/PlaylistForm.tsx) — form de criação/edição de playlist.

## Componentes comuns

`components/common/`

| Componente | Função |
|---|---|
| [ActionButton.tsx](../client/src/components/common/ActionButton.tsx) | Botão com estado de loading padronizado. |
| [ConfirmationDialog.tsx](../client/src/components/common/ConfirmationDialog.tsx) | Dialog de confirmação genérico. |
| [ErrorBoundary.tsx](../client/src/components/common/ErrorBoundary.tsx) | Boundary de erro com fallback amigável. |
| [SearchAndFilterBar.tsx](../client/src/components/common/SearchAndFilterBar.tsx) | Barra de busca + filtros. |
| [StepHeader.tsx](../client/src/components/common/StepHeader.tsx) | Cabeçalho de step do wizard do convidado. |
| [FornecedorInputGroup.tsx](../client/src/components/common/FornecedorInputGroup.tsx) | Grupo de inputs de fornecedor. |
| `SplashScreen.tsx` | Tela de abertura. |

> `components/ui/` é o **shadcn/ui** padrão (button, card, dialog, form, input, select, table, tabs, tooltip, sonner...). Gerado por CLI — evite editar à mão.

---

## Hooks customizados

`hooks/`

| Hook | Função |
|---|---|
| [usePushNotifications.ts](../client/src/hooks/usePushNotifications.ts) | Estado + ações de push (ativar/desativar/teste), detecção iOS sem instalar. |
| [usePageHeader.ts](../client/src/hooks/usePageHeader.ts) | Define o título do header (`setTitle`) — usada por toda página. |
| [useGuestOperations.ts](../client/src/hooks/useGuestOperations.ts) | CRUD de convidados (mutations + cache TanStack). |
| [useCheckinOperations.ts](../client/src/hooks/useCheckinOperations.ts) | Check-in/out individual e de grupo. |
| [useGuestConfirmationFlow.ts](../client/src/hooks/useGuestConfirmationFlow.ts) | Orquestra o wizard de confirmação do convidado. |
| [useDebounce.ts](../client/src/hooks/useDebounce.ts) | Debounce para buscas. |

## Contextos

`contexts/`

| Contexto | Função |
|---|---|
| [AuthContext.tsx](../client/src/contexts/AuthContext.tsx) + [authContextCore.ts](../client/src/contexts/authContextCore.ts) | Sessão: `user` (name/email/phone/photoUrl/userType), `login/logout/updateUser`. Persiste em localStorage (`userToken`, `user`). |
| [PageHeaderProvider.tsx](../client/src/contexts/PageHeaderProvider.tsx) + Context | Provedor do título global da página. |

## Serviços, lib e schemas

| Arquivo | Função |
|---|---|
| [services/api.ts](../client/src/services/api.ts) | Axios `baseURL: '/api'` + interceptor Bearer token. |
| [lib/phoneUtils.ts](../client/src/lib/phoneUtils.ts) | Máscara `+55 (DD) 9XXXX-XXXX` e `unformatPhoneNumber` (só dígitos, com 55). |
| [lib/adminEmails.ts](../client/src/lib/adminEmails.ts) | `isAdminEmail()` — titulares (acesso a telas staff sensíveis). |
| [lib/guestTypes.ts](../client/src/lib/guestTypes.ts) | Constantes/labels de tipos de convidado. |
| [lib/utils.ts](../client/src/lib/utils.ts) | `cn()` (clsx + tailwind-merge) e afins. |
| [schemas/eventSchemas.ts](../client/src/schemas/eventSchemas.ts) | Zod: criação/edição de festa (telefone exige 13 dígitos com 55). |
| [schemas/guestSchemas.ts](../client/src/schemas/guestSchemas.ts) | Zod: convidado/responsável. |
| [schemas/playlistSchemas.ts](../client/src/schemas/playlistSchemas.ts) | Zod: playlist. |

## Tipos

`types/` — [index.ts](../client/src/types/index.ts) (usuário/sessão), [eventTypes.ts](../client/src/types/eventTypes.ts) (Festa, status), [guest.ts](../client/src/types/guest.ts) (ConvidadoFesta), [checkin.ts](../client/src/types/checkin.ts) (operações de check-in).

## Convenções do projeto

- **Telefone**: banco sempre como **dígitos com 55** (ex `5579999431920`). Entrada via `PhoneInput`; envio com `unformatPhoneNumber()`; backend normaliza (`normalizarTelefone`).
- **Titulares**: funcionalidades administrativas sensíveis checam `isAdminEmail(user.email)` (não apenas o tipo Adm_espaco).
- **Página nova**: (1) lazy import em App.tsx, (2) item na SideBar/BottomNav se aplicável, (3) `usePageHeader().setTitle()` no mount e `null` no unmount, (4) container `p-4 md:p-6`.
- **Dados**: TanStack Query com `queryKey` em array (`['eventos-espaco-admin']`), mutations invalidam cache explícito.
- **Toasts**: `sonner` (`toast.success/error` + `description` do `error.response.data.error`).
- **Formulários**: React Hook Form + Zod; telefone sempre com PhoneInput.

## PWA e notificações push

- `vite-plugin-pwa` em modo **`injectManifest`** com SW custom em [src/sw.js](../client/src/sw.js): precache (workbox) + handlers `push` (mostra notificação com título/corpo/URL) e `notificationclick` (foca/abre a rota).
- Inscrição: `usePushNotifications` → `GET /api/push/chave-publica` → `pushManager.subscribe` → `POST /api/push/inscrever`.
- Manifest em `vite.config.ts` (tema `#8A5CA6`, ícones em `public/`).
- **iOS**: push só com o PWA instalado na tela de início (o hook detecta e avisa).
- VAPID keys ficam no `.env` do **server** (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
