# DESENHO TÉCNICO — Fila da Direção (Tijolinho 3.3 ampliado)
**Projeto:** Advocacia Dativa OAB-RJ · **Versão:** v1 · **Data:** 15/07/2026
**Base:** relatório de inspeção do Claude Code (código real do `OwnerDashboard`).

> **3.3 absorveu o 3.4** (decisão do Edgard: montar fila + caixa + botões num tijolo só,
> alinhado à estratégia top-down da demo da Defensoria).

---

## 1. Objetivo

Transformar a tela `/dashboard/owner` de uma **lista morta dos 92 municípios** (ordem
alfabética) numa **FILA DE TRABALHO**: só as cidades que têm compromisso, ordenadas por
data, com um contador de progresso no topo e uma caixa de ação ao clicar na cidade.

---

## 2. Arquivos afetados (do relatório)

| Arquivo | O que muda |
|---|---|
| `src/app/dashboard/owner/page.tsx` | Passa a buscar **também a `agenda`** (hoje só lê `municipios`) e repassa os eventos ao componente. |
| `src/components/dashboard/OwnerDashboard.tsx` | Monta a fila cruzando município × agenda; contador no topo; **remove `Prioritarias`**; `PainelCidade` lateral → **modal/caixa central** com botões; corrige `ORDEM_STATUS`. |
| `src/app/api/municipios/atualizar/route.ts` | **Já existe** (3.2). Reusar para as ações de funil (avançar / não quer / finalizou). |
| `src/app/api/agenda/atualizar/route.ts` | **NOVO** (Claude Code confirma que não existe). Remarcar e cancelar evento + audit. |

Fora de escopo (não mexer): `AgendaPanel.tsx`, `dashboard/layout.tsx`, `middleware.ts`,
`src/app/layout.tsx`, módulos adormecidos.

---

## 3. Dados / queries

### 3.1 `owner/page.tsx` (server) — passa a puxar dois conjuntos

```ts
// 1) Os 92 municípios — para o CONTADOR e para enriquecer a fila
const { data: municipios } = await supabase
  .from('municipios')
  .select('id, nome, regiao, logo_url, status_atendimento, populacao, distancia_capital_km, atualizado_em')

// 2) Eventos da agenda (não cancelados) com município vinculado — para a FILA
const { data: eventos } = await supabase
  .from('agenda')
  .select('id, titulo, tipo, municipio_id, data_inicio, data_fim, responsavel, status_reuniao, descricao')
  .not('municipio_id', 'is', null)
  .neq('status_reuniao', 'cancelada')
  .order('data_inicio', { ascending: true })

return <OwnerDashboard municipios={municipios ?? []} eventos={eventos ?? []} />
```

RLS: o owner já lê `agenda` hoje (é o mesmo acesso do `AgendaPanel`). Sem novidade de permissão.

### 3.2 Contador do topo (sobre os 92, no client, sem query extra)

```
total       = municipios.length              // 92
comContato  = municipios.filter(m => m.status_atendimento !== 'nao_visitada').length
faltam      = total - comContato
```

→ **Regra A confirmada:** "já com contato" = qualquer `status_atendimento` ≠ `nao_visitada`
(marcada + negociacao + fechado + nao_participa). Hoje: **4 com contato / 88 faltam**.
Exibir como "termômetro" no topo (ex.: `4 de 92 com contato · faltam 88`), diminuindo o
"faltam" conforme o trabalho anda.

---

## 4. Regras da FILA (montagem no `OwnerDashboard`)

Para cada município, agrupar seus eventos (não cancelados) e calcular:

- `proximo`  = evento com menor `data_inicio` **>= agora** (o próximo compromisso).
- `vencido`  = `true` se **não há** nenhum evento futuro (todos já passaram).
- `refData`  = `data_inicio` do `proximo` se houver; senão o **maior** `data_inicio` passado.

**Quem aparece na fila** (⚠️ **DECISÃO D1**):
- Município com **≥ 1 evento não cancelado** **E** `status_atendimento` **NÃO** em
  (`fechado`, `nao_participa`).
