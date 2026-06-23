// ============================================================
// POST /api/recuperar-senha
// Gera um link de recuperação no Supabase (sem disparar email)
// e envia esse link com o template institucional via Resend.
//
// SEGURANÇA: sempre responde com sucesso genérico, mesmo se o
// email não existir — assim ninguém descobre quais emails estão
// cadastrados no sistema.
// ============================================================

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarEmail } from '@/lib/email/resend'
import { recuperarSenhaEmail } from '@/lib/email/templates/recuperar-senha'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ erro: 'Email inválido' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Gera o link de recuperação SEM disparar o email do Supabase.
    // Retorna o hashed_token que usamos para montar nosso próprio link.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    // Se o email não existe, NÃO revelamos isso.
    // Apenas não enviamos nada e respondemos sucesso genérico.
    if (error || !data?.properties?.hashed_token) {
      return NextResponse.json({ ok: true })
    }

    // Busca o nome do usuário para personalizar o email (opcional)
    let nome: string | undefined
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome')
      .eq('email', email)
      .single()
    if (profile?.nome) nome = profile.nome

    // Monta o link apontando para a nossa página de confirmação
    const tokenHash = data.properties.hashed_token
    const linkRecuperacao = `${appUrl}/auth/confirmar?token_hash=${tokenHash}&type=recovery`

    // Envia o email institucional
    await enviarEmail({
      para: email,
      assunto: 'Recuperação de senha — Advocacia Dativa OAB-RJ',
      html: recuperarSenhaEmail({ nome, linkRecuperacao }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[recuperar-senha] Erro:', err)
    // Mesmo em erro interno, resposta genérica (não vaza informação)
    return NextResponse.json({ ok: true })
  }
}
