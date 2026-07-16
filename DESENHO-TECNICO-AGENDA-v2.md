# Desenho Técnico — Agenda + Funil de Cidades (v1)
**Projeto:** Advocacia Dativa OAB-RJ · fase Defensoria
**Para:** execução pelo Claude Code no repo `appsone26/advocacia-dativa-oab`
**Data:** 15/07/2026

---

## 0. Resumo em uma frase

Hoje a **agenda**, o **painel de status** e a **lista de cidades** são três coisas soltas que não conversam. Este documento funde os três num fluxo único, onde **a agenda é a fonte da verdade**: marcar um compromisso numa cidade move a cidade dentro de um funil de 5 estágios, e o painel da Direção (Patrícia) vira uma **fila ordenada pela data do próximo compromisso**.

---

## 1. Princípio central

> **A agenda comanda o status da cidade.**

- Marcou um compromisso (reunião ou visita) numa cidade → a cidade entra no funil.
- A posição da cidade na fila da Patrícia é dada pela **data do próximo compromisso futuro** (a mais próxima fica na frente), independente do estágio.
- O avanço do funil (negociação → fechado) é uma ação **manual da Direção**, disparada a partir da cidade.

---

## 2. O funil (status da cidade — `municipios.status_atendimento`)

Cinco estágios. **O estágio `realizada` sai** (era intermediário e redundante). Entra `nao_participa`.

| Estágio | Cor | Significado | Como chega aqui |
|---|---|---|---|
| `nao_visitada` | cinza | Sem nada marcado | Estado inicial / cancelou o único compromisso |
| `marcada` | azul | Tem compromisso agendado | **Automático**: criar evento numa cidade `nao_visitada` |
| `negociacao` | âmbar | Foi visitada, está negociando | **Manual (Direção)**: após a reunião acontecer |
| `fechado` | verde | Concluído, entrou no projeto | **Manual (Direção)** → afunda / sai da fila ativa |
| `nao_participa` | vermelho | Prefeitura recusou | **Manual (Direção)** |

**Regras de transição automática (via agenda):**
- Cidade `nao_visitada` + novo evento → vira `marcada`.
- Cidade já em `negociacao` + novo evento → **continua** `negociacao` (a nova data só entra na fila; não regride pra `marcada`).
- Cidade `fechado` / `nao_participa` + novo evento → mantém o estágio; o evento aparece na fila pela data, e a Direção decide se reabre.

**Dois níveis distintos (não confundir):**
- `agenda.status_reuniao` (`marcada` / `realizada` / `cancelada`) = o **evento** aconteceu / foi desmarcado.
- `municipios.status_atendimento` = o **estágio da cidade** no funil.
- Quando a Direção marca o evento como `realizada`, ela avança a **cidade** pra `negociacao`. Um puxa o outro, mas são campos separados.

---

## 3. Mudanças no banco (aditivas — padrão "adormecer, não apagar")

> ✅ **JÁ APLICADA em 15/07/2026** (rodada pelo Edgard no SQL Editor do Supabase). **NÃO rodar de novo.** Confirmado após a migração: 92/92 municípios, distribuição `nao_visitada:88 · negociacao:2 · marcada:1 · fechado:1`, nenhum `realizada` restante, CHECK novo ativo, e `agenda` já com `responsavel` + `motivo_cancelamento`. O SQL abaixo fica só como registro do que foi feito.

SQL aplicado (migrou dados ANTES de trocar o CHECK):

```sql
BEGIN;

-- 3.1 Migrar dados existentes: 'realizada' -> 'negociacao'
UPDATE municipios SET status_atendimento = 'negociacao'
WHERE status_atendimento = 'realizada';

-- 3.2 Trocar o CHECK de status_atendimento (remove 'realizada', adiciona 'nao_participa')
ALTER TABLE municipios DROP CONSTRAINT IF EXISTS municipios_status_atendimento_check;
ALTER TABLE municipios
  ADD CONSTRAINT municipios_status_atendimento_check
  CHECK (status_atendimento IN
    ('nao_visitada','marcada','negociacao','fechado','nao_participa'));

-- 3.3 Agenda: responsável/anfitrião + motivo de cancelamento
ALTER TABLE agenda
  ADD COLUMN IF NOT EXISTS responsavel          text,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento  text;

-- status_reuniao (marcada/realizada/cancelada) já existe do Passo 2 — manter.

COMMIT;
```

