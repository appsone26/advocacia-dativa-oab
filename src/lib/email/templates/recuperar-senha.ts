// ============================================================
// Template de email — Recuperação de senha
// HTML com tabelas (compatível com todos os clientes de email)
// Identidade visual Advocacia Dativa / OAB-RJ
// ============================================================

interface RecuperarSenhaEmailParams {
  nome?: string
  linkRecuperacao: string
}

export function recuperarSenhaEmail({ nome, linkRecuperacao }: RecuperarSenhaEmailParams): string {
  const saudacao = nome ? `Olá, ${nome}` : 'Olá'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de senha — Advocacia Dativa</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family:'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(30,58,95,0.08);">

          <!-- Cabeçalho institucional -->
          <tr>
            <td style="background-color:#1e3a5f; padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:14px;">
                    <div style="width:44px; height:44px; background-color:#c9a227; border-radius:11px; text-align:center; line-height:44px; font-size:22px;">⚖</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="color:#c9a227; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">OAB · Rio de Janeiro</div>
                    <div style="color:#ffffff; font-size:18px; font-weight:800; margin-top:2px;">Advocacia Dativa</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px; color:#1e3a5f; font-size:20px; font-weight:700;">Recuperação de senha</h1>

              <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.6;">
                ${saudacao},
              </p>

              <p style="margin:0 0 24px; color:#334155; font-size:15px; line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha de acesso ao sistema da Comissão de Desenvolvimento da Advocacia Dativa. Para criar uma nova senha, clique no botão abaixo:
              </p>

              <!-- Botão CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="background-color:#1e3a5f; border-radius:8px;">
                    <a href="${linkRecuperacao}" target="_blank" style="display:inline-block; padding:14px 32px; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px; color:#64748b; font-size:13px; line-height:1.6;">
                Se o botão não funcionar, copie e cole o endereço abaixo no seu navegador:
              </p>
              <p style="margin:0 0 24px; word-break:break-all;">
                <a href="${linkRecuperacao}" target="_blank" style="color:#2d5986; font-size:13px;">${linkRecuperacao}</a>
              </p>

              <!-- Aviso de segurança -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7ee; border-left:3px solid #c9a227; border-radius:0 8px 8px 0;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0; color:#8a6a17; font-size:13px; line-height:1.5;">
                      Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este email — sua senha permanece inalterada.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0;">
              <p style="margin:0; color:#94a3b8; font-size:12px; line-height:1.5; text-align:center;">
                Comissão de Desenvolvimento da Advocacia Dativa<br>
                Ordem dos Advogados do Brasil — Seccional Rio de Janeiro<br>
                Este é um email automático, não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
