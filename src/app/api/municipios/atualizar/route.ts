import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { id, status_parceria, gestor_id } = await request.json()

    if (!id || !status_parceria) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const validos = ['ativa', 'negociando', 'pendente']
    if (!validos.includes(status_parceria)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se o usuário é owner
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const nivel = user.user_metadata?.nivel
    if (nivel !== 'owner') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { error } = await supabase
      .from('municipios')
      .update({
        status_parceria,
        gestor_id: gestor_id || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