**Nada é dropado de dados/tabelas.** As colunas OAB antigas (`status_parceria`, `gestor_id`, etc.) continuam intactas e ignoradas.

### 3-bis. ⚠️ audit_log — schema REAL (corrigido em 15/07)

Versões antigas deste plano descreviam o `audit_log` com colunas que **não existem**. O schema **real** (confirmado no Supabase) é:

`id` (bigint) · `user_id` (uuid) · `acao` (text, NOT NULL) · `tabela` (text, NOT NULL) · `registro_id` (text) · `valor_antes` (jsonb) · `valor_depois` (jsonb) · `ip_address` (text) · `criado_em` (timestamptz).

**Toda gravação de auditoria neste documento** (seções 4, 5, 6) usa este formato: `acao` = verbo curto (`agenda_criar`, `agenda_editar`, `agenda_cancelar`, `funil_avancar`), `tabela`/`registro_id` = o alvo, e **o contexto (cidade, tipo, data, estágio de→para, motivo) vai dentro de `valor_antes`/`valor_depois` (jsonb)** — nunca em colunas próprias. Gravação em modo *best-effort* (falha do audit não derruba a ação). **Escopo:** registrar todas as ações de agenda + todas as mudanças de status.

> Dívida existente: `api/municipios/atualizar` grava hoje no formato errado (falha calada) — corrigir de passagem. `api/casos/recusar` já usa o formato certo (referência).

---

## 4. Cadastro / edição de compromisso (agenda)

Campos do formulário (vale para a agenda da **comissão** e a da **Direção**):

| Campo | Obrigatório | Observação |
|---|---|---|
| Título | sim | Ex.: "Reunião de apresentação do projeto" |
| Tipo | sim | `reuniao` ou `visita` |
| Município | **sim (nos dois tipos)** | Hoje o seletor só aparece em "visita" — passar a aparecer sempre |
| Responsável / anfitrião | **sim** | **Texto livre** — quem recebe na cidade (ex.: "Dr. João — Sec. de Assistência Social"). Campo próprio, separado do título |
| Data/hora início | sim | Entra na fila por esta data |
| Data/hora fim | não | |
| Descrição | não | O que é o compromisso; aparece quando a Patrícia clica |

Ao **salvar** um compromisso: aplicar a transição automática do funil (seção 2, **no código — helper compartilhado, não trigger**) e **gravar no audit_log** no formato da seção 3-bis (`acao='agenda_criar'`/`'agenda_editar'`, `tabela='agenda'`, `registro_id`=id do evento; cidade/tipo/data/estágio em `valor_depois` jsonb).

---

## 5. Cancelamento (motivo obrigatório)

- Cancelar/desmarcar (comissão ou Direção) **exige um motivo** (campo obrigatório).
- Grava: `status_reuniao = 'cancelada'`, `motivo_cancelamento`, e registra no audit_log (`acao='agenda_cancelar'`, `tabela='agenda'`, `registro_id`=id do evento; `motivo` + estágio de→para em `valor_antes`/`valor_depois` jsonb).
- Se a cidade estava só `marcada` e **não sobra nenhum compromisso futuro** → volta pra `nao_visitada`.
- O **histórico do cancelamento não some** — fica no registro da cidade e alimenta o relatório de "marcados que não se concretizaram e o porquê".

---

## 6. Painel da Direção (Patrícia) = fila por data

A lista de 92 municípios **deixa de ser alfabética** e vira uma **fila por urgência**:

- Ordenada pela **data do próximo compromisso futuro** (a mais próxima na frente).
- Cidades **sem** compromisso futuro afundam pro fim.
- Cada linha mostra:
  - **Nome do município** + **nº de habitantes** (`populacao`; mostrar **"—"** quando vazio — os dados das 92 cidades ainda serão carregados)
  - À direita: **tipo** (Reunião / Visita) + **data** do próximo compromisso, e o **estágio** do funil
  - Ao **clicar**: abre a cidade com a **descrição** e o **responsável/anfitrião** daquele compromisso, e as ações de avançar o funil.
