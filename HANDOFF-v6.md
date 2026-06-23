# Advocacia Dativa — Documento de Handoff v6
**Comissão de Desenvolvimento da Advocacia Dativa / OAB-RJ**
Atualizado em: sessão de deploy + primeiro login com Edgard (appsone26) — 23/06/2026

---

## 🎯 COMO CONTINUAR NUMA NOVA CONVERSA

Cole este documento no início da próxima conversa e diga:

> "Aqui está o handoff v6 do projeto Advocacia Dativa. O frontend (Tijolos 1 e 2) está NO AR no Vercel em https://advocacia-dativa-oab.vercel.app e o LOGIN JÁ FUNCIONA (a Dra. Patrícia loga e cai no dashboard owner). Vamos começar o Tijolo 3: o shell do sistema (sidebar, header com busca, sininho de notificações e dark mode)."

Anexe também o ZIP `advocacia-dativa-COMPLETO.zip` (backup de todo o código).

---

## 1. O QUE FOI CONQUISTADO NESTA SESSÃO ✅

Partimos do zero (Edgard sem nada instalado) e colocamos o sistema NO AR.

### Decisões de arquitetura tomadas
- **Stack confirmada**: Next.js 14 + Tailwind CSS + @supabase/ssr + Resend + Vercel
- **Modo de trabalho**: 100% pelo navegador (Edgard não instala nada localmente — código vive no GitHub, Vercel builda automaticamente)
- **Nível do usuário**: confirmado que fica no JWT (user_metadata = raw_user_meta_data), lido pelo middleware sem query ao banco

### Correção crítica de alinhamento com o banco
- **Nível é TEXTO, não número.** Constraint real do banco:
  `CHECK (nivel = ANY (ARRAY['owner','comissao','gestor','advogado','cliente']))`
- Todo o frontend foi ajustado para usar essas strings.

### Trigger do Supabase atualizado ✅ (JÁ RODADO)
O trigger `handle_new_user` foi atualizado para copiar municipio_id, oab_numero,
cargo e primeiro_acesso do metadata para a tabela profiles. SQL já executado com sucesso.

### Deploy bem-sucedido ✅
- Repo GitHub renomeado: `advocacia-ativa-oab` → **`advocacia-dativa-oab`**
- Projeto Next.js subido no GitHub (estrutura correta, sem pasta duplicada)
- Conectado ao Vercel, 7 variáveis de ambiente configuradas
- 3 erros de build corrigidos (ver seção 4)
- **SISTEMA NO AR**: https://advocacia-dativa-oab.vercel.app
- Tela de login institucional funcionando, middleware redirecionando corretamente

### PRIMEIRO LOGIN FUNCIONANDO ✅ (validado nesta sessão)
- A Dra. Patrícia já existia no Supabase Auth (UID 8751fdf2-eee7-4743-8a03-4db588f6a245),
  mas o metadata dela só tinha `email_verified` — FALTAVA o nível.
- Corrigido via SQL: adicionado `nivel: 'owner'`, `nome`, `primeiro_acesso: false` no
  raw_user_meta_data E no profile.
- Senha definida via SQL como `Dativa@2026`.
- **LOGIN TESTADO E FUNCIONANDO**: ela loga e o middleware a leva corretamente para
  /dashboard/owner ("Olá, Dra. Patrícia Pacheco"). Ciclo de auth 100% validado de
  ponta a ponta.

---

## 2. TIJOLOS — STATUS ATUAL

- [x] **Tijolo 1 — Fundação** ✅ (Next.js, Tailwind com cores Dativa, Supabase clients, middleware, types)
- [x] **Tijolo 2 — Auth completa** ✅ (login, primeiro-acesso, esqueci-senha + redefinir-senha via Resend, deploy no ar, PRIMEIRO LOGIN VALIDADO)
- [ ] **Tijolo 3 — Shell do sistema** (sidebar, header, busca universal, sininho de notificações, dark mode) ← PRÓXIMO (detalhado na seção 3)
- [ ] Tijolo 4 — Painel do Gestor
- [ ] Tijolo 5 — Painel do Advogado
- [ ] Tijolo 6 — QR Code / Auto-cadastro Cliente
- [ ] Tijolo 7 — Dashboard Owner (reaproveitar o HTML em /public/dashboard-referencia.html, mas com dados ao vivo)
- [ ] Tijolo 8 — Relatórios + Auditoria
- [ ] Tijolo 9 — Tela da Comissão (única ainda não prototipada)
- [ ] Tijolo 10 — Refinamentos finais

### Credenciais de login que JÁ funcionam (para testes)
- Email: advocaciadativarj@gmail.com
- Senha: Dativa@2026
- Resultado: cai em /dashboard/owner

---

## 3. PRÓXIMO PASSO IMEDIATO 🔴 — TIJOLO 3: SHELL DO SISTEMA

O ciclo de autenticação está PROVADO. Agora construímos o "esqueleto" visual que
todas as telas internas vão compartilhar. Hoje os dashboards são placeholders soltos;
o Tijolo 3 cria o layout comum.

