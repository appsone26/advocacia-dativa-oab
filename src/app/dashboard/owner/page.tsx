// ============================================================
// src/app/dashboard/owner/agenda/page.tsx
// PASSO 3 — Agenda da Direção (owner)
// ------------------------------------------------------------
// Página dedicada da agenda pro nível owner (Direção / Dra. Patrícia).
// NÃO reaproveita o dashboard da comissão (que está preso no schema
// OAB antigo). Busca a agenda INTEIRA (todos os 92, sem filtro de
// região) e a lista de municípios pro dropdown de "visita".
//
// Acesso: o middleware já libera qualquer rota /dashboard/owner/* pro
// owner, então esta página não precisa de SHARED_ROUTES nem de
// alteração no middleware.
//
// Edição x só-leitura (observadores):
//   - owner SEM linha em comissao_membros  → edição total (Direção).
//   - owner COM linha, sem 'editar_agenda' → só-leitura (observador).
//   Assim marcamos Ana Teresa / Defensor como observadores sem tocar
//   no código — basta uma linha em comissao_membros quando as contas
//   existirem.
// ============================================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgendaPanel from '@/components/dashboard/AgendaPanel'

export default async function OwnerAgendaPage() {
  const supabase = await createClient()

  // Sessão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Perfil — esta página é da Direção (owner)
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nome, email, cargo, nivel')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.nivel !== 'owner') redirect('/auth/login')

  // Permissão de edição: Direção edita por padrão; observador é
  // marcado por uma linha em comissao_membros SEM 'editar_agenda'.
  const { data: membro } = await supabase
    .from('comissao_membros')
    .select('liberar_tudo, permissoes')
    .eq('id', user.id)
    .single()

  const podeEditar = !membro
    ? true // sem linha = Direção com edição total
    : (membro.liberar_tudo === true || (membro.permissoes ?? []).includes('editar_agenda'))

  // Lista de municípios (todos os 92) — enriquecimento + dropdown de visita
  const { data: municipiosRaw } = await supabase
    .from('municipios')
    .select('id, nome')
    .order('nome')

  const municipios = municipiosRaw ?? []

  // Agenda inteira (passada + futura), pra Direção acompanhar o progresso
  const { data: agendaRaw } = await supabase
    .from('agenda')
    .select('id, titulo, descricao, tipo, municipio_id, data_inicio, data_fim, criado_por, status_reuniao')
    .order('data_inicio', { ascending: true })
    .limit(300)

  const agenda = (agendaRaw ?? []).map((ev: any) => ({
    ...ev,
    municipio_nome: municipios.find((m: any) => m.id === ev.municipio_id)?.nome ?? null,
  }))

  return (
    <AgendaPanel
      perfil={perfil}
      agenda={agenda}
      municipios={municipios}
      podeEditar={podeEditar}
    />
  )
}
