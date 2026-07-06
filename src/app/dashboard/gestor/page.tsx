// src/app/dashboard/gestor/page.tsx
// Painel do Gestor Municipal — dados reais do Supabase.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GestorDashboard from '@/components/dashboard/GestorDashboard'

export const dynamic = 'force-dynamic'

export default async function GestorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: perfil } = await supabase
    .from('profiles').select('nome, municipio_id, nivel').eq('id', user.id).single()

  const municipioId = perfil?.municipio_id ?? null
  let municipioNome = 'Sem município vinculado'
  if (municipioId) {
    const { data: mun } = await supabase.from('municipios').select('nome').eq('id', municipioId).single()
    municipioNome = mun?.nome ?? municipioNome
  }

  let advogados: any[] = []
  let casos: any[] = []

  if (municipioId) {
    const { data: advRows } = await supabase
      .from('advogados')
      .select('id, areas, posicao_fila, total_recusas, status')
      .eq('municipio_id', municipioId)
      .order('posicao_fila')

    const { data: casoRows } = await supabase
      .from('casos')
      .select('id, status, area_juridica, cliente_id, advogado_id, numero_processo, data_conclusao, criado_em')
      .eq('municipio_id', municipioId)
      .order('criado_em', { ascending: false })

    const ids = Array.from(new Set([
      ...(advRows ?? []).map(a => a.id),
      ...(casoRows ?? []).flatMap(c => [c.cliente_id, c.advogado_id]),
    ].filter(Boolean)))

    const profMap = new Map<string, { nome: string; oab: string | null }>()
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, nome, oab_numero').in('id', ids)
      ;(profs ?? []).forEach(p => profMap.set(p.id, { nome: p.nome, oab: p.oab_numero ?? null }))
    }

    advogados = (advRows ?? []).map(a => ({
      id: a.id,
      nome: profMap.get(a.id)?.nome ?? 'Advogado',
      oab: profMap.get(a.id)?.oab ?? null,
      areas: a.areas ?? [],
      posicao_fila: a.posicao_fila,
      total_recusas: a.total_recusas ?? 0,
      status: a.status,
    }))

    casos = (casoRows ?? []).map(c => ({
      id: c.id,
      status: c.status,
      area_juridica: c.area_juridica,
      cliente_nome: profMap.get(c.cliente_id)?.nome ?? 'Cliente',
      advogado_nome: c.advogado_id ? (profMap.get(c.advogado_id)?.nome ?? 'Advogado') : null,
      concluido: !!c.data_conclusao,
      criado_em: c.criado_em,
    }))
  }

  return (
    <GestorDashboard
      municipioNome={municipioNome}
      temMunicipio={!!municipioId}
      advogados={advogados}
      casos={casos}
    />
  )
}
