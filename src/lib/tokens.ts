// ============================================================
// Tokens de confirmação (sem estado no banco).
// HMAC-SHA256 do id do caso com a service-role key como segredo.
// Determinístico → o mesmo link é válido enquanto a key não mudar.
// ============================================================
import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-secret'

export function assinarCaso(casoId: string): string {
  return createHmac('sha256', SECRET).update(`confirmar:${casoId}`).digest('hex').slice(0, 32)
}

export function validarCasoToken(casoId: string, token: string): boolean {
  const esperado = assinarCaso(casoId)
  if (!token || token.length !== esperado.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(esperado))
  } catch {
    return false
  }
}
