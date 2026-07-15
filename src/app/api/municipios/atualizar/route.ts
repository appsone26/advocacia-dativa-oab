// src/app/api/municipios/status/route.ts
// POST → owner/comissão altera o status de atendimento de um município.
//   1. Valida sessão e nível (owner ou comissao)
//   2. Atualiza municipios.status_atendimento
//   3. Grava no audit_log
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
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
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

    const { error: errUpdate } = await admin
      .from('municipios')
      .update({
        status_atendimento,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (errUpdate) throw errUpdate

    // Grava tudo no audit_log
    await admin.from('audit_log').insert({
      usuario_id:     perfil.id,
      usuario_nome:   perfil.nome,
      acao:           'municipio_status_atendimento',
      detalhe:        `Status de atendimento de ${municipio.nome}: ${municipio.status_atendimento ?? 'nao_visitada'} → ${status_atendimento}`,
      municipio_id:   municipio.id,
      municipio_nome: municipio.nome,
    })

    return NextResponse.json({ ok: true, status_atendimento })
  } catch (err) {
    console.error('[POST /api/municipios/status]', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar status' }, { status: 500 })
  }
}
