// ============================================================
// Template de email — Caso aceito (enviado AO CLIENTE)
// Informa ao cliente que um advogado voluntário assumiu o caso
// e entrega os dados de contato do advogado (por email).
// ============================================================

interface CasoAceitoClienteParams {
  nomeCliente: string
  nomeAdvogado: string
  emailAdvogado: string
  oabAdvogado?: string | null
  areaJuridica: string
  municipio: string
  numeroCaso: string
}

export function casoAceitoClienteEmail({
  nomeCliente,
  nomeAdvogado,
  emailAdvogado,
  oabAdvogado,
  areaJuridica,
  municipio,
  numeroCaso,
}: CasoAceitoClienteParams): { subject: string; html: string } {
  const subject = `Seu caso foi aceito por um advogado voluntário`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(30,58,95,0.08);">
        <tr><td style="background:#1e3a5f;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#c9a227;letter-spacing:2px;text-transform:uppercase;font-weight:600;">OAB-RJ · Advocacia Dativa</p>
          <h1 style="margin:10px 0 0;font-size:22px;color:#fff;font-weight:700;">Boas notícias!</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 28px;">
          <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1e3a5f;">Olá, ${nomeCliente}!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
            Um advogado voluntário do programa <strong>Advocacia Dativa OAB-RJ</strong> aceitou o seu
            caso <strong>#${numeroCaso}</strong>. A partir de agora, o contato será feito diretamente
            por email com o(a) advogado(a) responsável.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Advogado(a) responsável</p>
              <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#166534;">${nomeAdvogado}${oabAdvogado ? ` · OAB ${oabAdvogado}` : ''}</p>
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Email para contato</p>
              <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2d5986;">
                <a href="mailto:${emailAdvogado}" style="color:#2d5986;text-decoration:none;">${emailAdvogado}</a>
              </p>
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Área jurídica · Município</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#334155;">${areaJuridica} · ${municipio}</p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
            Guarde este email. Se precisar de ajuda, contate a Comissão de Advocacia Dativa em
            <a href="mailto:advocaciadativarj@gmail.com" style="color:#2d5986;">advocaciadativarj@gmail.com</a>.
          </p>
        </td></tr>
        <tr><td style="background:#c9a227;padding:14px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#fff;">OAB-RJ · Ordem dos Advogados do Brasil — Seccional Rio de Janeiro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, html }
}
