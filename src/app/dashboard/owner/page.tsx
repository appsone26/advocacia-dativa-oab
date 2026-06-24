import { createClient } from '@/lib/supabase/server'
import OwnerDashboard from '@/components/dashboard/OwnerDashboard'

export default async function OwnerPage() {
  const supabase = await createClient()

  const { data: municipios } = await supabase
    .from('municipios')
    .select(`
      id,
      nome,
      regiao,
      logo_url,
      gestor_id,
      prazo_resposta_dias,
      max_recusas,
      status_parceria,
      criado_em,
      atualizado_em
    `)
    .order('nome')

  const { data: gestores } = await supabase
    .from('profiles')
    .select('id, nome, email')
    .eq('nivel', 'gestor')
    .eq('ativo', true)
    .order('nome')

  return (
    <OwnerDashboard
      municipios={municipios ?? []}
      gestores={gestores ?? []}
    />
  )
}