- Racional: fila = trabalho **ativo**. Quem finalizou (`fechado`) ou recusou
  (`nao_participa`) sai da fila, mas continua contado no "com contato" do topo. É assim
  que a fila "diminui conforme o trabalho avança".

**Ordenação** (⚠️ **DECISÃO D2**):
- Ordenar por `refData` **ascendente**. Como datas passadas são menores que futuras, os
  **vencidos sobem naturalmente ao topo** (é o que grita por ação: reagendar). Depois vêm
  os futuros, do mais próximo ao mais distante.
- Badge visual "⏰ vencido — reagendar" nas linhas `vencido = true`.

**Como uma cidade ENTRA na fila:** criando o primeiro evento pra ela no **painel Agenda**
(`/dashboard/owner/agenda`), que já lista os 92 no seletor (feito no 3.2). Ao criar o
evento, o funil já empurra `nao_visitada → marcada` (helper do 3.2) e a cidade passa a
aparecer aqui. **A fila em si não cria eventos** — ela gerencia os que existem.

**Cada linha da fila mostra:** nome · habitantes (`populacao`, formatado pt-BR) · região ·
**estágio** (chip do funil) · **próximo compromisso** (título + tipo + data/hora) · badge de
vencido quando for o caso.

Os filtros atuais (busca / status / região) permanecem, agora operando sobre o subconjunto
com evento.

---

## 5. A CAIXA (modal central) — clicar na cidade

Hoje `PainelCidade` é uma coluna lateral (`w-80 hidden lg:block`). **Vira um modal
centralizado sobre um backdrop** (o Edgard descartou o painel do lado). Ao clicar numa
cidade da fila, abre a caixa mostrando:

- Cabeçalho: nome, região, habitantes, **estágio atual do funil**.
- O **compromisso**: título, tipo, **data/hora sempre exposta**, responsável/anfitrião.
- **Botões de ação** (funcionam inclusive com a data já vencida):

| Botão | Efeito | Grava |
|---|---|---|
| **Remarcar** | Abre seletor de data → atualiza `agenda.data_inicio` (e `data_fim`). Cidade continua no estágio atual. | `agenda.data_inicio`; audit `agenda_remarcar` |
| **Cancelar reunião** | Pede **motivo obrigatório** → `agenda.status_reuniao='cancelada'` + `agenda.motivo_cancelamento`. **Cidade NÃO rebaixa** de estágio. | `agenda`; audit `agenda_cancelar` |
| **Avançar estágio** | `status_atendimento`: `marcada → negociacao → fechado`. Só avança. | `municipios`; audit `funil_avancar` |
| **Não quer** | `status_atendimento = 'nao_participa'`. Motivo opcional (⚠️ **D3**). | `municipios`; audit `funil_nao_participa` |
| **Finalizou** | `status_atendimento = 'fechado'`. | `municipios`; audit `funil_fechar` |

Cores/tokens da caixa: azul `#1e3a5f`, dourado `#c9a227`, fundo `#f0f4f8` (padrão Dativa).
Ícones `lucide-react` (lembrete: `UserShield` não existe → `ShieldCheck`).

Após qualquer ação: fechar a caixa + `router.refresh()` (padrão do 3.2) pra fila e contador
reagirem.

---

## 6. Escrita / API routes + audit_log

- **Funil** (avançar / não quer / finalizou): reusar `api/municipios/atualizar` (já grava no
  schema real do audit desde o 3.2). Claude Code confirma a assinatura antes de reusar.
- **Agenda** (remarcar / cancelar): **novo** `api/agenda/atualizar/route.ts`, espelhando o
  padrão de `api/agenda/criar` (validação + audit best-effort no schema real).

**audit_log — schema REAL (confirmado 15/07), sempre assim:**
`acao` = verbo curto · `tabela`/`registro_id` = alvo (**id como STRING**) · todo o contexto
(cidade, estágio de→para, data de→para, motivo) vai em `valor_antes`/`valor_depois` (jsonb) ·
autor = só `user_id` (nome resolve por JOIN depois). **Nunca** em coluna própria.

