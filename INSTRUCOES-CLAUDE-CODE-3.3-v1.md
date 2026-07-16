========================================================================
INSTRUÇÃO CLAUDE CODE — Tijolinho 3.3 (Fila da Direção) — v1
========================================================================

### 0. ISOLAMENTO E REGRAS (não negociável)
- Você só atua no repo `advocacia-dativa-oab` e no Supabase `nuktbdkbiiqymustpdsd`
  (sa-east-1). A conta `appsone26` também tem o projeto "meus processos" — INTOCÁVEL:
  não abrir, ler, clonar ou copiar nada dele.
- Em QUALQUER confirmação, use sempre a opção "1 (Yes)". Nunca "2 (don't ask again)".
- **NÃO crie branch, NÃO faça commit, NÃO faça push.** Sua entrega é: implementar +
  `npm run build` verde + PARAR + me relatar os diffs. Eu reviso antes de qualquer git.
- Migrações são ADITIVAS. Status são STRINGS. `lucide-react` v0.383.0: use `ShieldCheck`
  (não existe `UserShield`).
- NÃO mexer em: `middleware.ts`, `src/app/layout.tsx`, `dashboard/layout.tsx`,
  `AgendaPanel.tsx`, módulos adormecidos em `src/config/modulos.ts`.

### 0.1 PASSO ZERO — reinspecionar antes de escrever
Antes de editar, RELEIA e me confirme em 2 linhas cada:
- `src/components/dashboard/OwnerDashboard.tsx` (inteiro).
- `src/app/dashboard/owner/page.tsx`.
- `src/app/api/municipios/atualizar/route.ts` — qual a assinatura do body? (quais campos
  aceita, como grava no `audit_log`). Vou reusá-la para as ações de funil.
- Existe `src/app/api/agenda/atualizar/route.ts`? (esperado: NÃO). E como é o
  `src/app/api/agenda/criar/route.ts` (vou espelhar o padrão de audit dele).

Só depois disso, implemente o que segue.

------------------------------------------------------------------------
### CONTEXTO — schema real (confirmado por SELECT em 15/07)

`municipios`: id, nome, regiao, logo_url, status_atendimento, populacao,
distancia_capital_km, atualizado_em, gestor_id, prazo_resposta_dias, max_recusas,
status_parceria, criado_em.
- `status_atendimento` CHECK = ('nao_visitada','marcada','negociacao','fechado','nao_participa').
- `populacao` já preenchida (Censo 2022) nos 92.

`agenda`: id (uuid), titulo, descricao, tipo, municipio_id (uuid, nullable), data_inicio,
data_fim, criado_por, criado_em, responsavel (text), status_reuniao
(CHECK: 'marcada'/'realizada'/'cancelada'), relatorio, motivo_cancelamento (text, nullable).

`audit_log` (schema REAL): id (bigint), user_id (uuid), acao (text), tabela (text),
registro_id (text), valor_antes (jsonb), valor_depois (jsonb), ip_address (text),
criado_em (timestamptz).
→ Gravar: `acao`=verbo curto; `tabela`/`registro_id`=alvo (**id como STRING**); todo o
contexto vai em `valor_antes`/`valor_depois` (jsonb); autor = só `user_id`. NUNCA inventar
colunas (não existem `usuario_nome`, `detalhe`, `municipio_id` etc. no audit_log).

------------------------------------------------------------------------
### A) `src/app/dashboard/owner/page.tsx` — passar a ler a agenda

Além do SELECT atual de `municipios`, buscar os eventos e repassar:

```ts
const { data: municipios } = await supabase
  .from('municipios')
  .select('id, nome, regiao, logo_url, status_atendimento, populacao, distancia_capital_km, atualizado_em')

const { data: eventos } = await supabase
  .from('agenda')
  .select('id, titulo, tipo, municipio_id, data_inicio, data_fim, responsavel, status_reuniao, descricao')
  .not('municipio_id', 'is', null)
  .neq('status_reuniao', 'cancelada')
  .order('data_inicio', { ascending: true })

return <OwnerDashboard municipios={municipios ?? []} eventos={eventos ?? []} />
```
(Remover o `.order('nome')` — a ordenação da fila passa a ser por data, no componente.)

------------------------------------------------------------------------
### B) `src/components/dashboard/OwnerDashboard.tsx`

**B1. Corrigir `ORDEM_STATUS` (obrigatório).** Hoje é
`['nao_visitada','marcada','realizada','negociacao','fechado']`. Trocar por
`['nao_visitada','marcada','negociacao','fechado','nao_participa']` e ajustar
`chaveStatus`, rótulos e cores: incluir `nao_participa` (ex.: rótulo "Não participa",
cor neutra/vermelha) e remover `realizada`.

