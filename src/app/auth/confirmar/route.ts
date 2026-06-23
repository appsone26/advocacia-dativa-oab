// ============================================================
// GET /auth/confirmar?token_hash=XXX&type=recovery
// O usuário cai aqui ao clicar no link do email.
// Valida o token, cria a sessão (cookie) e redireciona para
// a página de redefinição de senha.
// ============================================================

import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (tokenHash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      // Token válido → sessão criada → vai redefinir a senha
      return NextResponse.redirect(new URL('/auth/redefinir-senha', request.url))
    }
  }

  // Token inválido ou expirado → volta ao esqueci-senha com aviso
  return NextResponse.redirect(
    new URL('/auth/esqueci-senha?erro=link_invalido', request.url)
  )
}
