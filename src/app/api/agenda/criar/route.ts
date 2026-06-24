import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Verifica se é comissão ou owner
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nivel')
    .eq('id', user.id)
    .single()

  if (!perfil || !['owner', 'comissao'].includes(perfil.nivel)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Verifica permissão de editar agenda (para comissão)
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

  const body = await request.json()
  const { titulo, descricao, tipo, municipio_id, data_inicio, data_fim } = body

  if (!titulo || !data_inicio) {
    return NextResponse.json({ error: 'Título e data de início são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('agenda')
    .insert({
      titulo,
      descricao: descricao || null,
      tipo: tipo || 'reuniao',
      municipio_id: municipio_id || null,
      data_inicio,
      data_fim: data_fim || null,
      criado_por: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ evento: data })
}
