import { createClient } from '@/lib/supabase/server'
import RelatoriosDashboard from '@/components/dashboard/RelatoriosDashboard'

export default async function RelatoriosPage() {
  const supabase = await createClient()

  const { data: casos } = await supabase
    .from('casos')
    .select('id, status, area_juridica, municipio_id, criado_em, atualizado_em')
    .order('criado_em', { ascending: false })

  const { data: auditLog } = await supabase
    .from('audit_log')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(200)

  const { data: municipios } = await supabase
    .from('municipios')
    .select('id, nome, regiao')
    .order('nome')

  return (
    <RelatoriosDashboard
      casos={casos ?? []}
      auditLog={auditLog ?? []}
      municipios={municipios ?? []}
    />
  )
}
