// ============================================================
// Resend — cliente de envio de email transacional
// Conta: advocaciadativarj@gmail.com
// Domínio verificado: dativa.appsone.com.br
// ============================================================

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = `${process.env.RESEND_FROM_NAME ?? 'Advocacia Dativa OAB-RJ'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@dativa.appsone.com.br'}>`

interface EnviarEmailParams {
  para: string
  assunto: string
  html: string
}

export async function enviarEmail({ para, assunto, html }: EnviarEmailParams) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: para,
    subject: assunto,
    html,
  })

  if (error) {
    console.error('[Resend] Erro ao enviar email:', error)
    throw new Error('Falha ao enviar email')
  }

  return data
}
