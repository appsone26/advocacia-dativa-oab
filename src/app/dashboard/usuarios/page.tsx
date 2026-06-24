import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsuariosDashboard from '@/components/dashboard/UsuariosDashboard'

export default async function UsuariosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nivel')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.nivel !== 'owner') redirect('/dashboard/owner')

  // Busca membros da comissão
  const { data: membrosRaw } = await supabase
    .from('profiles')
    .select('id, nome, email, cargo, oab_numero, municipio_id, primeiro_acesso, ativo, criado_em')
    .eq('nivel', 'comissao')
    .order('nome')

  // Busca dados extras dos membros (regioes, permissoes, liberar_tudo)
  const { data: membrosExtras } = await supabase
    .from('comissao_membros')
    .select('id, regioes, permissoes, liberar_tudo')

  const membrosComissao = (membrosRaw ?? []).map((m: any) => {
    const extra = (membrosExtras ?? []).find((e: any) => e.id === m.id)
    return { ...m, ...extra }
  })

  // Busca gestores com nome do município
  const { data: gestoresRaw } = await supabase
    .from('profiles')
    .select('id, nome, email, cargo, municipio_id, primeiro_acesso, ativo, criado_em')
    .eq('nivel', 'gestor')
    .order('nome')

  // Busca advogados
  const { data: advogadosRaw } = await supabase
    .from('profiles')
    .select('id, nome, email, cargo, oab_numero, municipio_id, primeiro_acesso, ativo, criado_em')
    .eq('nivel', 'advogado')
    .order('nome')

  // Busca todos os municípios para o select
  const { data: municipios } = await supabase
    .from('municipios')
    .select('id, nome, regiao')
    .order('nome')

  // Enriquece gestores e advogados com nome do município
  const muns = municipios ?? []
  const gestores = (gestoresRaw ?? []).map((g: any) => ({
    ...g,
    municipio_nome: muns.find((m: any) => m.id === g.municipio_id)?.nome ?? null
  }))
  const advogados = (advogadosRaw ?? []).map((a: any) => ({
    ...a,
    municipio_nome: muns.find((m: any) => m.id === a.municipio_id)?.nome ?? null
  }))

  return (
    <UsuariosDashboard
      membrosComissao={membrosComissao}
      gestores={gestores}
      advogados={advogados}
      municipios={muns}
    />
  )
}
