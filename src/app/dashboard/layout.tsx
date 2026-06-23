'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [nivel, setNivel] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
        return
      }
      const meta = user.user_metadata ?? {}
      setNome(meta.nome ?? user.email ?? '')
      setNivel(meta.nivel ?? '')
      setReady(true)
    })
  }, [router])

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f4f8'
      }}>
        <p style={{ color: '#2d5986', fontSize: '14px' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column' }}>
      <Header
        nome={nome}
        nivel={nivel}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>

        {/* Sidebar desktop — sempre visível em telas >= 768px */}
        <div className="hidden md:block" style={{ width: '230px', flexShrink: 0 }}>
          <Sidebar nivel={nivel} open={true} onClose={() => {}} isDesktop={true} />
        </div>

        {/* Sidebar mobile — gaveta */}
        <div className="md:hidden">
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                top: '52px',
                background: 'rgba(0,0,0,0.4)',
                zIndex: 20
              }}
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
