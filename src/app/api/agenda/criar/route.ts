import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aoCriarEvento } from '@/lib/funil'

// Melhor esforço para descobrir o IP de origem (atrás do proxy da Vercel).
function getIp(request: NextRequest): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip')
}

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

  const body = await request.json().catch(() => ({}))
  const { titulo, descricao, tipo, municipio_id, responsavel, data_inicio, data_fim } = body

  // Validação — município e responsável agora são obrigatórios nos DOIS
  // tipos (reunião e visita), pois a agenda comanda o status da cidade.
  if (!titulo || !String(titulo).trim()) {
    return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
  }
  if (!municipio_id) {
    return NextResponse.json({ error: 'Município é obrigatório' }, { status: 400 })
  }
  if (!responsavel || !String(responsavel).trim()) {
    return NextResponse.json({ error: 'Responsável/anfitrião é obrigatório' }, { status: 400 })
  }
  if (!data_inicio) {
    return NextResponse.json({ error: 'Data de início é obrigatória' }, { status: 400 })
  }

  const { data: evento, error } = await supabase
    .from('agenda')
    .insert({
      titulo: String(titulo).trim(),
      descricao: descricao || null,
      tipo: tipo || 'reuniao',
      municipio_id,
      responsavel: String(responsavel).trim(),
      data_inicio,
      data_fim: data_fim || null,
      criado_por: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const admin = createAdminClient()

  // Transição automática do funil (no código, não em trigger):
  // cidade `nao_visitada` -> `marcada`; demais estágios mantêm.
  const transicao = await aoCriarEvento(admin, municipio_id)

  // Auditoria — schema REAL do audit_log (seção 3-bis). Contexto no jsonb.
  // Best-effort: falha do audit NÃO derruba a criação do evento.
  try {
    const { error: auditErr } = await admin.from('audit_log').insert({
      user_id: user.id,
      acao: 'agenda_criar',
      tabela: 'agenda',
      registro_id: String(evento.id),
      valor_antes: { status_atendimento: transicao.de },
      valor_depois: {
        titulo: evento.titulo,
        tipo: evento.tipo,
        municipio_id,
        municipio_nome: transicao.municipio_nome,
        responsavel: evento.responsavel,
        data_inicio: evento.data_inicio,
        data_fim: evento.data_fim,
        status_atendimento: transicao.para,
        funil_mudou: transicao.mudou,
      },
      ip_address: getIp(request),
    })
    if (auditErr) console.warn('[agenda/criar] audit_log falhou (ignorado):', auditErr.message)
  } catch (auditErr) {
    console.warn('[agenda/criar] audit_log exception (ignorado):', auditErr)
  }

  return NextResponse.json({ evento, funil: transicao })
}
