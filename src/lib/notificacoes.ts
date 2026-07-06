// ============================================================
// Helper de notificações in-app
// Espelha o schema real da tabela `notificacoes`:
//   destinatario_id, tipo, canal, titulo, conteudo, lida, criado_em
// canal aceito pelo banco: 'email' | 'ambos'
// tipo é texto livre — usamos: 'caso' | 'info' | 'alerta' | 'sistema'
// ============================================================
import { SupabaseClient } from '@supabase/supabase-js'

export type TipoNotificacao = 'caso' | 'info' | 'alerta' | 'sistema'

interface CriarNotificacaoParams {
  destinatarioId: string
  titulo: string
  conteudo: string
  tipo?: TipoNotificacao
  canal?: 'email' | 'ambos'
}

/**
 * Insere uma notificação in-app. Recebe um client Supabase já criado
 * (admin/service-role de preferência, para não esbarrar em RLS).
 * Nunca lança — falha de notificação não deve quebrar a operação principal.
 */
export async function criarNotificacao(
  supabase: SupabaseClient,
  { destinatarioId, titulo, conteudo, tipo = 'info', canal = 'ambos' }: CriarNotificacaoParams,
) {
  try {
    const { error } = await supabase.from('notificacoes').insert({
      destinatario_id: destinatarioId,
      tipo,
      canal,
      titulo,
      conteudo,
      lida: false,
    })
    if (error) console.error('[notificacoes] erro ao inserir:', error.message)
  } catch (err) {
    console.error('[notificacoes] exceção:', err)
  }
}
