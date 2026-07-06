'use client'
// src/components/dashboard/NotificacoesSininho.tsx
// Sininho de notificações — faz polling a cada 30s em /api/notificacoes
import { useEffect, useState, useCallback } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'

type Notificacao = {
  id: string
  tipo: string
  titulo: string
  conteudo: string
  lida: boolean
  criado_em: string
}

const CORES_TIPO: Record<string, string> = {
  caso: '#1e3a5f',
  alerta: '#ef4444',
  sistema: '#c9a227',
  info: '#2d5986',
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

export default function NotificacoesSininho() {
  const [aberto, setAberto] = useState(false)
  const [lista, setLista] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/notificacoes', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setLista(json.notificacoes ?? [])
      setNaoLidas(json.naoLidas ?? 0)
    } catch {
      /* silencioso */
    }
  }, [])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 30000) // polling 30s
    return () => clearInterval(t)
  }, [carregar])

  async function marcarLida(id: string) {
    setLista(l => l.map(n => (n.id === id ? { ...n, lida: true } : n)))
    setNaoLidas(n => Math.max(0, n - 1))
    await fetch('/api/notificacoes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function marcarTodas() {
    setLista(l => l.map(n => ({ ...n, lida: true })))
    setNaoLidas(0)
    await fetch('/api/notificacoes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todas: true }),
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { setAberto(v => !v); if (!aberto) carregar() }}
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', lineHeight: 0, position: 'relative' }}
        aria-label="Notificações"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px', minWidth: '16px', height: '16px',
            borderRadius: '99px', background: '#ef4444', color: '#fff', fontSize: '10px',
            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid #1e3a5f', boxSizing: 'content-box',
          }}>
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div onClick={() => setAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: '340px', maxWidth: '90vw',
            background: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            zIndex: 50, overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a5f' }}>Notificações</span>
              {naoLidas > 0 && (
                <button onClick={marcarTodas} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d5986', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCheck size={14} /> Marcar todas
                </button>
              )}
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {lista.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Nenhuma notificação por enquanto.
                </div>
              ) : (
                lista.map(n => (
                  <div key={n.id} style={{
                    display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #f8fafc',
                    background: n.lida ? '#fff' : '#f4f8fd',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, background: CORES_TIPO[n.tipo] ?? '#2d5986' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{n.titulo}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{tempoRelativo(n.criado_em)}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.5 }}>{n.conteudo}</div>
                    </div>
                    {!n.lida && (
                      <button onClick={() => marcarLida(n.id)} title="Marcar como lida" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', lineHeight: 0, alignSelf: 'flex-start' }}>
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
