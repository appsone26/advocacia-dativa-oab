# Instruções para o Claude Code — Agenda + Funil (v1)
**Repo:** `appsone26/advocacia-dativa-oab` · **Produção:** Vercel (deploy automático no push da `main`)

Você (Claude Code) foi quem montou este sistema e conhece a estrutura. Este documento acompanha o `DESENHO-TECNICO-AGENDA-v1.md`, que traz **o quê** construir. Aqui está **como** proceder com segurança.

---

## ⛔ ISOLAMENTO ABSOLUTO — LEIA PRIMEIRO

A conta GitHub `appsone26` contém **outro projeto**, chamado **"meus processos"**, que é um sistema **separado, em produção e funcionando**.

**Você só pode atuar no repositório `advocacia-dativa-oab`. Nada além disso.**

Está **terminantemente proibido**, sob qualquer pretexto (inclusive "inspecionar", "referência", "reaproveitar código"):
- Ler, abrir, listar, clonar ou navegar no repositório do **"meus processos"** ou qualquer outro repo que não seja `advocacia-dativa-oab`.
- Tocar em qualquer arquivo, branch, commit, PR ou config do "meus processos".
- Acessar o **Supabase** do "meus processos" (é um projeto/organização diferente — este projeto usa o Supabase `nuktbdkbiiqymustpdsd`, sa-east-1, e SÓ ele).
- Acessar a conta **Resend**, domínio, variáveis de ambiente ou qualquer recurso do "meus processos".
- Copiar padrões, funções, schema ou trechos de código do "meus processos" para cá.

Se em algum momento parecer que a tarefa exige mexer fora de `advocacia-dativa-oab`, **PARE e pergunte** — não prossiga. Toda a ação deste trabalho acontece exclusivamente dentro do repo `advocacia-dativa-oab` e do Supabase `nuktbdkbiiqymustpdsd`.

---

## REGRA DE OURO: inspecionar antes de implementar

**Antes de escrever qualquer código, inspecione o repositório e o banco e me devolva um relatório curto.** Não recrie o que já existe. Confirme especificamente:

1. **Resend / e-mail**: já existe integração de envio conectada neste projeto? Onde (client, rota, env vars `RESEND_*`)? A agenda já dispara algum e-mail hoje? → **Só reportar.** Não construir e-mail na v1 sem meu OK.
2. **Rotas da agenda**: quais rotas de API existem para agenda? (ex.: `src/app/api/agenda/criar/route.ts`). Existe rota de **editar/cancelar**? Existe rota para mudar `status_atendimento` do município? (sei que existe `src/app/api/municipios/atualizar/route.ts` — confirme o que ela faz hoje.)
3. **Telas de agenda**: onde a agenda é renderizada? Confirme:
   - `src/components/dashboard/ComissaoDashboard.tsx` (agenda embutida como aba)
   - `src/components/dashboard/AgendaPanel.tsx` (agenda da Direção/owner)
   - `src/app/dashboard/owner/agenda/page.tsx` e `src/app/dashboard/owner/page.tsx`
4. **Banco**: confirme as colunas atuais de `municipios`, `agenda`, `audit_log`, `comissao_membros` e o CHECK atual de `status_atendimento`.

Depois desse relatório, siga para a implementação na ordem dos tijolinhos (seção 10 do desenho técnico).

---

## O que NÃO tocar (intocável)

- **Autenticação e roteamento**: `middleware.ts` é o **único** guardião de auth. Nenhum layout/página deve chamar Supabase auth para redirecionar. **Não** introduza auth em `src/app/dashboard/layout.tsx` (isso já causou redirect loop no passado).
- **Módulos adormecidos**: `src/config/modulos.ts` mantém `gestor`, `advogado`, `clienteQR` em `false`. **Não religar.** O painel do gestor/advogado e o cadastro por QR continuam desligados nesta fase.
- **Root layout** `src/app/layout.tsx` (tem `<html>/<body>`): não mexer.
- **Tabelas OAB antigas** e colunas legadas (`status_parceria`, `gestor_id`, etc.): deixar intactas, apenas ignorar.

---

## Padrões do projeto (seguir)

