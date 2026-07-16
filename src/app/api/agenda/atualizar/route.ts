// src/app/api/agenda/atualizar/route.ts
// POST → owner/comissão edita um evento da agenda. Dois modos no body:
//   { acao: 'remarcar', id, data_inicio, data_fim? }  → muda a data do evento
//   { acao: 'cancelar', id, motivo }                   → status_reuniao='cancelada'
// Espelha o padrão de api/agenda/criar: validação + audit_log best-effort no
// schema real (user_id/acao/tabela/registro_id/valor_antes/valor_depois/ip_address).
// Cancelar NÃO toca em `municipios` (a cidade não rebaixa de estágio — 3.3).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function getIp(request: NextRequest): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nivel')
    .eq('id', user.id)
    .single()

  if (!perfil || !['owner', 'comissao'].includes(perfil.nivel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  if (perfil.nivel === 'comissao') {
    const { data: membro } = await supabase
      .from('comissao_membros')
      .select('liberar_tudo, permissoes')
      .eq('id', user.id)
      .single()

    const temPermissao = membro?.liberar_tudo || membro?.permissoes?.includes('editar_agenda')
    if (!temPermissao) {
      return NextResponse.json({ error: 'Sem permissão para editar agenda' }, { status: 403 })
    }
  }

  const body = await request.json().catch(() => ({}))
  const { acao, id } = body as { acao?: string; id?: string }

  if (!id) return NextResponse.json({ error: 'id do evento é obrigatório' }, { status: 400 })
  if (acao !== 'remarcar' && acao !== 'cancelar') {
    return NextResponse.json({ error: 'acao inválida (use remarcar ou cancelar)' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: evento } = await admin
    .from('agenda')
    .select('id, data_inicio, data_fim, status_reuniao, titulo, municipio_id')
    .eq('id', id)
    .single()

  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

  // ── Remarcar ──────────────────────────────────────────────────────────────
  if (acao === 'remarcar') {
    const { data_inicio, data_fim } = body as { data_inicio?: string; data_fim?: string }
    if (!data_inicio) {
      return NextResponse.json({ error: 'Nova data de início é obrigatória' }, { status: 400 })
    }

    const { error: errUpd } = await admin
      .from('agenda')
      .update({ data_inicio, data_fim: data_fim || null })
      .eq('id', id)

    if (errUpd) return NextResponse.json({ error: errUpd.message }, { status: 500 })

    try {
      const { error: auditErr } = await admin.from('audit_log').insert({
        user_id: user.id,
        acao: 'agenda_remarcar',
        tabela: 'agenda',
        registro_id: String(id),
        valor_antes: { data_inicio: evento.data_inicio, data_fim: evento.data_fim },
        valor_depois: { data_inicio, data_fim: data_fim || null },
        ip_address: getIp(request),
      })
      if (auditErr) console.warn('[agenda/atualizar:remarcar] audit_log falhou (ignorado):', auditErr.message)
    } catch (auditErr) {
      console.warn('[agenda/atualizar:remarcar] audit exception (ignorado):', auditErr)
    }

    return NextResponse.json({ ok: true })
  }

  // ── Cancelar (motivo obrigatório) ───────────────────────────────────────────
  const { motivo } = body as { motivo?: string }
  if (!motivo || !String(motivo).trim()) {
    return NextResponse.json({ error: 'O motivo do cancelamento é obrigatório' }, { status: 400 })
  }

  const { error: errUpd } = await admin
    .from('agenda')
    .update({ status_reuniao: 'cancelada', motivo_cancelamento: String(motivo).trim() })
    .eq('id', id)

  if (errUpd) return NextResponse.json({ error: errUpd.message }, { status: 500 })

  try {
    const { error: auditErr } = await admin.from('audit_log').insert({
      user_id: user.id,
      acao: 'agenda_cancelar',
      tabela: 'agenda',
      registro_id: String(id),
      valor_antes: { status_reuniao: evento.status_reuniao },
      valor_depois: { status_reuniao: 'cancelada', motivo: String(motivo).trim() },
      ip_address: getIp(request),
    })
    if (auditErr) console.warn('[agenda/atualizar:cancelar] audit_log falhou (ignorado):', auditErr.message)
  } catch (auditErr) {
    console.warn('[agenda/atualizar:cancelar] audit exception (ignorado):', auditErr)
  }

  return NextResponse.json({ ok: true })
}