Verbos: `funil_avancar`, `funil_nao_participa`, `funil_fechar`, `agenda_remarcar`, `agenda_cancelar`.

---

## 7. Correção obrigatória — `ORDEM_STATUS`

O `OwnerDashboard` usa hoje `['nao_visitada','marcada','realizada','negociacao','fechado']`
(tem `realizada`, falta `nao_participa`) — desalinhado do CHECK real do 3.1:
`('nao_visitada','marcada','negociacao','fechado','nao_participa')`.

Trocar por `['nao_visitada','marcada','negociacao','fechado','nao_participa']` e ajustar
`chaveStatus`, rótulos e cores para incluir **`nao_participa`** e remover **`realizada`**.
Sem isso, o botão "Não quer" produz um status que a tela não sabe pintar.

---

## 8. Invariante (nunca volta pro cinza)

Regra de negócio confirmada pelo Edgard: depois do primeiro contato, a cidade **nunca
retorna** a `nao_visitada`. Garantia técnica:
- O funil só **avança** (as ações nunca escrevem `nao_visitada`).
- **Cancelar reunião** toca só `agenda.status_reuniao` — **não** mexe em
  `status_atendimento`. "Desmarcaram a reunião, mas a cidade continua marcada" é exatamente
  o comportamento dos **dois status separados** (`status_reuniao` no evento × `status_atendimento`
  na cidade).

---

## 9. Fora de escopo do 3.3 (registrar, não fazer)

- Remoção do tipo "Visita municipal" (deixar tudo como reunião) — **decisão adiada**.
- Lembretes de e-mail de compromisso (Resend + Vercel Cron) — tijolinho futuro.
- Limpeza dos eventos de teste (teste8, t11, t13…) — fazer **ao fim do 3.3** (o 3.3 vai
  gerar mais teste). SQL de DELETE a preparar na hora.
- Edição de agenda pela **comissão** (permissão `editar_agenda`) — vive no painel da
  comissão, tela separada. Esta tela (`/dashboard/owner`) é **só do owner** (⚠️ **D5**).

---

## 10. ⚠️ DECISÕES A CONFIRMAR (antes de instruir o Claude Code)

- **D1 — quem sai da fila:** cidade `fechado`/`nao_participa` some da fila (continua no
  contador). *Default proposto: sim.*
- **D2 — ordenação:** por data ascendente → vencidos no topo, depois futuros do mais
  próximo ao mais distante. *Default proposto: sim.*
- **D3 — "Não quer" exige motivo escrito?** *Default proposto: motivo **opcional*** (o
  cancelamento de reunião é que tem motivo **obrigatório**, via `agenda.motivo_cancelamento`).
- **D4 — cancelar reunião:** motivo obrigatório, `status_reuniao='cancelada'`, cidade não
  rebaixa. *Default proposto: sim.*
- **D5 — permissão:** ações só para o owner nesta tela; comissão fica de fora do 3.3.
  *Default proposto: sim.*

---

## 11. Como implementar (mesmo fluxo git do 3.2)

1. Claude Code implementa tudo → `npm run build` verde → **PARA** (sem commit/push).
2. Reviso os diffs com o Edgard.
3. `git checkout -b feat/fila-direcao-3.3` → `git add` dos arquivos certos → `commit`.
4. `git push -u origin feat/fila-direcao-3.3` (empurra a **branch**, não a main).
5. Abrir PR pelo navegador (base: main ← compare: branch).
6. Vercel gera **preview** (banco real, produção intacta) → testar fluxo real.
7. Rodar SELECTs de validação no Supabase (fila, contador, audit_log).
8. Só então: "Merge pull request" → deploy de produção.

Botão do Claude Code: **sempre "1 (Yes)"**. Isolamento absoluto (repo `advocacia-dativa-oab`
+ Supabase `nuktbdkbiiqymustpdsd`; "meus processos" intocável).
