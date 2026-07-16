// src/app/api/municipios/atualizar/route.ts
// POST → owner/comissão altera o status de atendimento de um município.
//   1. Valida sessão e nível (owner ou comissao)
//   2. Atualiza municipios.status_atendimento  (parte crítica)
//   3. Grava no audit_log  (best-effort: se falhar, NÃO derruba o salvamento)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isStatusFunil } from '@/lib/funil'

// Melhor esforço para descobrir o IP de origem (atrás do proxy da Vercel).
function getIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

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

    const { id, status_atendimento, motivo, acao } = (await req.json()) as {
      id?: string
      status_atendimento?: string
      motivo?: string
      acao?: string
    }

    if (!id || !status_atendimento) {
      return NextResponse.json({ error: 'id e status_atendimento obrigatórios' }, { status: 400 })
    }
    if (!isStatusFunil(status_atendimento)) {
      return NextResponse.json({ error: 'status_atendimento inválido' }, { status: 400 })
    }
    // Trava de invariante (defesa em profundidade): o funil nunca volta pro
    // cinza. A cidade só sai de nao_visitada pela agenda (helper aoCriarEvento);
    // esta rota nunca pode rebaixar pra nao_visitada, mesmo chamada direto.
    if (status_atendimento === 'nao_visitada') {
      return NextResponse.json(
        { error: 'Não é permitido voltar uma cidade para "não visitada" por esta rota.' },
        { status: 400 }
      )
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
    // Schema REAL do audit_log (seção 3-bis): user_id / acao / tabela /
    // registro_id / valor_antes / valor_depois / ip_address. O contexto
    // (nome da cidade, estágio de→para) vai no jsonb, não em colunas.
    // Correção da dívida: o insert antigo usava colunas inexistentes
    // (usuario_id/usuario_nome/detalhe/municipio_*) e falhava calado.
    // Verbo do audit: o 3.5 (relatório mensal) separa por ele. O client sinaliza
    // a intenção (avançar / fechar / não-participa); se não vier, inferimos pelo
    // status alvo. 'funil_avancar' fica só para o avanço de estágio.
    const VERBOS_FUNIL = ['funil_avancar', 'funil_fechar', 'funil_nao_participa']
    const acaoAudit =
      acao && VERBOS_FUNIL.includes(acao)
        ? acao
        : status_atendimento === 'nao_participa'
          ? 'funil_nao_participa'
          : status_atendimento === 'fechado'
            ? 'funil_fechar'
            : 'funil_avancar'

    try {
      const { error: auditErr } = await admin.from('audit_log').insert({
        user_id:      perfil.id,
        acao:         acaoAudit,
        tabela:       'municipios',
        registro_id:  String(municipio.id),
        valor_antes:  { status_atendimento: municipio.status_atendimento ?? 'nao_visitada' },
        valor_depois: {
          status_atendimento,
          municipio_nome: municipio.nome,
          ...(motivo && String(motivo).trim() ? { motivo: String(motivo).trim() } : {}),
        },
        ip_address:   getIp(req),
      })
      if (auditErr) console.warn('[municipios/status] audit_log falhou (ignorado):', auditErr.message)
    } catch (auditErr) {
      console.warn('[municipios/status] audit_log exception (ignorado):', auditErr)
    }

    return NextResponse.json({ ok: true, status_atendimento })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'desconhecido'
    console.error('[POST /api/municipios/status]', err)
    return NextResponse.json({ error: `Erro interno: ${msg}` }, { status: 500 })
  }
}
