# Advocacia Dativa — Frontend

**Comissão de Desenvolvimento da Advocacia Dativa · OAB-RJ**

Stack: Next.js 14 · Tailwind CSS · Supabase · Vercel

---

## Setup inicial (Tijolo 1)

### 1. Criar o projeto Next.js

```bash
# Na pasta onde você quer criar o projeto
npx create-next-app@14 advocacia-dativa \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 2. Instalar dependências do Supabase

```bash
cd advocacia-dativa
npm install @supabase/supabase-js @supabase/ssr
```

### 3. Copiar os arquivos deste pacote

Substitua os arquivos gerados pelo create-next-app pelos arquivos deste pacote,
mantendo a estrutura de pastas.

### 4. Configurar variáveis de ambiente

```bash
# Copie o template
cp .env.local.example .env.local

# Edite o .env.local com os valores reais:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - RESEND_API_KEY
```

As chaves do Supabase estão em:
https://supabase.com/dashboard/project/nuktbdkbiiqymustpdsd/settings/api

### 5. Adicionar .env.local ao .gitignore

```bash
echo ".env.local" >> .gitignore
```

### 6. Testar localmente

```bash
npm run dev
# Acesse http://localhost:3000
```

### 7. Deploy no Vercel

```bash
# Instalar a CLI do Vercel (se não tiver)
npm i -g vercel

# Login com a conta GitHub appsone26
vercel login

# Fazer o primeiro deploy
vercel

# Configurar as variáveis de ambiente no painel Vercel:
# https://vercel.com/appsone26/advocacia-dativa/settings/environment-variables
# (mesmos valores do .env.local)
```

---

## Pré-requisito do Supabase — IMPORTANTE

Antes de testar o login, confirme que o trigger de criação de profile
está populando o `user_metadata` com o nível do usuário.

Abra o SQL Editor do Supabase e verifique se o trigger inclui:

```sql
-- No trigger handle_new_user (ou similar):
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'nivel',         NEW.nivel,
  'nome',          NEW.nome,
  'municipio_id',  NEW.municipio_id,
  'primeiro_acesso', NEW.primeiro_acesso
)
WHERE id = NEW.id;
```

Isso é fundamental para o middleware funcionar sem queries extras ao banco.

---

## Estrutura de rotas

```
/                        → Redireciona por nível (middleware)
/auth/login              → Pública — tela de login
/auth/esqueci-senha      → Pública — recuperação de senha
/auth/primeiro-acesso    → Protegida — troca de senha obrigatória
/cadastro/[municipio]    → Pública — QR Code cliente (Tijolo 6)
/dashboard/gestor        → Nível 3 (Tijolo 4)
/dashboard/advogado      → Nível 2 (Tijolo 5)
/dashboard/owner         → Nível 5 (Tijolo 7)
/dashboard/comissao      → Nível 4 (Tijolo 9)
```

---

## Status dos tijolos

- [x] Tijolo 1 — Fundação
- [x] Tijolo 2 — Auth completa (login, primeiro-acesso, esqueci-senha via Resend)
- [ ] Tijolo 3 — Shell do sistema (sidebar, header, notificações, dark mode)
- [ ] Tijolo 4 — Painel do Gestor
- [ ] Tijolo 5 — Painel do Advogado
- [ ] Tijolo 6 — QR Code / Auto-cadastro Cliente
- [ ] Tijolo 7 — Dashboard Owner
- [ ] Tijolo 8 — Relatórios + Auditoria
- [ ] Tijolo 9 — Tela da Comissão
- [ ] Tijolo 10 — Refinamentos finais

---

## Fluxo de recuperação de senha (Tijolo 2)

Fluxo customizado com email institucional via Resend:

1. Usuário acessa `/auth/esqueci-senha` e informa o email
2. `POST /api/recuperar-senha` gera um link de recuperação no Supabase
   (sem disparar o email do Supabase) e envia o link com o template
   da Dativa via Resend
3. Usuário clica no link → cai em `/auth/confirmar` → token validado,
   sessão criada
4. Redireciona para `/auth/redefinir-senha` → usuário cria a nova senha
5. Sessão encerrada → volta ao login

Por segurança, o sistema sempre responde "email enviado" mesmo que o
email não exista — não revela quais contas estão cadastradas.

**Requisitos de ambiente para o Tijolo 2:**
- `SUPABASE_SERVICE_ROLE_KEY` (gera o link de recuperação)
- `RESEND_API_KEY` (envia o email)
- `RESEND_FROM_EMAIL` e `RESEND_FROM_NAME`
- `NEXT_PUBLIC_APP_URL` (monta o link; em dev = http://localhost:3000)
