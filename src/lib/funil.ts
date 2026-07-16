// ============================================================
// src/lib/funil.ts
// Funil de status das cidades (municipios.status_atendimento).
//
// PRINCÍPIO (desenho seção 1): "a agenda comanda o status da cidade".
// A transição roda AQUI, no código (helper compartilhado chamado pelas
// rotas de agenda) — NÃO em trigger no banco (decisão de produto:
// auditoria é best-effort pelas rotas, mais fácil de controlar no código).
//
// Os 5 estágios batem com o CHECK real de municipios.status_atendimento
// (migração 3.1, aplicada em 15/07):
//   nao_visitada · marcada · negociacao · fechado · nao_participa
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'

export const STATUS_FUNIL = [
  'nao_visitada',
  'marcada',
  'negociacao',
  'fechado',
  'nao_participa',
] as const

export type StatusFunil = (typeof STATUS_FUNIL)[number]

export function isStatusFunil(v: unknown): v is StatusFunil {
  return typeof v === 'string' && (STATUS_FUNIL as readonly string[]).includes(v)
}

export interface TransicaoFunil {
  municipio_id: string
  municipio_nome: string | null
  de: string | null
  para: string | null
  mudou: boolean
}

// Regra 3.2 — ao CRIAR um evento numa cidade:
//   - cidade `nao_visitada`               -> vira `marcada` (automático)
//   - cidade em qualquer outro estágio    -> mantém o estágio; a nova data
//     só entra na fila (negociacao/fechado/nao_participa NÃO regridem).
//
// Usa o client ADMIN (service role): a atualização de `municipios` passa por
// RLS que a comissão não teria; o helper roda no servidor, após o evento
// já ter sido criado. Retorna o de/para para a auditoria (best-effort).
export async function aoCriarEvento(
  admin: SupabaseClient,
  municipioId: string,
): Promise<TransicaoFunil> {
  const { data: mun } = await admin
    .from('municipios')
    .select('id, nome, status_atendimento')
    .eq('id', municipioId)
    .single()

  const nome = mun?.nome ?? null
  const de = mun?.status_atendimento ?? null

  if (de === 'nao_visitada') {
    const { error } = await admin
      .from('municipios')
      .update({ status_atendimento: 'marcada', atualizado_em: new Date().toISOString() })
      .eq('id', municipioId)

    if (!error) {
      return { municipio_id: municipioId, municipio_nome: nome, de, para: 'marcada', mudou: true }
    }
    // Se a atualização falhar, não derruba a criação do evento: apenas
    // reporta que o estágio permaneceu.
    console.warn('[funil] falha ao mover cidade para marcada (ignorado):', error.message)
  }

  return { municipio_id: municipioId, municipio_nome: nome, de, para: de, mudou: false }
}
