// ============================================================
// GET   /api/notificacoes           -> últimas 30 do usuário logado
// PATCH /api/notificacoes { id }     -> marca uma como lida
// PATCH /api/notificacoes { todas:true } -> marca todas como lidas
// Tabela real: notificacoes(destinatario_id, tipo, canal, titulo,
//              conteudo, lida, criado_em)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('notificacoes')
    .select('id, tipo, titulo, conteudo, lida, criado_em')
    .eq('destinatario_id', user.id)
    .order('criado_em', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const naoLidas = (data ?? []).filter(n => !n.lida).length
  return NextResponse.json({ notificacoes: data ?? [], naoLidas })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, todas } = await request.json().catch(() => ({}))

  let query = supabase.from('notificacoes').update({ lida: true }).eq('destinatario_id', user.id)
  if (todas) {
    query = query.eq('lida', false)
  } else if (id) {
    query = query.eq('id', id)
  } else {
    return NextResponse.json({ error: 'Informe id ou todas:true' }, { status: 400 })
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sucesso: true })
}