**B2. Contador no topo** (sobre os 92):
```
total = municipios.length
comContato = municipios.filter(m => m.status_atendimento !== 'nao_visitada').length
faltam = total - comContato
```
Exibir em destaque no topo: ex. "🎯 {comContato} de {total} com contato · faltam {faltam}".

**B3. Montar a FILA** (novo `useMemo`, recebendo `eventos`):
Para cada `municipio_id` presente em `eventos`, calcular:
- `proximo` = evento com menor `data_inicio >= agora`.
- `vencido` = true se não houver evento futuro.
- `refData` = `data_inicio` do `proximo`, senão o MAIOR `data_inicio` passado.

Regra de quem aparece (D1): incluir o município se tem ≥1 evento **E**
`status_atendimento` NÃO em ('fechado','nao_participa'). Enriquecer cada item com os dados
do município (nome, populacao, regiao, status_atendimento).
Ordenar (D2): por `refData` ASCENDENTE (vencidos, por terem data passada, sobem ao topo).

A lista renderizada substitui a lista alfabética de hoje. Manter os filtros
busca/status/região operando sobre essa fila. Cada linha: nome · habitantes (`populacao`
formatado pt-BR, ex. `1.234.567`) · região · chip de estágio · próximo compromisso (título
+ tipo + data/hora) · badge "⏰ vencido — reagendar" quando `vencido`.

**B4. Remover a seção `Prioritarias`** ("Prioritárias a visitar"): apagar o cálculo
`prioritarias`, o componente `Prioritarias` e o ramo que o renderiza na coluna direita.

**B5. `PainelCidade` lateral → MODAL central (a "caixa").**
Ao clicar numa cidade da fila, abrir um modal centralizado sobre backdrop
(`fixed inset-0`, card central) — não mais a coluna `w-80` lateral. Conteúdo:
- Cabeçalho: nome, região, habitantes, estágio atual do funil.
- Compromisso: título, tipo, **data/hora sempre visível**, responsável.
- Botões de ação (funcionam mesmo com data vencida):
  - **Remarcar** → seletor de data → chama a API de agenda (data_inicio/data_fim).
  - **Cancelar reunião** → pede **motivo obrigatório** → API agenda (status_reuniao=
    'cancelada' + motivo_cancelamento). A CIDADE NÃO REBAIXA de estágio.
  - **Avançar estágio** → API municipios: marcada→negociacao→fechado (só avança).
  - **Não quer** → API municipios: status_atendimento='nao_participa'. Motivo OPCIONAL.
  - **Finalizou** → API municipios: status_atendimento='fechado'.
- Após qualquer ação: fechar o modal + `router.refresh()`.

Tokens Dativa: azul `#1e3a5f`, dourado `#c9a227`, fundo `#f0f4f8`.

------------------------------------------------------------------------
### C) `src/app/api/agenda/atualizar/route.ts` (NOVO)

Espelhar o padrão de `api/agenda/criar` (validação + audit best-effort no schema real).
Dois modos no body (ex. `{ acao: 'remarcar' | 'cancelar', id, ... }`):
- `remarcar`: valida `data_inicio` (e `data_fim`); UPDATE em `agenda`. Audit:
  acao='agenda_remarcar', tabela='agenda', registro_id=id (string),
  valor_antes={data_inicio antiga}, valor_depois={data_inicio nova}.
- `cancelar`: exige `motivo` não vazio (`.trim()`); UPDATE status_reuniao='cancelada' +
  motivo_cancelamento. Audit: acao='agenda_cancelar', valor_depois={motivo}.
  NÃO tocar em `municipios`.

### D) Ações de funil → reusar `api/municipios/atualizar`
Se a rota existente já aceita atualizar `status_atendimento` com audit, reusá-la para
avançar/não-quer/finalizou. **Trava de invariante:** as ações NUNCA escrevem
`nao_visitada`. Se a rota não suportar algum caso, me avise antes de criar rota nova.

------------------------------------------------------------------------
### FECHAMENTO
1. `npm run build` até ficar VERDE. Se quebrar por falta de env (Resend instanciado no topo
   de algumas rotas), rode o build com env vars PLACEHOLDER FALSAS (não reais) só para
   compilar — não configure credenciais reais.
2. PARE. Não faça branch/commit/push.
3. Me relate: lista de arquivos alterados/criados + o `git diff` (ou os trechos-chave) de
   cada um, e qualquer decisão que você teve que tomar. Espero minha revisão antes do git.
========================================================================