- **Transição de funil roda no CÓDIGO, não em trigger** (decisão de produto): a regra "criar evento numa cidade `nao_visitada` → vira `marcada`" (e o retorno pra `nao_visitada` ao cancelar o único compromisso) é aplicada **nas rotas de API** da agenda, não via trigger no banco. Motivo: o projeto já grava auditoria pelas rotas e a auditoria é *best-effort* — mais fácil de controlar no código; trigger é lógica escondida. Extraia a transição num **helper compartilhado** (ex.: `src/lib/funil.ts`) que as rotas de criar/editar/cancelar chamam, pra não duplicar. **Não** criar trigger de status no banco.
- **Migrações sempre aditivas**: `ADD COLUMN` / `CREATE` / `UPDATE` de dados. Trocar um CHECK (drop + add constraint) é permitido; **nunca** DROP de tabela ou coluna com dados. Migrar dados antes de apertar constraints. (A migração de banco do funil — **tijolinho 3.1** — **já foi aplicada em 15/07**; ver DESENHO seção 3. Não rodar de novo.)
- **Níveis e status são strings**: `owner`/`comissao`/`gestor`/`advogado`/`cliente`; `nao_visitada`/`marcada`/`negociacao`/`fechado`/`nao_participa`. Nunca número.
- **Rotas compartilhadas** ficam no array `SHARED_ROUTES` do `middleware.ts`. A agenda da Direção (`/dashboard/owner/agenda`) já é acessível ao owner por herança do prefixo — não precisa de SHARED_ROUTES.
- **Auditoria** — ⚠️ **ATENÇÃO: o schema documentado em versões antigas estava ERRADO.** As colunas `usuario_nome`, `detalhe`, `municipio_id`, `municipio_nome` **NÃO existem** no banco. O `audit_log` **real** (confirmado por `information_schema` em 15/07) tem estas colunas:
  - `id` (bigint, auto), `user_id` (uuid), `acao` (text, NOT NULL), `tabela` (text, NOT NULL), `registro_id` (text), `valor_antes` (jsonb), `valor_depois` (jsonb), `ip_address` (text), `criado_em` (timestamptz, default now()).
  - **Como gravar:** `user_id` = quem fez; `acao` = verbo curto (ex.: `agenda_criar`, `agenda_cancelar`, `funil_avancar`); `tabela` = `'agenda'` ou `'municipios'`; `registro_id` = id do evento/município; e **todo o contexto** (nome da cidade, tipo, data, estágio de/para, motivo do cancelamento) vai dentro de **`valor_antes`/`valor_depois` (jsonb)** — NÃO em colunas próprias.
  - **Escopo (decisão de produto):** registrar **TODAS** as ações de agenda (criar, editar, cancelar) **e** todas as mudanças de `status_atendimento`.
  - **Modo best-effort:** se a gravação do audit falhar, a ação principal NÃO pode cair (try/catch em volta só do audit).
  - ⚠️ **Dívida existente a corrigir de passagem:** a rota `api/municipios/atualizar` hoje insere em colunas que não existem (`usuario_id`/`usuario_nome`/`detalhe`/`municipio_*`) → esse insert de auditoria **está falhando calado**. Ao mexer nessa rota, corrija para o schema real acima. A rota `api/casos/recusar` já usa o formato certo — use-a como referência de assinatura.
- **Permissões**: reusar a máquina existente — `comissao_membros.liberar_tudo` e `comissao_membros.permissoes text[]` (permissão relevante: `editar_agenda`). Regra de negócio de quem pode avançar o funil está na seção 8 do desenho técnico.
- **Identidade visual**: azul `#1e3a5f`, azul médio `#2d5986`, dourado `#c9a227`, fundo `#f0f4f8`; ícones `lucide-react` (atenção: `UserShield` não existe — usar `ShieldCheck`). Cores do funil: cinza / azul / âmbar / verde / vermelho conforme a seção 2.

---

## Validação antes de considerar "pronto"

1. `next build` (ou `npm run build`) tem que passar **verde** localmente antes do push — o histórico de deploys vermelhos foi por `Module not found` de componente. Confirme imports e nomes de arquivo (case-sensitive no build).
2. Testar os três caminhos:
   - **owner** (`advocaciadativarj@gmail.com` / `Dativa@2026`): Visão Geral abre, Agenda no menu, cria/edita/cancela compromisso, avança funil, cidade sobe na fila pela data.
   - **comissão** (`comissao@teste.com` / `Dativa@2026`): marca/edita/cancela; **não** consegue avançar funil (negociação/fechado/nao_participa).
   - **gestor** (`gestor@teste.com` / `Dativa@2026`): continua **adormecido** — mostra "Este acesso está indisponível no momento", sem loop.
3. Conferir que `municipios` continua com **92** linhas e a migração não estourou nenhum CHECK.

---

## Entregáveis

- As mudanças de banco (migração aditiva rodada), as rotas de API novas/alteradas, e as telas atualizadas (comissão + Direção).
- Um resumo curto do que mudou e o **estado do Resend** (conectado ou não), pra decidirmos os e-mails na sequência.
- **Não** implementar alertas visuais (piscar/vermelho/aviso de 2 dias) nem e-mails de agenda nesta v1 — estão explicitamente adiados (seção 9 do desenho técnico).
