// ============================================================
// POST /api/casos/aceitar  { caso_id }
// O advogado aceita um caso a ele atribuído (ou disponível no seu
// município). Efeitos:
//   - casos: status -> 'em_andamento', advogado_id, data_atribuicao
//   - notificações in-app para cliente e advogado
//   - emails (Resend): dados do cliente p/ advogado e vice-versa
// Regra de contato: cada parte recebe o EMAIL da outra (nunca telefone).
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarEmail } from '@/lib/email/resend'
import { criarNotificacao } from '@/lib/notificacoes'
import { casoAceitoAdvogadoEmail } from '@/lib/email/templates/caso-aceito-advogado'
import { casoAceitoClienteEmail } from '@/lib/email/templates/caso-aceito-cliente'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.user_metadata?.nivel !== 'advogado') {
    return NextResponse.json({ error: 'Apenas advogados podem aceitar casos' }, { status: 403 })
  }

  const { caso_id } = await request.json().catch(() => ({}))
  if (!caso_id) return NextResponse.json({ error: 'caso_id obrigatório' }, { status: 400 })

  // Busca o caso
  const { data: caso, error: casoErr } = await admin
    .from('casos')
    .select('id, status, advogado_id, cliente_id, municipio_id, area_juridica')
    .eq('id', caso_id)
    .single()
  if (casoErr || !caso) return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 })

  // Advogado deste município
  const { data: advRow } = await admin
    .from('advogados')
    .select('id, municipio_id, status')
    .eq('id', user.id)
    .single()
  if (!advRow) return NextResponse.json({ error: 'Advogado não cadastrado no programa' }, { status: 403 })

  const atribuidoAMim = caso.advogado_id === user.id
  const disponivelNoMeuMunicipio =
    !caso.advogado_id && caso.status === 'aguardando' && caso.municipio_id === advRow.municipio_id
  if (!atribuidoAMim && !disponivelNoMeuMunicipio) {
    return NextResponse.json({ error: 'Este caso não está disponível para você' }, { status: 403 })
  }
  if (caso.status === 'em_andamento' && atribuidoAMim) {
    return NextResponse.json({ error: 'Caso já está em andamento' }, { status: 409 })
  }

  // Atualiza o caso
  const { error: updErr } = await admin
    .from('casos')
    .update({
      status: 'em_andamento',
      advogado_id: user.id,
      data_atribuicao: new Date().toISOString(),
    })
    .eq('id', caso_id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // Dados das partes (profiles) + cliente (clientes) + município
  const [{ data: cliProfile }, { data: cliRow }, { data: advProfile }, { data: mun }] = await Promise.all([
    admin.from('profiles').select('nome, email').eq('id', caso.cliente_id).single(),
    admin.from('clientes').select('descricao_caso, area_juridica').eq('id', caso.cliente_id).single(),
    admin.from('profiles').select('nome, email, oab_numero').eq('id', user.id).single(),
    admin.from('municipios').select('nome').eq('id', caso.municipio_id).single(),
  ])

  const numeroCaso = String(caso.id).slice(0, 8)
  const area = caso.area_juridica ?? cliRow?.area_juridica ?? 'Não informada'
  const municipioNome = mun?.nome ?? '—'
  const painelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/advogado`

  // Notificações in-app
  await Promise.all([
    criarNotificacao(admin, {
      destinatarioId: user.id, tipo: 'caso',
      titulo: 'Caso aceito', conteudo: `Você assumiu o caso #${numeroCaso}. Os dados do cliente foram enviados ao seu email.`,
    }),
    criarNotificacao(admin, {
      destinatarioId: caso.cliente_id, tipo: 'caso',
      titulo: 'Seu caso foi aceito', conteudo: `O advogado ${advProfile?.nome ?? ''} assumiu o seu caso #${numeroCaso}.`,
    }),
  ])

  // Emails (best-effort — não quebram a operação)
  try {
    if (advProfile?.email && cliProfile) {
      const { subject, html } = casoAceitoAdvogadoEmail({
        nomeAdvogado: advProfile.nome, nomeCliente: cliProfile.nome, emailCliente: cliProfile.email,
        areaJuridica: area, descricaoCaso: cliRow?.descricao_caso ?? '—',
        municipio: municipioNome, numeroCaso, painelUrl,
      })
      await enviarEmail({ para: advProfile.email, assunto: subject, html })
    }
    if (cliProfile?.email && advProfile) {
      const { subject, html } = casoAceitoClienteEmail({
        nomeCliente: cliProfile.nome, nomeAdvogado: advProfile.nome, emailAdvogado: advProfile.email,
        oabAdvogado: advProfile.oab_numero, areaJuridica: area, municipio: municipioNome, numeroCaso,
      })
      await enviarEmail({ para: cliProfile.email, assunto: subject, html })
    }
  } catch (e) {
    console.error('[casos/aceitar] falha ao enviar email:', e)
  }

  return NextResponse.json({ sucesso: true })
}
