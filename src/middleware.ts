// ============================================================
// MIDDLEWARE — Advocacia Dativa
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { NivelUsuario } from '@/types'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/esqueci-senha',
  '/auth/primeiro-acesso',
]

const isPublicCadastro = (path: string) => path.startsWith('/cadastro/')

// Rotas compartilhadas — acessíveis por qualquer usuário autenticado
const SHARED_ROUTES = [
  '/dashboard/relatorios',
  '/dashboard/auditoria',
]

const DASHBOARD_POR_NIVEL: Record<NivelUsuario, string> = {
  cliente:  '/auth/login',
  advogado: '/dashboard/advogado',
  gestor:   '/dashboard/gestor',
  comissao: '/dashboard/comissao',
  owner:    '/dashboard/owner',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Rota raiz
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

  // 2. Rotas públicas
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    isPublicCadastro(pathname)
  ) {
    if (user && pathname === '/auth/login') {
      const nivel = user.user_metadata?.nivel as NivelUsuario
      const dashboard = DASHBOARD_POR_NIVEL[nivel]
      if (dashboard && dashboard !== '/auth/login') {
        return NextResponse.redirect(new URL(dashboard, request.url))
      }
    }
    return supabaseResponse
  }

  // 3. Sem sessão → login
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const nivel = user.user_metadata?.nivel as NivelUsuario
  const primeiroacesso = user.user_metadata?.primeiro_acesso as boolean

  // 4. Primeiro acesso → troca de senha
  if (primeiroacesso && !pathname.startsWith('/auth/primeiro-acesso')) {
    return NextResponse.redirect(new URL('/auth/primeiro-acesso', request.url))
  }

  // 5. Verificação de permissão por rota de dashboard
  if (pathname.startsWith('/dashboard/')) {
    // Rotas compartilhadas — qualquer nível autenticado pode acessar
    const isShared = SHARED_ROUTES.some(route => pathname.startsWith(route))
    if (isShared) {
      return supabaseResponse
    }

    const dashboardCorreto = DASHBOARD_POR_NIVEL[nivel]
    if (dashboardCorreto && !pathname.startsWith(dashboardCorreto)) {
      return NextResponse.redirect(new URL(dashboardCorreto, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
