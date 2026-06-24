import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Advocacia Dativa — OAB-RJ',
  description: 'Sistema de gestão da Comissão de Desenvolvimento da Advocacia Dativa · OAB-RJ',
  // Nome curto que aparece na tela inicial do celular
  applicationName: 'Advocacia Dativa',
  // Configuração para abrir em tela cheia no iPhone (modo app)
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Advocacia Dativa',
  },
  // Favicon será o brasão da OAB-RJ (adicionar em /public/favicon.ico)
}

// Viewport — preenche a tela toda, inclusive bordas e notch
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1e3a5f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Abre em tela cheia ao adicionar à tela inicial (iPhone) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans bg-gray-50 antialiased`}>
        {children}
      </body>
    </html>
  )
}
