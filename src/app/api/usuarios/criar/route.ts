import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { templateBoasVindas } from '@/lib/email/templates/boas-vindas'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Verifica se é owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nivel')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.nivel !== 'owner') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json()
  const { nome, email, nivel, municipio_id, oab_numero, cargo, regioes, permissoes, liberar_tudo } = body

  if (!nome || !email || !nivel) {
    return NextResponse.json({ error: 'Nome, email e nível são obrigatórios' }, { status: 400 })
  }

  // Cria usuário no Supabase Auth via Admin
  const { data: novoUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: 'Dativa@2026',
    email_confirm: true,
    user_metadata: {
      nome,
      nivel,
      primeiro_acesso: true,
      municipio_id: municipio_id ?? null,
      oab_numero: oab_numero ?? null,
      cargo: cargo ?? null,
    },
  })

  if (authError || !novoUser.user) {
    return NextResponse.json({ error: authError?.message ?? 'Erro ao criar usuário' }, { status: 500 })
  }

  const uid = novoUser.user.id

  // Atualiza profile (trigger já cria, mas garante os dados)
  await adminClient
    .from('profiles')
    .upsert({
      id: uid,
      nome,
      email,
      nivel,
      municipio_id: municipio_id ?? null,
      oab_numero: oab_numero ?? null,
      cargo: cargo ?? null,
      primeiro_acesso: true,
      ativo: true,
    })

  // Se for comissão, insere em comissao_membros
  if (nivel === 'comissao') {
    await adminClient
      .from('comissao_membros')
      .upsert({
        id: uid,
        regioes: regioes ?? [],
        permissoes: permissoes ?? [],
        liberar_tudo: liberar_tudo ?? false,
        bio: null,
      })
  }

  // Envia email de boas-vindas
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
  const { subject, html } = templateBoasVindas({ nome, nivel, loginUrl })

  await resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject,
    html,
  })

  return NextResponse.json({ sucesso: true, id: uid })
}

// PATCH — ativar/desativar usuário
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nivel')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.nivel !== 'owner') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id, ativo } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await adminClient
    .from('profiles')
    .update({ ativo })
    .eq('id', id)

  return NextResponse.json({ sucesso: true })
}
