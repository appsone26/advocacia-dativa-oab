'use client'
// ============================================================
// src/components/dashboard/AgendaPanel.tsx
// PASSO 3 — Painel de agenda da Direção (owner)
// ------------------------------------------------------------
// Enxuto e independente do ComissaoDashboard. Lista eventos
// (próximos + anteriores), permite criar evento (POST em
// /api/agenda/criar, que já aceita owner) e respeita o modo
// só-leitura pros observadores (podeEditar=false).
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar, Users, MapPin, Clock, Plus, X,
  CheckCircle, Eye, ChevronDown,
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface EventoAgenda {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  municipio_id: string | null
  municipio_nome?: string | null
  data_inicio: string
  data_fim: string | null
  criado_por: string | null
  status_reuniao?: string | null
}

interface MunicipioLite {
  id: string
  nome: string
}

interface AgendaPanelProps {
  perfil: { nome: string; email: string; cargo: string | null }
  agenda: EventoAgenda[]
  municipios: MunicipioLite[]
  podeEditar: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_REUNIAO: Record<string, { label: string; cor: string }> = {
  marcada:   { label: 'Marcada',   cor: 'bg-blue-100 text-blue-700' },
  realizada: { label: 'Realizada', cor: 'bg-emerald-100 text-emerald-700' },
  cancelada: { label: 'Cancelada', cor: 'bg-red-100 text-red-700' },
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AgendaPanel({
  perfil, agenda, municipios, podeEditar,
}: AgendaPanelProps) {
  const router = useRouter()

  const [modalAgenda, setModalAgenda] = useState(false)
  const [novoEvento, setNovoEvento] = useState({
    titulo: '', descricao: '', tipo: 'reuniao', data_inicio: '', data_fim: '', municipio_id: '', responsavel: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [msgSucesso, setMsgSucesso] = useState('')
  const [verAnteriores, setVerAnteriores] = useState(false)

  const agora = new Date()
  const proximos   = agenda.filter(ev => new Date(ev.data_inicio) >= agora)
  const anteriores = agenda.filter(ev => new Date(ev.data_inicio) <  agora).reverse()

  async function salvarEvento() {
    // Município e responsável são obrigatórios nos dois tipos.
    if (!novoEvento.titulo || !novoEvento.data_inicio || !novoEvento.municipio_id || !novoEvento.responsavel.trim()) return
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/agenda/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoEvento),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsgSucesso('Evento criado com sucesso!')
        setModalAgenda(false)
        setNovoEvento({ titulo: '', descricao: '', tipo: 'reuniao', data_inicio: '', data_fim: '', municipio_id: '', responsavel: '' })
        router.refresh() // re-puxa a agenda do servidor
        setTimeout(() => setMsgSucesso(''), 3000)
      } else {
        setErro(json?.error ?? 'Não foi possível criar o evento.')
      }
    } catch {
      setErro('Falha de rede ao criar o evento.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Agenda da Direção</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Reuniões e visitas aos municípios · {agenda.length} evento{agenda.length === 1 ? '' : 's'}
          </p>
        </div>

        {podeEditar ? (
          <button
            onClick={() => setModalAgenda(true)}
            className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d5986] transition-colors">
            <Plus size={15} /> Novo evento
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <Eye size={14} /> Modo observador · só leitura
          </div>
        )}
      </div>

      {/* Mensagens */}
      {msgSucesso && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle size={16} /> {msgSucesso}
        </div>
      )}
      {erro && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <X size={16} /> {erro}
        </div>
      )}

      {/* Próximos eventos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#1e3a5f] text-sm">Próximos eventos</h2>
          <span className="text-xs text-gray-400">{proximos.length}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {proximos.map(ev => <LinhaEvento key={ev.id} ev={ev} />)}
          {proximos.length === 0 && (
            <div className="py-12 text-center">
              <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">Nenhum evento futuro agendado.</p>
              {podeEditar && (
                <button
                  onClick={() => setModalAgenda(true)}
                  className="mt-3 text-sm text-[#2d5986] hover:underline">
                  Criar o primeiro evento
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Eventos anteriores (recolhível) */}
      {anteriores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setVerAnteriores(v => !v)}
            className="w-full px-4 py-3 border-b border-gray-100 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
            <h2 className="font-semibold text-[#1e3a5f] text-sm">
              Anteriores <span className="text-gray-400 font-normal">({anteriores.length})</span>
            </h2>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${verAnteriores ? 'rotate-180' : ''}`}
            />
          </button>
          {verAnteriores && (
            <div className="divide-y divide-gray-50">
              {anteriores.map(ev => <LinhaEvento key={ev.id} ev={ev} passado />)}
            </div>
          )}
        </div>
      )}

      {/* Modal: Novo Evento */}
      {modalAgenda && podeEditar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#1e3a5f]">Novo evento</h3>
              <button onClick={() => setModalAgenda(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input
                  type="text"
                  value={novoEvento.titulo}
                  onChange={e => setNovoEvento(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Reunião com a Defensoria"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                <div className="flex gap-2">
                  {[
                    { value: 'reuniao', label: 'Reunião', icon: Users },
                    { value: 'visita',  label: 'Visita municipal', icon: MapPin },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setNovoEvento(p => ({ ...p, tipo: value }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors
                        ${novoEvento.tipo === value
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Início *</label>
                  <input
                    type="datetime-local"
                    value={novoEvento.data_inicio}
                    onChange={e => setNovoEvento(p => ({ ...p, data_inicio: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fim</label>
                  <input
                    type="datetime-local"
                    value={novoEvento.data_fim}
                    onChange={e => setNovoEvento(p => ({ ...p, data_fim: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Município *</label>
                <select
                  value={novoEvento.municipio_id}
                  onChange={e => setNovoEvento(p => ({ ...p, municipio_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]">
                  <option value="">Selecione...</option>
                  {municipios.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsável / anfitrião *</label>
                <input
                  type="text"
                  value={novoEvento.responsavel}
                  onChange={e => setNovoEvento(p => ({ ...p, responsavel: e.target.value }))}
                  placeholder="Ex: Dr. João — Sec. de Assistência Social"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                <textarea
                  value={novoEvento.descricao}
                  onChange={e => setNovoEvento(p => ({ ...p, descricao: e.target.value }))}
                  rows={2}
                  placeholder="Detalhes do evento (opcional)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setModalAgenda(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Cancelar
              </button>
              <button
                onClick={salvarEvento}
                disabled={salvando || !novoEvento.titulo || !novoEvento.data_inicio || !novoEvento.municipio_id || !novoEvento.responsavel.trim()}
                className="px-4 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5986] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {salvando ? 'Salvando...' : 'Criar evento'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Sub-componente: linha de evento ─────────────────────────────────────────

function LinhaEvento({ ev, passado }: { ev: EventoAgenda; passado?: boolean }) {
  const isReuniao = ev.tipo === 'reuniao'
  const st = ev.status_reuniao ? STATUS_REUNIAO[ev.status_reuniao] : null

  return (
    <div className={`flex items-start gap-4 px-4 py-4 ${passado ? 'opacity-70' : ''}`}>
      <div className={`p-2 rounded-lg shrink-0 ${isReuniao ? 'bg-blue-50' : 'bg-purple-50'}`}>
        {isReuniao
          ? <Users size={16} className="text-blue-600" />
          : <MapPin size={16} className="text-purple-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800">{ev.titulo}</p>
        {ev.descricao && <p className="text-sm text-gray-500 mt-0.5">{ev.descricao}</p>}
        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={11} /> {formatarDataHora(ev.data_inicio)}
          </span>
          {ev.municipio_nome && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {ev.municipio_nome}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${isReuniao ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
          {isReuniao ? 'Reunião' : 'Visita'}
        </span>
        {st && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cor}`}>
            {st.label}
          </span>
        )}
      </div>
    </div>
  )
}