### O que entra no Tijolo 3
1. **Layout compartilhado** (`src/app/dashboard/layout.tsx`) — um shell que envolve
   todas as rotas /dashboard/* automaticamente.
2. **Sidebar (menu lateral)** — responsiva, com itens que mudam conforme o nível do
   usuário (owner vê tudo; gestor vê só o do município; advogado vê o painel dele).
3. **Header (topo)** — com:
   - Busca universal (advogados + clientes) — campo no topo
   - Sininho de notificações (padrão do "meus processos" — email Resend + bell in-app)
   - Avatar + nome do usuário + menu de logout
4. **Dark mode** — toggle claro/escuro (classe 'dark' já configurada no tailwind.config.ts).
5. **Logout funcional** — botão que encerra a sessão Supabase e volta ao login.

### Ordem sugerida de construção (sub-tijolos do 3)
- 3a. Layout + sidebar estática (visual primeiro, validar no Vercel)
- 3b. Header com avatar/nome + botão de logout funcional
- 3c. Sininho de notificações (visual; ligar ao banco vem depois)
- 3d. Busca universal (campo; lógica de busca vem com os dados)
- 3e. Dark mode (toggle + persistência)

### Decisões a confirmar no início do Tijolo 3
- Qual ícone/biblioteca de ícones usar (sugestão: lucide-react, leve e bonito)
- Estrutura da sidebar por nível (owner/comissao/gestor/advogado têm menus diferentes)
- Onde guardar a preferência de dark mode (localStorage no cliente)

### IMPORTANTE — método de trabalho que deu certo
- Editar/subir arquivos no GitHub → Vercel reconstrói sozinho.
- Para arquivos GRANDES, usar re-upload (Add file → Upload files), NUNCA colar no
  editor do GitHub (corrompe caracteres especiais como `bg-[#f0f4f8]`).
- Testar cada sub-tijolo no Vercel antes de seguir para o próximo.

---

## 4. ERROS DE BUILD JÁ RESOLVIDOS (referência)

Histórico para não repetir:
1. **server.ts:18** — `Parameter 'cookiesToSet' implicitly has 'any' type`
   → Resolvido com `type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }`
2. **middleware.ts** — mesmo erro de tipo no setAll → mesma correção
3. **esqueci-senha/page.tsx** — `useSearchParams() should be wrapped in a suspense boundary`
   → Resolvido separando em componente interno + wrapper com `<Suspense>`

**LIÇÃO IMPORTANTE**: copiar/colar código longo no editor do GitHub CORROMPE caracteres
especiais (ex: `bg-[#f0f4f8]`). Para arquivos grandes, SEMPRE usar re-upload do arquivo
(deletar + Add file → Upload files) em vez de colar no editor. Ou colar via Bloco de Notas
(nunca Word).

---

## 5. INFRAESTRUTURA — CREDENCIAIS E IDs

| Serviço | Detalhe |
|---|---|
| **Supabase** | Org: Advocacia Dativa OAB-RJ · Projeto: `nuktbdkbiiqymustpdsd` · região sa-east-1 |
| Supabase login | advocaciadativarj@gmail.com |
| Supabase URL | https://nuktbdkbiiqymustpdsd.supabase.co |
| **Chaves Supabase** | Usar as LEGACY (formato `eyJ...`), NÃO as novas `sb_publishable`/`sb_secret` — o @supabase/ssr espera o formato clássico |
| **Resend** | Domínio: dativa.appsone.com.br · API key: `supabase-dativa` (re_cB36x...) · remetente: noreply@dativa.appsone.com.br |
| **GitHub** | appsone26 / repo `advocacia-dativa-oab` |
| **Vercel** | Equipe: appsone (Hobby) · projeto advocacia-dativa-oab |
| **URL do app (limpa)** | https://advocacia-dativa-oab.vercel.app |

### As 7 variáveis de ambiente no Vercel (todas configuradas ✅)
1. NEXT_PUBLIC_SUPABASE_URL = https://nuktbdkbiiqymustpdsd.supabase.co
2. NEXT_PUBLIC_SUPABASE_ANON_KEY = (chave legacy anon eyJ...)
3. SUPABASE_SERVICE_ROLE_KEY = (chave legacy service_role)
4. RESEND_API_KEY = (re_...)
5. RESEND_FROM_EMAIL = noreply@dativa.appsone.com.br
6. RESEND_FROM_NAME = Advocacia Dativa OAB-RJ
7. NEXT_PUBLIC_APP_URL = https://advocacia-dativa-oab.vercel.app

---

## 6. BANCO DE DADOS — ESTRUTURA REAL CONFIRMADA

### Tabela `profiles` (colunas reais verificadas nesta sessão)
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | (= auth.users.id) |
| nome | text | |
| email | text | |
| nivel | text | (constraint: owner/comissao/gestor/advogado/cliente) |
| municipio_id | uuid | |
| oab_numero | text | |
| cargo | text | |
| primeiro_acesso | boolean | true |
| ativo | boolean | true |
| criado_em | timestamptz | now() |
| atualizado_em | timestamptz | now() |

⚠️ Note: colunas em PORTUGUÊS (criado_em, atualizado_em, oab_numero) — o type Profile já foi alinhado.

### Funções/triggers existentes no banco
- `handle_new_user` (trigger de criação de profile — JÁ ATUALIZADO nesta sessão)
- `meu_nivel()` → retorna text (usado nas RLS)
- `meu_municipio()` → retorna uuid
- `minhas_regioes()` → retorna text[]
- `set_atualizado_em` (trigger de timestamp)

### Pendência a verificar no Tijolo 5 (Advogado)
A tabela `profiles` tem oab_numero direto, mas NÃO tem colunas de fila (posição,
áreas de atuação, contador de recusas). Verificar se existe tabela separada de
advogados para a lógica de rodízio antes de construir o Painel do Advogado.

(Handoff v4 mencionava 9 tabelas com RLS. Confirmar nomes e estrutura ao chegar nos tijolos que dependem delas: casos, recusas, notificacoes, configuracoes, etc.)

---

## 7. IDENTIDADE VISUAL (no tailwind.config.ts)

- Azul principal `dativa-800`: #1e3a5f
- Azul médio `dativa-700`: #2d5986
- Dourado `ouro-600`: #c9a227
- Fundo: #f0f4f8
- Sucesso: #10b981 · Alerta: #f59e0b · Erro: #ef4444
- Dark mode: classe 'dark' (a implementar no Tijolo 3)

---

## 8. REGRAS DE NEGÓCIO (carregar adiante — do handoff v4)

### 5 níveis de usuário
1. Cliente — auto-cadastro via QR Code, define própria senha (primeiro_acesso = false)
2. Advogado — cadastrado pelo gestor, senha Dativa@2026, troca obrigatória
3. Gestor Municipal — um por cidade, cadastra advogados, linka clientes, define prioridade
4. Membro da Comissão — acesso configurável por região
5. Owner (Dra. Patrícia) — acesso total aos 92 municípios

### Fila de rodízio
- Posição = ordem de cadastro · filtro por área
- Prazo padrão 2 dias · máx recusas padrão 3 (configurável pelo gestor)
- Recusa exige motivo obrigatório · sem resposta no prazo = recusa automática
- Estourou recusas = eliminado do programa · após concluir = volta ao fim da fila
- Pagamento só com confirmação do cliente
- ANTIFRAUDE: número do processo obrigatório antes de concluir caso

### Áreas jurídicas e prioridade
- Violência doméstica 🔴 prioritário · Família/Alimentos 🟡 prazo reduzido
- Imobiliário / Outros ⚪ ordem de chegada
- Prioridade real definida pelo gestor, não pelo cliente

### Funcionalidades confirmadas (carregar adiante)
Notificações (email Resend + sininho + massa) · ajuda contextual por nível ·
busca universal · exportação PDF/Excel · relatórios por período/região/área ·
documentos por município · auditoria com diff (só owner) · logo por município ·
dark mode · LGPD (cliente 2 checkboxes, advogado aceite) · senha padrão Dativa@2026.

---

## 9. PROTÓTIPOS VISUAIS (referência de design)

8 telas já prototipadas (no arquivo Advocacia_Dativa_Prototipos.html do projeto):
1. Dashboard Owner · 2. Gestor Municipal · 3. Modais do Gestor ·
4. Painel do Advogado · 5. Auto-cadastro Cliente (QR Code) ·
6. Login + Primeiro Acesso · 7. Relatórios · 8. Auditoria
Pendente prototipar: Tela da Comissão.

O HTML original (dashboard dos 92 municípios) está em /public/dashboard-referencia.html
— vira o Dashboard Owner real no Tijolo 7, mas puxando dados ao vivo do Supabase.

---

## 10. ESTRUTURA DE ROTAS (já no ar)

```
/                        → Redireciona por nível (middleware)
/auth/login              → Pública — login ✅ funcionando
/auth/esqueci-senha      → Pública — recuperação ✅
/auth/redefinir-senha    → Define nova senha após link ✅
/auth/confirmar          → Valida token do email ✅
/auth/primeiro-acesso    → Troca de senha obrigatória ✅
/cadastro/[municipio]    → Pública — QR Code cliente (Tijolo 6, ainda placeholder)
/dashboard/gestor        → Nível gestor (placeholder)
/dashboard/advogado      → Nível advogado (placeholder)
/dashboard/owner         → Nível owner (placeholder)
/dashboard/comissao      → Nível comissao (placeholder)
/api/recuperar-senha     → Gera link + envia email via Resend ✅
```

---

## 11. COMO O FLUXO DE DEPLOY FUNCIONA (para Edgard lembrar)

1. Editar/subir arquivo no GitHub (repo advocacia-dativa-oab)
2. Vercel detecta o commit AUTOMATICAMENTE e reconstrói
3. Se der erro: ver o log em Deployments → clicar no deploy → ler as últimas linhas
4. Corrigir o arquivo → commitar → Vercel reconstrói sozinho de novo
5. Variáveis de ambiente: ao mudar, precisa fazer "Redeploy" manual para valer

NÃO precisa de terminal nem instalar nada. Tudo pelo navegador.
