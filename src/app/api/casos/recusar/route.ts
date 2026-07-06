// ============================================================
// POST /api/casos/recusar  { caso_id, motivo }
// O advogado recusa um caso (motivo obrigatório). Efeitos:
//   - casos: volta para a fila -> status 'aguardando', advogado_id null,
//            motivo registrado em observacoes
//   - advogados: incrementa total_recusas; se exceder max_recusas do
//     município, o advogado é suspenso (status 'suspenso' + ativo=false)
//   - audit_log da ação
//   - notificação in-app ao advogado
// Obs.: o schema de `casos` não possui status 'recusado'; a recusa é
// modelada como retorno à fila + registro em observacoes/audit_log.
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
    return NextResponse.json({ error: 'Apenas advogados podem recusar casos' }, { status: 403 })
  }

  const { caso_id, motivo } = await request.json().catch(() => ({}))
  if (!caso_id) return NextResponse.json({ error: 'caso_id obrigatório' }, { status: 400 })
  if (!motivo || String(motivo).trim().length < 10) {
    return NextResponse.json({ error: 'O motivo da recusa é obrigatório (mín. 10 caracteres)' }, { status: 400 })
  }

  const { data: caso } = await admin
    .from('casos')
    .select('id, status, advogado_id, municipio_id, observacoes')
    .eq('id', caso_id)
    .single()
  if (!caso) return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })

  const { data: advRow } = await admin
    .from('advogados')
    .select('id, municipio_id, total_recusas')
    .eq('id', user.id)
    .single()
  if (!advRow) return NextResponse.json({ error: 'Advogado não cadastrado no programa' }, { status: 403 })

  const atribuidoAMim = caso.advogado_id === user.id
  const ofertadoAMim = !caso.advogado_id && caso.status === 'aguardando' && caso.municipio_id === advRow.municipio_id
  if (!atribuidoAMim && !ofertadoAMim) {
    return NextResponse.json({ error: 'Este caso não está sob sua responsabilidade' }, { status: 403 })
  }

  const numeroCaso = String(caso.id).slice(0, 8)
  const carimbo = `[Recusa ${new Date().toISOString()} — adv ${user.id.slice(0, 8)}]: ${String(motivo).trim()}`
  const novasObs = caso.observacoes ? `${caso.observacoes}\n${carimbo}` : carimbo

  // Devolve o caso à fila
  await admin.from('casos').update({
    status: 'aguardando',
    advogado_id: null,
    observacoes: novasObs,
  }).eq('id', caso_id)

  // Incrementa recusas do advogado
  const novasRecusas = (advRow.total_recusas ?? 0) + 1
  const { data: mun } = await admin
    .from('municipios').select('max_recusas').eq('id', advRow.municipio_id).single()
  const maxRecusas = mun?.max_recusas ?? 3
  const suspender = novasRecusas >= maxRecusas

  await admin.from('advogados')
    .update({ total_recusas: novasRecusas, ...(suspender ? { status: 'suspenso' } : {}) })
    .eq('id', user.id)
  if (suspender) {
    await admin.from('profiles').update({ ativo: false }).eq('id', user.id)
  }

  // Auditoria
  await admin.from('audit_log').insert({
    user_id: user.id,
    acao: 'caso.recusar',
    tabela: 'casos',
    registro_id: caso_id,
    valor_antes: { status: caso.status, advogado_id: caso.advogado_id },
    valor_depois: { status: 'aguardando', motivo: String(motivo).trim(), total_recusas: novasRecusas },
  })

  await criarNotificacao(admin, {
    destinatarioId: user.id, tipo: suspender ? 'alerta' : 'info',
    titulo: suspender ? 'Recusa registrada — limite atingido' : 'Recusa registrada',
    conteudo: suspender
      ? `Você recusou o caso #${numeroCaso} e atingiu o limite de ${maxRecusas} recusas. Seu acesso foi suspenso; procure a Comissão.`
      : `Você recusou o caso #${numeroCaso}. Recusas: ${novasRecusas}/${maxRecusas}.`,
  })

  return NextResponse.json({ sucesso: true, total_recusas: novasRecusas, suspenso: suspender })
}
