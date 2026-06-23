'use client'

import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

type Props = {
  nome: string
  nivel: string
  children: React.ReactNode
}

export default function DashboardShell({ nome, nivel, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column' }}>
      <Header
        nome={nome}
        nivel={nivel}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Desktop: sidebar fixa */}
        <div className="hidden md:block" style={{ width: '230px', flexShrink: 0 }}>
          <Sidebar nivel={nivel} open={true} onClose={() => {}} isDesktop={true} />
        </div>

        {/* Mobile: gaveta */}
        <div className="md:hidden">
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, top: '52px', background: 'rgba(0,0,0,0.4)', zIndex: 20 }}
            />
          )}
          <Sidebar nivel={nivel} open={sidebarOpen} onClose={() => setSidebarOpen(false)} isDesktop={false} />
        </div>

        <main style={{ flex: 1, padding: '24px', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
