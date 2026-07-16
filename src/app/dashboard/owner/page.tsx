// src/app/dashboard/owner/page.tsx
import { createClient } from '@/lib/supabase/server'
import OwnerDashboard from '@/components/dashboard/OwnerDashboard'

export default async function OwnerPage() {
  const supabase = await createClient()

  // Municípios (os 92) — a ordenação da fila é por data do próximo
  // compromisso, calculada no componente; por isso NÃO ordenamos por nome aqui.
  const { data: municipios } = await supabase
    .from('municipios')
    .select('id, nome, regiao, logo_url, status_atendimento, populacao, distancia_capital_km, atualizado_em')

  // Eventos da agenda (com município e não cancelados) para montar a fila.
  // Filtro NULL-safe: `agenda/criar` não grava `status_reuniao`, então eventos
  // novos ficam NULL — um `.neq('status_reuniao','cancelada')` puro os excluiria
  // (NULL <> 'cancelada' é unknown no Postgres) e esvaziaria a fila.
  const { data: eventos } = await supabase
    .from('agenda')
    .select('id, titulo, tipo, municipio_id, data_inicio, data_fim, responsavel, status_reuniao, descricao')
    .not('municipio_id', 'is', null)
    .or('status_reuniao.is.null,status_reuniao.neq.cancelada')
    .order('data_inicio', { ascending: true })

  return <OwnerDashboard municipios={municipios ?? []} eventos={eventos ?? []} />
}
