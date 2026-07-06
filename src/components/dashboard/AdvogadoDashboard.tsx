'use client'
// src/components/dashboard/AdvogadoDashboard.tsx
// Painel do Advogado ligado ao Supabase (dados reais).
// Ações: aceitar / recusar / concluir chamam as rotas /api/casos/*.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Scale, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Shield, Home, Inbox,
} from 'lucide-react'

export type CasoView = {
  id: string
  cliente_nome: string
  area_juridica: string
  descricao: string
  status: string
  numero_processo: string | null
  data_conclusao: string | null
  criado_em: string
}

type Props = {
  disponiveis: CasoView[]
  ativos: CasoView[]
  historico: CasoView[]
  municipioNome: string
  posicaoFila: number | null
  totalRecusas: number
  maxRecusas: number
  suspenso: boolean
}

const AREA = (a: string) => {
  const k = (a || '').toLowerCase()
  if (k.includes('violencia') || k.includes('violência')) return { label: 'Violência Doméstica', icon: Shield, cor: '#ef4444', bg: '#fee2e2' }
  if (k.includes('familia') || k.includes('família') || k.includes('aliment')) return { label: 'Família / Alimentos', icon: Scale, cor: '#f59e0b', bg: '#fef3c7' }
  return { label: a || 'Outros', icon: Home, cor: '#6366f1', bg: '#ede9fe' }
}

