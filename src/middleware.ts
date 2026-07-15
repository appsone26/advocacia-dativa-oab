// ============================================================
// MIDDLEWARE — Advocacia Dativa
// Único guardião de auth. Agora também lê os interruptores de
// módulos (src/config/modulos.ts) para adormecer painéis inteiros
// sem apagar nada. Toda a lógica anti-loop foi preservada.
// ============================================================
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { NivelUsuario } from '@/types'
import { MODULOS } from '@/config/modulos'

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
  '/dashboard/usuarios',
]

const DASHBOARD_POR_NIVEL: Record<NivelUsuario, string> = {
  cliente:  '/auth/login',
  advogado: '/dashboard/advogado',
  gestor:   '/dashboard/gestor',
  comissao: '/dashboard/comissao',
  owner:    '/dashboard/owner',
}

// ── Interruptores de módulos ──────────────────────────────────
// Prefixos de dashboard que somem quando o módulo está adormecido.
const ROTAS_MODULO: Array<{ prefixo: string; modulo: keyof typeof MODULOS }> = [
  { prefixo: '/dashboard/gestor',   modulo: 'gestor' },
  { prefixo: '/dashboard/advogado', modulo: 'advogado' },
]

// Níveis cujo dashboard depende de um módulo que pode estar desligado.
const MODULO_DO_NIVEL: Partial<Record<NivelUsuario, keyof typeof MODULOS>> = {
  gestor:   'gestor',
  advogado: 'advogado',
}

// true se o nível tem um destino válido (módulo ligado). Owner, comissão
// e cliente não dependem de flag aqui, então retornam true.
function nivelAtivo(nivel: NivelUsuario): boolean {
  const mod = MODULO_DO_NIVEL[nivel]
  if (!mod) return true
  return MODULOS[mod] === true
}
// ──────────────────────────────────────────────────────────────

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
      // Só manda pro dashboard se o módulo daquele nível estiver ligado.
      if (dashboard && dashboard !== '/auth/login' && nivelAtivo(nivel)) {
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
    // Cadastro público adormecido → volta pro login (sem QR Code por ora).
    if (isPublicCadastro(pathname) && !MODULOS.clienteQR) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    // Bounce login→dashboard só se o nível estiver ativo (evita loop).
    if (user && pathname === '/auth/login') {
      const nivel = user.user_metadata?.nivel as NivelUsuario
      const dashboard = DASHBOARD_POR_NIVEL[nivel]
      if (dashboard && dashboard !== '/auth/login' && nivelAtivo(nivel)) {
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
    // 5.a Módulo adormecido → bloqueia a rota inteira (manda pro login).
    for (const { prefixo, modulo } of ROTAS_MODULO) {
      if (pathname.startsWith(prefixo) && !MODULOS[modulo]) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }

    // Rotas compartilhadas — qualquer nível autenticado pode acessar.
    const isShared = SHARED_ROUTES.some(route => pathname.startsWith(route))
    if (isShared) {
      return supabaseResponse
    }

    // 5.b Nível sem destino válido (módulo desligado) → login, sem loop.
    if (!nivelAtivo(nivel)) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
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
