// ============================================================
// Template de email — Caso concluído (enviado AO CLIENTE)
// Pede que o cliente confirme a conclusão do atendimento clicando
// no link (regra: conclusão/pagamento só com confirmação do cliente).
// ============================================================

interface CasoConcluidoClienteParams {
  nomeCliente: string
  numeroCaso: string
  numeroProcesso: string
  linkConfirmar: string
}

export function casoConcluidoClienteEmail({
  nomeCliente, numeroCaso, numeroProcesso, linkConfirmar,
}: CasoConcluidoClienteParams): { subject: string; html: string } {
  const subject = `Confirme a conclusão do seu caso #${numeroCaso}`

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(30,58,95,0.08);">
        <tr><td style="background:#1e3a5f;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#c9a227;letter-spacing:2px;text-transform:uppercase;font-weight:600;">OAB-RJ · Advocacia Dativa</p>
          <h1 style="margin:10px 0 0;font-size:22px;color:#fff;font-weight:700;">Seu caso foi concluído</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 28px;">
          <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1e3a5f;">Olá, ${nomeCliente}!</p>
          <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
            O(a) advogado(a) responsável concluiu o seu caso <strong>#${numeroCaso}</strong>
            (processo <strong>${numeroProcesso}</strong>). Para finalizar, confirme abaixo que o
            atendimento foi realizado.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${linkConfirmar}" style="display:inline-block;background:#10b981;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">Confirmar conclusão ✓</a>
          </td></tr></table>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
            Se o botão não funcionar, copie e cole este endereço no navegador:<br/>
            <a href="${linkConfirmar}" style="color:#2d5986;word-break:break-all;">${linkConfirmar}</a>
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
