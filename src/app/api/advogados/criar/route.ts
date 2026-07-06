// ============================================================
// POST  /api/advogados/criar  — gestor cadastra advogado no seu município
//   cria: usuário Auth (nivel=advogado, senha padrão, primeiro_acesso=true)
//        + advogados (fim da fila FIFO) + email de boas-vindas
// PATCH /api/advogados/criar  — ativa/suspende advogado ({ id, ativar })
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { templateBoasVindas } from '@/lib/email/templates/boas-vindas'

const resend = new Resend(process.env.RESEND_API_KEY)

async function gestorContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autorizado', status: 401 as const }
  const { data: perfil } = await supabase
    .from('profiles').select('nivel, municipio_id').eq('id', user.id).single()
  if (!perfil || !['gestor', 'owner'].includes(perfil.nivel)) {
    return { erro: 'Sem permissão', status: 403 as const }
  }
  return { user, perfil }
}

export async function POST(request: NextRequest) {
  const ctx = await gestorContext()
  if ('erro' in ctx) return NextResponse.json({ error: ctx.erro }, { status: ctx.status })
  const admin = createAdminClient()

  const body = await request.json().catch(() => ({}))
  const { nome, email, oab_numero, areas, municipio_id: munBody } = body
  const municipioId = ctx.perfil.nivel === 'gestor' ? ctx.perfil.municipio_id : (munBody ?? ctx.perfil.municipio_id)

  if (!nome || !email) return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
  if (!municipioId) return NextResponse.json({ error: 'Gestor sem município vinculado' }, { status: 400 })
  const areasArr: string[] = Array.isArray(areas) && areas.length ? areas : ['outros']

  // Cria usuário Auth
  const { data: novo, error: authErr } = await admin.auth.admin.createUser({
    email, password: 'Dativa@2026', email_confirm: true,
    user_metadata: { nome, nivel: 'advogado', municipio_id: municipioId, oab_numero: oab_numero ?? null, primeiro_acesso: true },
  })
  if (authErr || !novo.user) {
    const dup = authErr?.message?.toLowerCase().includes('already') || authErr?.status === 422
    return NextResponse.json({ error: dup ? 'Já existe usuário com este email.' : (authErr?.message ?? 'Erro') }, { status: dup ? 409 : 500 })
  }
  const uid = novo.user.id

  await admin.from('profiles').upsert({
    id: uid, nome, email, nivel: 'advogado', municipio_id: municipioId,
    oab_numero: oab_numero ?? null, primeiro_acesso: true, ativo: true,
  })

  // Posição na fila = fim (maior posição do município + 1)
  const { data: fila } = await admin
    .from('advogados').select('posicao_fila').eq('municipio_id', municipioId)
    .order('posicao_fila', { ascending: false }).limit(1)
  const proximaPosicao = (fila?.[0]?.posicao_fila ?? 0) + 1

  const { error: advErr } = await admin.from('advogados').upsert({
    id: uid, municipio_id: municipioId, areas: areasArr,
    posicao_fila: proximaPosicao, total_recusas: 0, status: 'ativo',
  })
  if (advErr) return NextResponse.json({ error: advErr.message }, { status: 500 })

  // Email de boas-vindas (best-effort)
  try {
    const { subject, html } = templateBoasVindas({ nome, nivel: 'advogado', loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login` })
    await resend.emails.send({ from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`, to: email, subject, html })
  } catch (e) { console.error('[advogados/criar] email falhou:', e) }

  return NextResponse.json({ sucesso: true, id: uid, posicao_fila: proximaPosicao })
}

export async function PATCH(request: NextRequest) {
  const ctx = await gestorContext()
  if ('erro' in ctx) return NextResponse.json({ error: ctx.erro }, { status: ctx.status })
  const admin = createAdminClient()

  const { id, ativar } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Gestor só mexe em advogados do seu município
  if (ctx.perfil.nivel === 'gestor') {
    const { data: adv } = await admin.from('advogados').select('municipio_id').eq('id', id).single()
    if (!adv || adv.municipio_id !== ctx.perfil.municipio_id) {
      return NextResponse.json({ error: 'Advogado fora do seu município' }, { status: 403 })
    }
  }

  await admin.from('advogados').update({ status: ativar ? 'ativo' : 'suspenso' }).eq('id', id)
  await admin.from('profiles').update({ ativo: !!ativar }).eq('id', id)
  return NextResponse.json({ sucesso: true })
}
