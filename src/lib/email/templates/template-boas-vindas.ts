export function templateBoasVindas({
  nome,
  nivel,
  loginUrl,
}: {
  nome: string
  nivel: string
  loginUrl: string
}): { subject: string; html: string } {
  const nivelLabel: Record<string, string> = {
    comissao: 'Membro da Comissão',
    gestor:   'Gestor Municipal',
    advogado: 'Advogado(a)',
  }

  const subject = `Bem-vindo(a) ao sistema Advocacia Dativa OAB-RJ`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo(a) — Advocacia Dativa</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Cabeçalho azul -->
          <tr>
            <td style="background:#1e3a5f;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#c9a227;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                OAB-RJ · Comissão de Advocacia Dativa
              </p>
              <h1 style="margin:12px 0 0;font-size:24px;color:#ffffff;font-weight:700;">
                Advocacia Dativa
              </h1>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e3a5f;">
                Olá, ${nome}!
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                Seu acesso ao sistema Advocacia Dativa foi criado com sucesso.
                Você está cadastrado(a) como <strong>${nivelLabel[nivel] ?? nivel}</strong>.
              </p>

              <!-- Caixa de credenciais -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                      Senha inicial
                    </p>
                    <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1e3a5f;letter-spacing:1px;">
                      Dativa@2026
                    </p>
                    <p style="margin:0;font-size:12px;color:#f59e0b;">
                      ⚠️ Você precisará trocar esta senha no primeiro acesso.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Botão -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}"
                      style="display:inline-block;background:#1e3a5f;color:#ffffff;font-size:14px;font-weight:600;
                             text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.3px;">
                      Acessar o sistema →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Se tiver dúvidas, entre em contato com a Comissão de Advocacia Dativa.<br/>
                <a href="mailto:advocaciadativarj@gmail.com" style="color:#2d5986;">
                  advocaciadativarj@gmail.com
                </a>
              </p>
            </td>
          </tr>

          <!-- Rodapé dourado -->
          <tr>
            <td style="background:#c9a227;padding:16px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#ffffff;letter-spacing:0.5px;">
                OAB-RJ · Ordem dos Advogados do Brasil — Seccional Rio de Janeiro
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return { subject, html }
}
