// ============================================================
// POST /api/casos/concluir  { caso_id, numero_processo }
// O advogado conclui um caso. ANTIFRAUDE: número do processo
// judicial é obrigatório. Efeitos:
//   - casos: numero_processo + data_conclusao (a conclusão é
//     representada por data_conclusao != null, pois o schema de
//     `casos` não possui status 'concluido')
//   - notificação in-app ao cliente para confirmar a conclusão
//   - audit_log
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarNotificacao } from '@/lib/notificacoes'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.user_metadata?.nivel !== 'advogado') {
    return NextResponse.json({ error: 'Apenas advogados podem concluir casos' }, { status: 403 })
  }

  const { caso_id, numero_processo } = await request.json().catch(() => ({}))
  if (!caso_id) return NextResponse.json({ error: 'caso_id obrigatório' }, { status: 400 })
  if (!numero_processo || String(numero_processo).trim().length < 5) {
    return NextResponse.json(
      { error: 'O número do processo judicial é obrigatório para concluir (antifraude)' },
      { status: 400 },
    )
  }

  const { data: caso } = await admin
    .from('casos')
    .select('id, status, advogado_id, cliente_id')
    .eq('id', caso_id)
    .single()
  if (!caso) return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })
  if (caso.advogado_id !== user.id) {
    return NextResponse.json({ error: 'Este caso não está sob sua responsabilidade' }, { status: 403 })
  }
  if (caso.status !== 'em_andamento') {
    return NextResponse.json({ error: 'Apenas casos em andamento podem ser concluídos' }, { status: 409 })
  }

  const numeroCaso = String(caso.id).slice(0, 8)
  const agora = new Date().toISOString()

  const { error: updErr } = await admin.from('casos').update({
    numero_processo: String(numero_processo).trim(),
    data_conclusao: agora,
  }).eq('id', caso_id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  await admin.from('audit_log').insert({
    user_id: user.id,
    acao: 'caso.concluir',
    tabela: 'casos',
    registro_id: caso_id,
    valor_antes: { data_conclusao: null },
    valor_depois: { numero_processo: String(numero_processo).trim(), data_conclusao: agora },
  })

  await criarNotificacao(admin, {
    destinatarioId: caso.cliente_id, tipo: 'caso',
    titulo: 'Caso concluído — confirme',
    conteudo: `O advogado concluiu o seu caso #${numeroCaso} (processo ${String(numero_processo).trim()}). Confirme a conclusão do atendimento.`,
  })

  return NextResponse.json({ sucesso: true })
}
