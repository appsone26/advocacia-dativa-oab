// ============================================================
// Cliente Supabase ADMIN (service role)
// ATENÇÃO: usa a SERVICE_ROLE_KEY — acesso total ao banco,
// ignora RLS. NUNCA importe isto em Client Components.
// Só em Route Handlers e Server Actions no servidor.
// ============================================================

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
