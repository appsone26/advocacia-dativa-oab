// ============================================================
// GET /api/casos/confirmar?caso=<id>&t=<token>   (PÚBLICA)
// Link enviado ao cliente no email de conclusão. Ao clicar, marca
// casos.cliente_confirmou = true (regra: pagamento/conclusão só com
// confirmação do cliente). Retorna uma página HTML amigável.
// ============================================================
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarCasoToken } from '@/lib/tokens'

function pagina(titulo: string, mensagem: string, ok: boolean): Response {
  const cor = ok ? '#10b981' : '#ef4444'
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo} — Advocacia Dativa</title></head>
    <body style="margin:0;background:#f0f4f8;font-family:Arial,sans-serif;">
      <div style="max-width:440px;margin:48px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(30,58,95,.1)">
        <div style="background:#1e3a5f;padding:24px;text-align:center">
          <div style="color:#c9a227;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700">OAB-RJ · Advocacia Dativa</div>
        </div>
        <div style="padding:32px 28px;text-align:center">
          <div style="width:64px;height:64px;border-radius:50%;background:${cor}22;color:${cor};font-size:34px;line-height:64px;margin:0 auto 16px">${ok ? '✓' : '!'}</div>
          <h1 style="font-size:20px;color:#1e3a5f;margin:0 0 8px">${titulo}</h1>
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0">${mensagem}</p>
        </div>
        <div style="background:#c9a227;padding:12px;text-align:center;font-size:11px;color:#fff">OAB-RJ · Ordem dos Advogados do Brasil — Seccional Rio de Janeiro</div>
      </div>
    </body></html>`
  return new Response(html, { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(request: NextRequest) {
  const caso = request.nextUrl.searchParams.get('caso') ?? ''
  const token = request.nextUrl.searchParams.get('t') ?? ''

  if (!caso || !validarCasoToken(caso, token)) {
    return pagina('Link inválido', 'Este link de confirmação é inválido ou expirou. Entre em contato com a Comissão de Advocacia Dativa.', false)
  }

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('casos').select('id, cliente_confirmou, data_conclusao').eq('id', caso).single()

  if (!row) {
    return pagina('Caso não encontrado', 'Não localizamos este caso. Verifique o link recebido por email.', false)
  }
  if (row.cliente_confirmou) {
    return pagina('Conclusão já confirmada', 'Você já havia confirmado a conclusão deste caso. Obrigado!', true)
  }

  await admin.from('casos').update({ cliente_confirmou: true }).eq('id', caso)

  return pagina(
    'Conclusão confirmada!',
    'Obrigado por confirmar. O atendimento pela Advocacia Dativa OAB-RJ foi concluído com sucesso.',
    true,
  )
}
