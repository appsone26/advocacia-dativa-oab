// src/app/dashboard/advogado/page.tsx
// Painel do Advogado — dados reais do Supabase.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdvogadoDashboard, { type CasoView } from '@/components/dashboard/AdvogadoDashboard'

export const dynamic = 'force-dynamic'

export default async function AdvogadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: adv } = await supabase
    .from('advogados')
    .select('id, municipio_id, posicao_fila, total_recusas, status')
    .eq('id', user.id)
    .single()

  const municipioId = adv?.municipio_id ?? null

  // Casos disponíveis no município (na fila, sem advogado)
  let disponiveisRaw: any[] = []
  if (municipioId) {
    const { data } = await supabase
      .from('casos')
      .select('id, area_juridica, status, cliente_id, numero_processo, data_conclusao, criado_em')
      .eq('municipio_id', municipioId)
      .eq('status', 'aguardando')
      .is('advogado_id', null)
      .order('criado_em', { ascending: false })
    disponiveisRaw = data ?? []
  }

  // Meus casos (ativos + concluídos)
  const { data: meusRaw } = await supabase
    .from('casos')
    .select('id, area_juridica, status, cliente_id, numero_processo, data_conclusao, criado_em')
    .eq('advogado_id', user.id)
    .order('criado_em', { ascending: false })

  const todos = [...disponiveisRaw, ...(meusRaw ?? [])]
  const clienteIds = Array.from(new Set(todos.map(c => c.cliente_id).filter(Boolean)))

  const nomeMap = new Map<string, string>()
  const descMap = new Map<string, string>()
  if (clienteIds.length) {
    const [{ data: profs }, { data: clis }] = await Promise.all([
      supabase.from('profiles').select('id, nome').in('id', clienteIds),
      supabase.from('clientes').select('id, descricao_caso').in('id', clienteIds),
    ])
    ;(profs ?? []).forEach(p => nomeMap.set(p.id, p.nome))
    ;(clis ?? []).forEach(c => descMap.set(c.id, c.descricao_caso ?? ''))
  }

  const toView = (c: any): CasoView => ({
    id: c.id,
    cliente_nome: nomeMap.get(c.cliente_id) ?? 'Cliente',
    area_juridica: c.area_juridica ?? '',
    descricao: descMap.get(c.cliente_id) ?? '',
    status: c.status,
    numero_processo: c.numero_processo ?? null,
    data_conclusao: c.data_conclusao ?? null,
    criado_em: c.criado_em,
  })

  const disponiveis = disponiveisRaw.map(toView)
  const meus = (meusRaw ?? []).map(toView)
  const ativos = meus.filter(c => c.status === 'em_andamento' && !c.data_conclusao)
  const historico = meus.filter(c => c.data_conclusao)

  let municipioNome = 'Sem município vinculado'
  let maxRecusas = 3
  if (municipioId) {
    const { data: mun } = await supabase.from('municipios').select('nome, max_recusas').eq('id', municipioId).single()
    municipioNome = mun?.nome ?? municipioNome
    maxRecusas = mun?.max_recusas ?? 3
  }

  return (
    <AdvogadoDashboard
      disponiveis={disponiveis}
      ativos={ativos}
      historico={historico}
      municipioNome={municipioNome}
      posicaoFila={adv?.posicao_fila ?? null}
      totalRecusas={adv?.total_recusas ?? 0}
      maxRecusas={maxRecusas}
      suspenso={adv?.status === 'suspenso'}
    />
  )
}