function dataBR(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function AdvogadoDashboard({
  disponiveis, ativos, historico, municipioNome, posicaoFila, totalRecusas, maxRecusas, suspenso,
}: Props) {
  const router = useRouter()
  const [aba, setAba] = useState<'disponiveis' | 'ativos' | 'historico'>(
    ativos.length ? 'ativos' : 'disponiveis',
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [recusaDe, setRecusaDe] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [concluirDe, setConcluirDe] = useState<string | null>(null)
  const [numProc, setNumProc] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  const totalConcluidos = historico.filter(c => c.data_conclusao).length

  async function chamar(url: string, body: Record<string, unknown>, tag: string) {
    setBusy(tag); setErro('')
    try {
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(json.error ?? 'Falha na operação'); return false }
      setRecusaDe(null); setMotivo(''); setConcluirDe(null); setNumProc('')
      router.refresh()
      return true
    } catch {
      setErro('Erro de conexão'); return false
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f' }}>Meu Painel</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
          {municipioNome} · Advocacia Dativa OAB-RJ
        </p>
      </div>

      {suspenso && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#dc2626' }}>
            <strong>Acesso suspenso:</strong> você atingiu o limite de recusas do programa. Procure a Comissão.
          </div>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '2px solid #dbeafe' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>POSIÇÃO NA FILA</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#1e3a5f' }}>{posicaoFila != null ? `#${posicaoFila}` : '—'}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>ordem de atribuição</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '2px solid #d1fae5' }}>
          <CheckCircle size={20} color="#10b981" style={{ marginBottom: '4px' }} />
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>{totalConcluidos}</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Concluídos</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: `2px solid ${totalRecusas >= 2 ? '#fee2e2' : '#f1f5f9'}` }}>
          <XCircle size={20} color={totalRecusas >= 2 ? '#ef4444' : '#94a3b8'} style={{ marginBottom: '4px' }} />
          <div style={{ fontSize: '28px', fontWeight: 900, color: totalRecusas >= 2 ? '#ef4444' : '#374151' }}>
            {totalRecusas}<span style={{ fontSize: '16px', color: '#94a3b8' }}>/{maxRecusas}</span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Recusas</div>
        </div>
      </div>

      {erro && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '12px' }}>{erro}</div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
        {([
          ['disponiveis', `📥 Disponíveis (${disponiveis.length})`],
          ['ativos', `⚖️ Meus Casos (${ativos.length})`],
          ['historico', `📋 Histórico (${historico.length})`],
        ] as const).map(([a, label]) => (
          <button key={a} onClick={() => setAba(a)} style={{
            padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            color: aba === a ? '#1e3a5f' : '#94a3b8', background: 'none',
            borderBottom: aba === a ? '2px solid #c9a227' : '2px solid transparent', marginBottom: '-2px',
          }}>{label}</button>
        ))}
      </div>

      {/* DISPONÍVEIS */}
      {aba === 'disponiveis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {disponiveis.length === 0 && <Vazio texto="Nenhum caso disponível no seu município no momento." />}
          {disponiveis.map(c => {
            const area = AREA(c.area_juridica); const AreaIcon = area.icon
            return (
              <div key={c.id} style={cardStyle(area.cor)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={iconBox(area.bg)}><AreaIcon size={18} color={area.cor} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{c.cliente_nome}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{area.label} · #{c.id.slice(0, 8)} · {dataBR(c.criado_em)}</div>
                  </div>
                </div>
                {c.descricao && <div style={descBox}>{c.descricao}</div>}
                {recusaDe === c.id ? (
                  <RecusaForm motivo={motivo} setMotivo={setMotivo} busy={busy === `rec-${c.id}`}
                    onCancel={() => { setRecusaDe(null); setMotivo('') }}
                    onConfirm={() => chamar('/api/casos/recusar', { caso_id: c.id, motivo }, `rec-${c.id}`)} />
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button disabled={busy != null || suspenso} onClick={() => chamar('/api/casos/aceitar', { caso_id: c.id }, `ace-${c.id}`)} style={btnPrimary}>
                      <CheckCircle size={16} /> {busy === `ace-${c.id}` ? 'Aceitando...' : 'Aceitar Caso'}
                    </button>
                    <button disabled={busy != null} onClick={() => setRecusaDe(c.id)} style={btnDanger}>
                      <XCircle size={16} /> Recusar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ATIVOS */}
      {aba === 'ativos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ativos.length === 0 && <Vazio texto="Você não tem casos em andamento." />}
          {ativos.map(c => {
            const area = AREA(c.area_juridica); const AreaIcon = area.icon
            return (
              <div key={c.id} style={cardStyle(area.cor)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={iconBox(area.bg)}><AreaIcon size={18} color={area.cor} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{c.cliente_nome}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{area.label} · #{c.id.slice(0, 8)}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#dbeafe', color: '#1e3a5f' }}>Em andamento</span>
                </div>
                {c.descricao && <div style={descBox}>{c.descricao}</div>}
                {concluirDe === c.id ? (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>🔒 NÚMERO DO PROCESSO JUDICIAL (obrigatório — antifraude)</div>
                    <input value={numProc} onChange={e => setNumProc(e.target.value)} placeholder="Ex: 0012345-23.2026.8.19.0001"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button disabled={numProc.trim().length < 5 || busy != null}
                        onClick={() => chamar('/api/casos/concluir', { caso_id: c.id, numero_processo: numProc }, `con-${c.id}`)}
                        style={{ ...btnSuccess, opacity: numProc.trim().length < 5 ? 0.5 : 1 }}>
                        <CheckCircle size={16} /> {busy === `con-${c.id}` ? 'Concluindo...' : 'Marcar como Concluído'}
                      </button>
                      <button onClick={() => { setConcluirDe(null); setNumProc('') }} style={btnGhost}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button disabled={busy != null} onClick={() => setConcluirDe(c.id)} style={{ ...btnSuccess, width: '100%' }}>
                    <CheckCircle size={16} /> Concluir Caso
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* HISTÓRICO */}
      {aba === 'historico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {historico.length === 0 && <Vazio texto="Nenhum caso no histórico ainda." />}
          {historico.map(c => {
            const area = AREA(c.area_juridica); const aberto = expandido === c.id
            return (
              <div key={c.id} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', borderLeft: `4px solid ${area.cor}`, overflow: 'hidden' }}>
                <button onClick={() => setExpandido(aberto ? null : c.id)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{c.cliente_nome}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{area.label} · #{c.id.slice(0, 8)} · {dataBR(c.data_conclusao ?? c.criado_em)}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#d1fae5', color: '#10b981', flexShrink: 0 }}>Concluído</span>
                  {aberto ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </button>
                {aberto && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                    {c.descricao && <div style={{ paddingTop: '12px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{c.descricao}</div>}
                    {c.numero_processo && (
                      <div style={{ marginTop: '10px', background: '#f0fdf4', borderRadius: '8px', padding: '8px 12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>📄 Nº do Processo: </span>
                        <span style={{ fontSize: '12px', color: '#166534', fontFamily: 'monospace' }}>{c.numero_processo}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── estilos/subcomponentes ──
const cardStyle = (cor: string): React.CSSProperties => ({ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', borderLeft: `4px solid ${cor}` })
const iconBox = (bg: string): React.CSSProperties => ({ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 })
const descBox: React.CSSProperties = { background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '12px' }
const btnBase: React.CSSProperties = { flex: 1, padding: '11px', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
const btnPrimary: React.CSSProperties = { ...btnBase, background: '#1e3a5f', color: '#fff' }
const btnSuccess: React.CSSProperties = { ...btnBase, background: '#10b981', color: '#fff' }
const btnDanger: React.CSSProperties = { ...btnBase, background: '#fff', color: '#ef4444', border: '2px solid #ef4444' }
const btnGhost: React.CSSProperties = { padding: '10px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }

function Vazio({ texto }: { texto: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <Inbox size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
      <div style={{ fontSize: '14px', color: '#94a3b8' }}>{texto}</div>
    </div>
  )
}

function RecusaForm({ motivo, setMotivo, busy, onCancel, onConfirm }: {
  motivo: string; setMotivo: (v: string) => void; busy: boolean; onCancel: () => void; onConfirm: () => void
}) {
  return (
    <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>⚠️ Motivo da recusa (obrigatório)</div>
      <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
        placeholder="Descreva o motivo. Este registro é obrigatório e fica no histórico do programa."
        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #fca5a5', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button disabled={motivo.trim().length < 10 || busy} onClick={onConfirm}
          style={{ flex: 1, padding: '10px', background: motivo.trim().length >= 10 ? '#ef4444' : '#fca5a5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: motivo.trim().length >= 10 ? 'pointer' : 'not-allowed' }}>
          {busy ? 'Enviando...' : 'Confirmar Recusa'}
        </button>
        <button onClick={onCancel} style={btnGhost}>Cancelar</button>
      </div>
    </div>
  )
}
