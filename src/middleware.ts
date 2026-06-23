// ============================================================
// MIDDLEWARE — Advocacia Dativa
// Intercepta TODA requisição e decide o que fazer com ela.
//
// Lógica:
//  1. Renova a sessão Supabase (cookie)
//  2. Rotas públicas → deixa passar
//  3. Sem sessão → redireciona para /login
//  4. primeiro_acesso = true → força /auth/primeiro-acesso
//  5. Rota errada para o nível → redireciona ao dashboard correto
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { NivelUsuario } from '@/types'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/esqueci-senha',
  '/auth/primeiro-acesso',
]

// Rota pública de auto-cadastro do cliente via QR Code
const isPublicCadastro = (path: string) => path.startsWith('/cadastro/')

// Dashboard correto para cada nível
const DASHBOARD_POR_NIVEL: Record<NivelUsuario, string> = {
  cliente:  '/auth/login',          // Cliente não faz login no painel
  advogado: '/dashboard/advogado',
  gestor:   '/dashboard/gestor',
  comissao: '/dashboard/comissao',
  owner:    '/dashboard/owner',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cria o cliente Supabase com acesso aos cookies da request
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Sempre chame getUser() para renovar o token.
  // Nunca use getSession() no middleware — é menos seguro.
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Rota raiz — redireciona sempre (logado → dashboard, deslogado → login)
  if (pathname === '/') {
    if (user) {
      const nivel = user.user_metadata?.nivel as NivelUsuario
      const dashboard = DASHBOARD_POR_NIVEL[nivel]
      if (dashboard && dashboard !== '/auth/login') {
        return NextResponse.redirect(new URL(dashboard, request.url))
      }
    }
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Rotas públicas — deixa passar sem verificação
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    isPublicCadastro(pathname)
  ) {
    // Se já está logado e tenta acessar /login, redireciona ao dashboard
    if (user && pathname === '/auth/login') {
      const nivel = user.user_metadata?.nivel as NivelUsuario
      const dashboard = DASHBOARD_POR_NIVEL[nivel]
      if (dashboard && dashboard !== '/auth/login') {
        return NextResponse.redirect(new URL(dashboard, request.url))
      }
    }
    return supabaseResponse
  }

  // 2. Sem sessão → redireciona para login
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Usuário autenticado — lê metadados do JWT (sem query ao banco)
  const nivel = user.user_metadata?.nivel as NivelUsuario
  const primeiroacesso = user.user_metadata?.primeiro_acesso as boolean

  // 4. Primeiro acesso → força troca de senha
  if (primeiroacesso && !pathname.startsWith('/auth/primeiro-acesso')) {
    return NextResponse.redirect(new URL('/auth/primeiro-acesso', request.url))
  }

  // 5. Verificação de permissão por rota de dashboard
  if (pathname.startsWith('/dashboard/')) {
    const dashboardCorreto = DASHBOARD_POR_NIVEL[nivel]

    // Se está tentando acessar um dashboard que não é o seu → redireciona
    if (dashboardCorreto && !pathname.startsWith(dashboardCorreto)) {
      return NextResponse.redirect(new URL(dashboardCorreto, request.url))
    }
  }

  return supabaseResponse
}

// Aplica o middleware em todas as rotas EXCETO arquivos estáticos e _next
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
