'use client'
// src/components/dashboard/DashboardShell.tsx
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [nivel, setNivel] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setNome((user.user_metadata?.nome as string) ?? user.email ?? '')
        setNivel((user.user_metadata?.nivel as string) ?? '')
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column' }}>
      <Header
        nome={nome}
        nivel={nivel}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar fixa no desktop */}
        <div className="hidden md:block" style={{ width: '230px', flexShrink: 0 }}>
          <Sidebar nivel={nivel} open={true} onClose={() => {}} isDesktop={true} />
        </div>

        {/* Gaveta mobile */}
        <div className="md:hidden">
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, top: '52px',
                background: 'rgba(0,0,0,0.4)', zIndex: 20
              }}
            />
          )}
          <Sidebar
            nivel={nivel}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isDesktop={false}
          />
        </div>

        <main style={{ flex: 1, padding: '24px', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
