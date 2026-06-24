import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ComissaoDashboard from '@/components/dashboard/ComissaoDashboard'

export default async function ComissaoPage() {
  const supabase = await createClient()

  // Busca usuário autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Busca perfil completo
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nome, email, cargo, nivel')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.nivel !== 'comissao') redirect('/auth/login')

  // Busca dados do membro na tabela comissao_membros
  const { data: membro } = await supabase
    .from('comissao_membros')
    .select('id, regioes, liberar_tudo, permissoes, bio')
    .eq('id', user.id)
    .single()

  // Regiões do membro (fallback: vazio)
  const regioes: string[] = membro?.regioes ?? []

  // Busca municípios das regiões do membro
  let municipios: any[] = []
  if (regioes.length > 0) {
    const { data } = await supabase
      .from('municipios')
      .select('id, nome, regiao, status_parceria, gestor_id, prazo_resposta_dias, max_recusas')
      .in('regiao', regioes)
      .order('nome')
    municipios = data ?? []
  }

  const municipioIds = municipios.map((m: any) => m.id)

  // Busca casos nos municípios da região
  let casos: any[] = []
  if (municipioIds.length > 0) {
    const { data } = await supabase
      .from('casos')
      .select('id, status, area_juridica, municipio_id, criado_em')
      .in('municipio_id', municipioIds)
      .order('criado_em', { ascending: false })
    
    // Enriquece com nome do município
    casos = (data ?? []).map((c: any) => ({
      ...c,
      municipio_nome: municipios.find((m: any) => m.id === c.municipio_id)?.nome ?? '—'
    }))
  }

  // Busca agenda (todos os eventos visíveis para comissão)
  const { data: agendaRaw } = await supabase
    .from('agenda')
    .select('id, titulo, descricao, tipo, municipio_id, data_inicio, data_fim, criado_por')
    .gte('data_inicio', new Date().toISOString())
    .order('data_inicio')
    .limit(20)

  // Enriquece agenda com nome do município
  const agenda = (agendaRaw ?? []).map((ev: any) => ({
    ...ev,
    municipio_nome: municipios.find((m: any) => m.id === ev.municipio_id)?.nome ?? null
  }))

  return (
    <ComissaoDashboard
      perfil={perfil}
      membro={membro}
      municipios={municipios}
      casos={casos}
      agenda={agenda}
      regioes={regioes}
    />
  )
}
