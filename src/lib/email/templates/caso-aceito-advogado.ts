// ============================================================
// Template de email — Caso aceito (enviado AO ADVOGADO)
// Entrega ao advogado os dados de contato do cliente.
// Regra de negócio: o contato entre as partes é 100% por email;
// o sistema nunca expõe telefone de uma parte para a outra.
// ============================================================

interface CasoAceitoAdvogadoParams {
  nomeAdvogado: string
  nomeCliente: string
  emailCliente: string
  areaJuridica: string
  descricaoCaso: string
  municipio: string
  numeroCaso: string
  painelUrl: string
}

export function casoAceitoAdvogadoEmail({
  nomeAdvogado,
  nomeCliente,
  emailCliente,
  areaJuridica,
  descricaoCaso,
  municipio,
  numeroCaso,
  painelUrl,
}: CasoAceitoAdvogadoParams): { subject: string; html: string } {
  const subject = `Caso aceito — dados do cliente (${nomeCliente})`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(30,58,95,0.08);">
        <tr><td style="background:#1e3a5f;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#c9a227;letter-spacing:2px;text-transform:uppercase;font-weight:600;">OAB-RJ · Advocacia Dativa</p>
          <h1 style="margin:10px 0 0;font-size:22px;color:#fff;font-weight:700;">Caso aceito com sucesso</h1>
        </td></tr>
        <tr><td style="padding:36px 40px 28px;">
          <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1e3a5f;">Olá, ${nomeAdvogado}!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
            Você aceitou o caso <strong>#${numeroCaso}</strong>. Abaixo estão os dados de contato
            do(a) cliente para que você inicie o atendimento. O contato deve ser feito por email.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Cliente</p>
              <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#1e3a5f;">${nomeCliente}</p>
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Email para contato</p>
              <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2d5986;">
                <a href="mailto:${emailCliente}" style="color:#2d5986;text-decoration:none;">${emailCliente}</a>
              </p>
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Área jurídica · Município</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#334155;">${areaJuridica} · ${municipio}</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7ee;border-left:3px solid #c9a227;border-radius:0 8px 8px 0;margin-bottom:24px;">
            <tr><td style="padding:14px 16px;">
              <p style="margin:0 0 4px;font-size:11px;color:#8a6a17;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Descrição do caso</p>
              <p style="margin:0;font-size:13px;color:#5c460f;line-height:1.6;">${descricaoCaso}</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${painelUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Abrir meu painel →</a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
            Lembre-se: ao concluir o caso, o número do processo judicial é obrigatório.
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