- **Remover** a lista lateral "Prioridades a visitar" (fica redundante — a própria fila já é a prioridade).

**Ação de avançar o funil** (a partir da cidade): visitou → `negociacao`; resolveu → `fechado`; recusou → `nao_participa`. Cada avanço grava no audit_log (`acao='funil_avancar'`, `tabela='municipios'`, `registro_id`=id da cidade; estágio de→para em `valor_antes`/`valor_depois` jsonb).

> **Alertas visuais ficam FORA da v1** (ver seção 9). A v1 só precisa **ordenar pela data e mostrar a data**.

---

## 7. Cards de status (topo do painel)

- Cinco cards, um por estágio do funil, **só com número**.
- Clicar num card **filtra/lista** as cidades daquele estágio (esse comportamento já existe hoje — apenas religar nos 5 status novos).
- Os números vêm de `municipios.status_atendimento`, que agora é alimentado pela agenda.

---

## 8. Permissões

| Ação | Comissão | Direção (Patrícia / owner) |
|---|---|---|
| Marcar reunião/visita | ✅ | ✅ |
| Editar compromisso | ✅ | ✅ |
| Remarcar (mudar data) | ✅ | ✅ |
| Cancelar/desmarcar (com motivo) | ✅ | ✅ |
| Avançar funil → `negociacao` | ❌ | ✅ |
| Avançar funil → `fechado` | ❌ | ✅ |
| Marcar `nao_participa` | ❌ | ✅ |

- A comissão **marca e organiza** a agenda; **não** decide o estágio do funil (isso é de quem faz a reunião).
- **Observadores** (Ana Teresa / Defensor — owner marcado como só-leitura via `comissao_membros` sem `editar_agenda`): **só visualizam**.
- A máquina de permissão já existe: `comissao_membros.liberar_tudo` + `comissao_membros.permissoes text[]`. Reusar.

---

## 9. Fora do escopo da v1 (deixar para depois da apresentação)

- **Alertas visuais**: aviso âmbar faltando ~2 dias, vermelho/piscando quando a data vence, "obrigar" a Patrícia a atualizar. Decidido: só depois de ver a apresentação. **Não implementar agora.**
- **Emails de agenda (Resend)**: o Claude Code deve primeiro **verificar se o Resend já está conectado** neste projeto (ver INSTRUCOES-CLAUDE-CODE) e **reportar** antes de implementar qualquer envio. Não construir e-mail nesta v1 sem confirmação.
- **Carga de dados de população / distância** das 92 cidades: entra depois; por ora a fila mostra "—".

---

## 10. Ordem de execução sugerida (tijolinhos)

1. ✅ **3.1 — Banco** — **CONCLUÍDO em 15/07** (migração da seção 3 aplicada; 92/92 conferido). Não refazer.
2. 👉 **3.2 — Agenda linka cidade** (PRÓXIMO): município obrigatório nos dois tipos + campo `responsavel` (texto livre) + transição automática pra `marcada` **no código (helper compartilhado `src/lib/funil.ts`, não trigger)** + gravar audit_log no schema real (seção 3-bis). Mexe na API de criar/editar agenda e nos modais da comissão e da Direção. **De passagem:** corrigir o audit quebrado da `api/municipios/atualizar`.
3. **3.3 — Fila da Direção**: reordenar por data do próximo compromisso, mostrar habitantes ("—" se vazio), tipo, data e estágio; remover "Prioridades a visitar".
4. **3.4 — Avançar funil + permissões**: ações negociação/fechado/nao_participa (só Direção) + cancelamento com motivo (comissão e Direção) + audit_log em tudo.
5. **3.5 — depois**: relatório mensal em cima disso (marcados no mês, o que virou negociação, o que fechou, o que não participou, cancelamentos e motivos).

---

## 11. O que NÃO pode quebrar

- **Login / middleware / módulos adormecidos** (gestor, advogado, clienteQR) — não tocar.
- `middleware.ts` continua sendo o **único** guardião de auth.
- Status são **strings** (`owner`/`comissao`/... e `nao_visitada`/`marcada`/...), nunca número.
- Migração sempre **aditiva** (sem DROP de dados/tabelas).
