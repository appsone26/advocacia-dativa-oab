import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignora arquivos estáticos explicitamente
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

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

  // Rotas públicas — nunca redireciona
  const publicPaths = [
    '/auth/login',
    '/auth/esqueci-senha',
    '/auth/primeiro-acesso',
    '/auth/confirmar',
    '/auth/redefinir-senha',
  ]
  const isPublic = publicPaths.some(p => pathname.startsWith(p)) || pathname.startsWith('/cadastro/')

  if (isPublic) {
    // Logado tentando acessar login → vai pro dashboard
    if (user && pathname.startsWith('/auth/login')) {
      const nivel = user.user_metadata?.nivel as string
      const destinos: Record<string, string> = {
        owner:    '/dashboard/owner',
        comissao: '/dashboard/comissao',
        gestor:   '/dashboard/gestor',
        advogado: '/dashboard/advogado',
      }
      const destino = destinos[nivel]
      if (destino) {
        return NextResponse.redirect(new URL(destino, request.url))
      }
    }
    return supabaseResponse
  }

  // Rota raiz → redireciona
  if (pathname === '/') {
    if (user) {
      const nivel = user.user_metadata?.nivel as string
      const destinos: Record<string, string> = {
        owner:    '/dashboard/owner',
        comissao: '/dashboard/comissao',
        gestor:   '/dashboard/gestor',
        advogado: '/dashboard/advogado',
      }
      const destino = destinos[nivel]
      if (destino) return NextResponse.redirect(new URL(destino, request.url))
    }
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Rota protegida sem sessão → login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const nivel = user.user_metadata?.nivel as string
  const primeiroacesso = user.user_metadata?.primeiro_acesso as boolean

  // Primeiro acesso → troca de senha
  if (primeiroacesso && !pathname.startsWith('/auth/primeiro-acesso')) {
    return NextResponse.redirect(new URL('/auth/primeiro-acesso', request.url))
  }

  // Dashboard errado para o nível
  if (pathname.startsWith('/dashboard/')) {
    const destinos: Record<string, string> = {
      owner:    '/dashboard/owner',
      comissao: '/dashboard/comissao',
      gestor:   '/dashboard/gestor',
      advogado: '/dashboard/advogado',
    }
    const correto = destinos[nivel]
    if (correto && !pathname.startsWith(correto)) {
      return NextResponse.redirect(new URL(correto, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
