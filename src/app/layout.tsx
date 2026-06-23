import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Advocacia Dativa — OAB-RJ',
  description: 'Sistema de gestão da Comissão de Desenvolvimento da Advocacia Dativa · OAB-RJ',
  // Favicon será o brasão da OAB-RJ (adicionar em /public/favicon.ico)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-gray-50 antialiased`}>
        {children}
      </body>
    </html>
  )
}
