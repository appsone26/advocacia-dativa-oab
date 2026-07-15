// src/app/api/municipios/atualizar/route.ts
// POST → owner/comissão altera o status de atendimento de um município.
//   1. Valida sessão e nível (owner ou comissao)
//   2. Atualiza municipios.status_atendimento  (parte crítica)
//   3. Grava no audit_log  (best-effort: se falhar, NÃO derruba o salvamento)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const STATUS_VALIDOS = ['nao_visitada', 'marcada', 'realizada', 'negociacao', 'fechado']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: perfil } = await supabase
      .from('profiles')
      .select('id, nome, nivel')
      .eq('id', user.id)
      .single()

    if (!perfil || (perfil.nivel !== 'owner' && perfil.nivel !== 'comissao')) {
      return NextResponse.json({ error: 'Sem permissão para alterar status' }, { status: 403 })
    }

    const { id, status_atendimento } = (await req.json()) as {
      id?: string
      status_atendimento?: string
    }

    if (!id || !status_atendimento) {
      return NextResponse.json({ error: 'id e status_atendimento obrigatórios' }, { status: 400 })
    }
    if (!STATUS_VALIDOS.includes(status_atendimento)) {
      return NextResponse.json({ error: 'status_atendimento inválido' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: municipio } = await admin
      .from('municipios')
      .select('id, nome, status_atendimento')
      .eq('id', id)
      .single()

    if (!municipio) {
      return NextResponse.json({ error: 'Município não encontrado' }, { status: 404 })
    }

    // ── Parte crítica: o salvamento em si ──
    const { error: errUpdate } = await admin
      .from('municipios')
      .update({
        status_atendimento,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (errUpdate) {
      return NextResponse.json(
        { error: `Falha ao gravar no banco: ${errUpdate.message}` },
        { status: 500 }
      )
    }

    // ── Best-effort: audit_log não pode derrubar o salvamento ──
    try {
      await admin.from('audit_log').insert({
        usuario_id:     perfil.id,
        usuario_nome:   perfil.nome,
        acao:           'municipio_status_atendimento',
        detalhe:        `Status de atendimento de ${municipio.nome}: ${municipio.status_atendimento ?? 'nao_visitada'} → ${status_atendimento}`,
        municipio_id:   municipio.id,
        municipio_nome: municipio.nome,
      })
    } catch (auditErr) {
      console.warn('[municipios/status] audit_log falhou (ignorado):', auditErr)
    }

    return NextResponse.json({ ok: true, status_atendimento })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'desconhecido'
    console.error('[POST /api/municipios/status]', err)
    return NextResponse.json({ error: `Erro interno: ${msg}` }, { status: 500 })
  }
}
