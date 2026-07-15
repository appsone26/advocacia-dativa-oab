// src/app/dashboard/owner/page.tsx
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
      status_atendimento,
      populacao,
      distancia_capital_km,
      atualizado_em
    `)
    .order('nome')

  return <OwnerDashboard municipios={municipios ?? []} />
}
