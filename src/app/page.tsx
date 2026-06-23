// Rota raiz (/)
// O middleware já lida com o redirect automático.
// Esta página só aparece em edge cases — redireciona para /auth/login.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { NivelUsuario } from '@/types'

const DASHBOARD_POR_NIVEL: Record<NivelUsuario, string> = {
  cliente:  '/auth/login',
  advogado: '/dashboard/advogado',
  gestor:   '/dashboard/gestor',
  comissao: '/dashboard/comissao',
  owner:    '/dashboard/owner',
}

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const nivel = user.user_metadata?.nivel as NivelUsuario
  const dashboard = DASHBOARD_POR_NIVEL[nivel] ?? '/auth/login'

  redirect(dashboard)
}
