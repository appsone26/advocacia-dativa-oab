'use client'
// src/components/dashboard/OwnerDashboard.tsx
// Fila da Direção (fase Defensoria) — a agenda comanda o status da cidade.
// A lista deixa de ser alfabética e vira uma FILA por data do próximo
// compromisso (vencidos, por terem data passada, sobem ao topo).

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, AlertTriangle, CheckCircle2, Search, ChevronRight, X,
  Clock, Filter, RefreshCw, Globe, MapPin,
  CalendarDays, ShieldCheck, Route, Ban, ArrowRight,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface Municipio {
  id: string
  nome: string
  regiao: string
  logo_url: string | null
  status_atendimento: string | null
  populacao: number | null
  distancia_capital_km: number | null
  atualizado_em: string
}

interface EventoAgenda {
  id: string
  titulo: string
  tipo: string
  municipio_id: string | null
  data_inicio: string
  data_fim: string | null
  responsavel: string | null
  status_reuniao: string | null
  descricao: string | null
}

interface Props {
  municipios: Municipio[]
  eventos: EventoAgenda[]
}

interface ItemFila {
  municipio: Municipio
  compromisso: EventoAgenda | null
  vencido: boolean
  refData: string | null
}

// ---------------------------------------------------------------------------
// Status de atendimento — funil de 5 estágios (alinhado ao CHECK real)
// ---------------------------------------------------------------------------
type StatusChave = 'nao_visitada' | 'marcada' | 'negociacao' | 'fechado' | 'nao_participa'

const ORDEM_STATUS: StatusChave[] = ['nao_visitada', 'marcada', 'negociacao', 'fechado', 'nao_participa']

// Estágios que aparecem como chips de filtro DA FILA. `fechado` e `nao_participa`
// não entram na fila (D1), então filtrar por eles daria lista vazia — ficam de fora.
const STATUS_FILTRO_FILA: StatusChave[] = ORDEM_STATUS.filter(
  s => s !== 'fechado' && s !== 'nao_participa'
)

const STATUS: Record<StatusChave, {
  label: string
  curto: string
  color: string
  dot: string
  borda: string
  icone: React.ReactNode
}> = {
  nao_visitada: {
    label: 'Não visitada', curto: 'Não visitadas',
    color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', borda: 'border-gray-300',
    icone: <MapPin className="w-5 h-5 text-gray-500" />,
  },
  marcada: {
    label: 'Reunião marcada', curto: 'Marcadas',
    color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', borda: 'border-blue-400',
    icone: <CalendarDays className="w-5 h-5 text-blue-600" />,
  },
  negociacao: {
    label: 'Em negociação', curto: 'Negociação',
    color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', borda: 'border-amber-400',
    icone: <Clock className="w-5 h-5 text-amber-500" />,
  },
  fechado: {
    label: 'Fechado', curto: 'Fechados',
    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', borda: 'border-emerald-500',
    icone: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
  },
  nao_participa: {
    label: 'Não participa', curto: 'Não participam',
    color: 'bg-red-100 text-red-700', dot: 'bg-red-500', borda: 'border-red-400',
    icone: <Ban className="w-5 h-5 text-red-600" />,
  },
}

// Avanço do funil (só avança, nunca volta pra nao_visitada).
const PROXIMO_ESTAGIO: Record<StatusChave, StatusChave | null> = {
  nao_visitada: 'marcada',
  marcada: 'negociacao',
  negociacao: 'fechado',
  fechado: null,
  nao_participa: null,
}

function chaveStatus(m: Municipio): StatusChave {
  const s = (m.status_atendimento ?? 'nao_visitada') as StatusChave
  return ORDEM_STATUS.includes(s) ? s : 'nao_visitada'
}

function formatHab(n: number | null): string {
  return n == null ? '—' : n.toLocaleString('pt-BR')
}

function fmtDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

const REGIOES = [
  'Todas as regiões',
  'Baixada Fluminense', 'Centro-Sul', 'Costa Verde', 'Lagos', 'Metropolitana',
  'Noroeste', 'Norte Fluminense', 'Serrana', 'Sul Fluminense',
]

const TOTAL = 92

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function OwnerDashboard({ municipios, eventos }: Props) {
  const router = useRouter()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusChave>('todos')
  const [filtroRegiao, setFiltroRegiao] = useState('Todas as regiões')
  const [selecionado, setSelecionado] = useState<ItemFila | null>(null)

  // ── Contadores por status (sobre os 92) ──
  const totais = useMemo(() => {
    const acc: Record<StatusChave, number> = {
      nao_visitada: 0, marcada: 0, negociacao: 0, fechado: 0, nao_participa: 0,
    }
    for (const m of municipios) acc[chaveStatus(m)]++
    return acc
  }, [municipios])

  const comContato = municipios.filter(m => (m.status_atendimento ?? 'nao_visitada') !== 'nao_visitada').length
  const faltam = municipios.length - comContato

  // ── Fila: municípios com evento, exceto fechado/nao_participa, ordenados
  //    pela data de referência (próximo futuro; senão o último passado) ──
  const fila = useMemo<ItemFila[]>(() => {
    const agora = new Date()

    const porMun = new Map<string, EventoAgenda[]>()
    for (const ev of eventos) {
      if (!ev.municipio_id) continue
      if (ev.status_reuniao === 'cancelada') continue // defensivo (query já filtra)
      const arr = porMun.get(ev.municipio_id) ?? []
      arr.push(ev)
      porMun.set(ev.municipio_id, arr)
    }

    const itens: ItemFila[] = []
    for (const [munId, evs] of porMun) {
      const municipio = municipios.find(m => m.id === munId)
      if (!municipio) continue
      // D1: fora da fila quem já está fechado ou não participa.
      const st = chaveStatus(municipio)
      if (st === 'fechado' || st === 'nao_participa') continue

      const futuros = evs
        .filter(e => new Date(e.data_inicio) >= agora)
        .sort((a, b) => +new Date(a.data_inicio) - +new Date(b.data_inicio))
      const passados = evs
        .filter(e => new Date(e.data_inicio) < agora)
        .sort((a, b) => +new Date(b.data_inicio) - +new Date(a.data_inicio))

      const proximo = futuros[0] ?? null
      const compromisso = proximo ?? passados[0] ?? null
      const vencido = !proximo
      const refData = compromisso ? compromisso.data_inicio : null

      itens.push({ municipio, compromisso, vencido, refData })
    }

    // D2: refData ascendente — vencidos (data passada) sobem ao topo.
    itens.sort((a, b) => {
      const ta = a.refData ? +new Date(a.refData) : Infinity
      const tb = b.refData ? +new Date(b.refData) : Infinity
      return ta - tb
    })
    return itens
  }, [eventos, municipios])

  // ── Filtros operando sobre a fila ──
  const filaFiltrada = useMemo(() => {
    return fila.filter(item => {
      const m = item.municipio
      const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase())
      const matchStatus = filtroStatus === 'todos' || chaveStatus(m) === filtroStatus
      const matchRegiao = filtroRegiao === 'Todas as regiões' || m.regiao === filtroRegiao
      return matchBusca && matchStatus && matchRegiao
    })
  }, [fila, busca, filtroStatus, filtroRegiao])

  function fecharModal() {
    setSelecionado(null)
  }

  function aoConcluir() {
    setSelecionado(null)
    router.refresh() // re-puxa municípios + agenda do servidor
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Cabeçalho + contador ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Fila da Direção — Estado do Rio de Janeiro</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cidades ordenadas pela data do próximo compromisso · OAB-RJ e Defensoria Pública
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm shrink-0">
            <span className="text-[#c9a227]">🎯</span>
            <span className="text-sm text-gray-600">
              <span className="font-bold text-[#1e3a5f]">{comContato}</span> de {TOTAL} com contato ·
              faltam <span className="font-bold text-[#1e3a5f]">{faltam}</span>
            </span>
          </div>
        </div>

        {/* ── Placar por status ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ORDEM_STATUS.map(s => (
            <CardStatus
              key={s}
              icone={STATUS[s].icone}
              label={STATUS[s].curto}
              valor={totais[s]}
              borda={STATUS[s].borda}
              ativo={filtroStatus === s}
              onClick={() => setFiltroStatus(filtroStatus === s ? 'todos' : s)}
            />
          ))}
        </div>

        {/* ── Filtros ── */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar município..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent"
            />
            {busca && (
              <button onClick={() => setBusca('')}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroStatus === 'todos'
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {STATUS_FILTRO_FILA.map(s => (
              <button
                key={s}
                onClick={() => setFiltroStatus(filtroStatus === s ? 'todos' : s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filtroStatus === s
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {STATUS[s].curto}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-auto">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filtroRegiao}
                onChange={e => setFiltroRegiao(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white text-gray-600"
              >
                {REGIOES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400">{filaFiltrada.length} cidade(s) na fila</p>
        </div>

        {/* ── Fila ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filaFiltrada.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhuma cidade na fila com os filtros atuais. A fila lista cidades com
                compromisso marcado que ainda não foram fechadas.
              </div>
            ) : (
              filaFiltrada.map(item => (
                <LinhaFila key={item.municipio.id} item={item} onClick={() => setSelecionado(item)} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modal central da cidade ── */}
      {selecionado && (
        <ModalCidade item={selecionado} onFechar={fecharModal} onConcluir={aoConcluir} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function CardStatus({
  icone, label, valor, borda, ativo, onClick,
}: {
  icone: React.ReactNode
  label: string
  valor: number
  borda: string
  ativo: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl p-4 shadow-sm bg-white border-l-4 ${borda} transition-all ${
        ativo ? 'ring-2 ring-[#1e3a5f]/30' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icone}
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide leading-tight">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-[#1e3a5f]">{valor}</p>
    </button>
  )
}

function LinhaFila({ item, onClick }: { item: ItemFila; onClick: () => void }) {
  const { municipio: m, compromisso, vencido } = item
  const cfg = STATUS[chaveStatus(m)]
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{m.nome}</p>
        <p className="text-xs text-gray-400 truncate">
          {m.regiao} · {formatHab(m.populacao)} hab.
        </p>
      </div>

      {compromisso && (
        <div className="hidden sm:flex flex-col items-end text-right shrink-0 mr-1">
          <span className="text-xs font-medium text-gray-600 truncate max-w-[180px]">
            {compromisso.tipo === 'reuniao' ? 'Reunião' : 'Visita'} · {compromisso.titulo}
          </span>
          <span className="text-xs text-gray-400">{fmtDataHora(compromisso.data_inicio)}</span>
        </div>
      )}

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
          {cfg.label}
        </span>
        {vencido && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" /> vencido — reagendar
          </span>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Modal central com as ações da cidade
// ---------------------------------------------------------------------------
type Modo = 'menu' | 'remarcar' | 'cancelar' | 'naoquer'

function ModalCidade({
  item, onFechar, onConcluir,
}: {
  item: ItemFila
  onFechar: () => void
  onConcluir: () => void
}) {
  const { municipio: m, compromisso } = item
  const atual = chaveStatus(m)
  const cfg = STATUS[atual]
  const proximoAlvo = PROXIMO_ESTAGIO[atual]

  const [modo, setModo] = useState<Modo>('menu')
  const [dataInicio, setDataInicio] = useState(
    compromisso ? toLocalInput(compromisso.data_inicio) : ''
  )
  const [dataFim, setDataFim] = useState(
    compromisso?.data_fim ? toLocalInput(compromisso.data_fim) : ''
  )
  const [motivoCancel, setMotivoCancel] = useState('')
  const [motivoNaoQuer, setMotivoNaoQuer] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function chamar(url: string, body: Record<string, unknown>): Promise<void> {
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(json?.error ?? 'Não foi possível concluir a operação.')
        return
      }
      onConcluir()
    } catch {
      setErro('Falha de rede. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // Ações de funil (reusam /api/municipios/atualizar) — nunca escrevem nao_visitada.
  // `acao` sinaliza o verbo de audit (o relatório 3.5 separa por ele).
  const avancar = () => proximoAlvo && chamar('/api/municipios/atualizar', {
    id: m.id, status_atendimento: proximoAlvo, acao: 'funil_avancar',
  })
  const finalizou = () => chamar('/api/municipios/atualizar', {
    id: m.id, status_atendimento: 'fechado', acao: 'funil_fechar',
  })
  const naoQuer = () => chamar('/api/municipios/atualizar', {
    id: m.id,
    status_atendimento: 'nao_participa',
    acao: 'funil_nao_participa',
    ...(motivoNaoQuer.trim() ? { motivo: motivoNaoQuer.trim() } : {}),
  })

  // Ações de agenda (reusam /api/agenda/atualizar).
  const remarcar = () => compromisso && chamar('/api/agenda/atualizar', {
    acao: 'remarcar', id: compromisso.id, data_inicio: dataInicio, data_fim: dataFim || null,
  })
  const cancelar = () => compromisso && chamar('/api/agenda/atualizar', {
    acao: 'cancelar', id: compromisso.id, motivo: motivoCancel.trim(),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Cabeçalho */}
        <div className="bg-[#1e3a5f] px-5 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide font-medium">{m.regiao}</p>
            <h2 className="text-white font-bold text-lg leading-tight">{m.nome}</h2>
            <p className="text-xs text-blue-200 mt-0.5">{formatHab(m.populacao)} habitantes</p>
          </div>
          <button onClick={onFechar} className="text-blue-300 hover:text-white transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Estágio atual */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Estágio no funil</span>
            <span className={`text-sm px-2 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>

          {m.distancia_capital_km != null && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Route className="w-4 h-4 text-gray-400" />
              <span>{m.distancia_capital_km} km da capital</span>
            </div>
          )}

          {/* Compromisso */}
          {compromisso ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <CalendarDays className="w-4 h-4 text-[#2d5986]" />
                {compromisso.tipo === 'reuniao' ? 'Reunião' : 'Visita'} · {compromisso.titulo}
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> {fmtDataHora(compromisso.data_inicio)}
                {item.vencido && <span className="text-red-600 font-medium">· vencido</span>}
              </p>
              {compromisso.responsavel && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-gray-400" /> {compromisso.responsavel}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sem compromisso registrado.</p>
          )}

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" /> {erro}
            </div>
          )}

          {/* ── MENU de ações ── */}
          {modo === 'menu' && (
            <div className="space-y-2">
              {compromisso && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setModo('remarcar')}
                    disabled={salvando}
                    className="flex items-center justify-center gap-2 text-sm border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    <CalendarDays className="w-4 h-4" /> Remarcar
                  </button>
                  <button
                    onClick={() => setModo('cancelar')}
                    disabled={salvando}
                    className="flex items-center justify-center gap-2 text-sm border border-red-200 text-red-600 py-2.5 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors">
                    <X className="w-4 h-4" /> Cancelar reunião
                  </button>
                </div>
              )}

              {proximoAlvo && (
                <button
                  onClick={avancar}
                  disabled={salvando}
                  className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2d5986] disabled:opacity-40 transition-colors">
                  {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Avançar para {STATUS[proximoAlvo].label}
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={finalizou}
                  disabled={salvando}
                  className="flex items-center justify-center gap-2 text-sm bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                  <CheckCircle2 className="w-4 h-4" /> Finalizou
                </button>
                <button
                  onClick={() => setModo('naoquer')}
                  disabled={salvando}
                  className="flex items-center justify-center gap-2 text-sm border border-red-200 text-red-600 py-2.5 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors">
                  <Ban className="w-4 h-4" /> Não quer
                </button>
              </div>
            </div>
          )}

          {/* ── Remarcar ── */}
          {modo === 'remarcar' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Novo início *</label>
                  <input
                    type="datetime-local"
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fim</label>
                  <input
                    type="datetime-local"
                    value={dataFim}
                    onChange={e => setDataFim(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
              </div>
              <AcoesConfirmar
                onVoltar={() => setModo('menu')}
                onConfirmar={remarcar}
                salvando={salvando}
                desabilitado={!dataInicio}
                rotulo="Salvar nova data"
              />
            </div>
          )}

          {/* ── Cancelar (motivo obrigatório) ── */}
          {modo === 'cancelar' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo do cancelamento *</label>
                <textarea
                  value={motivoCancel}
                  onChange={e => setMotivoCancel(e.target.value)}
                  rows={3}
                  placeholder="Por que a reunião foi desmarcada?"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">A cidade permanece no estágio atual; só o evento é cancelado.</p>
              </div>
              <AcoesConfirmar
                onVoltar={() => setModo('menu')}
                onConfirmar={cancelar}
                salvando={salvando}
                desabilitado={!motivoCancel.trim()}
                rotulo="Confirmar cancelamento"
                perigo
              />
            </div>
          )}

          {/* ── Não quer (motivo opcional) ── */}
          {modo === 'naoquer' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
                <textarea
                  value={motivoNaoQuer}
                  onChange={e => setMotivoNaoQuer(e.target.value)}
                  rows={3}
                  placeholder="Registro opcional do porquê a prefeitura recusou."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                />
              </div>
              <AcoesConfirmar
                onVoltar={() => setModo('menu')}
                onConfirmar={naoQuer}
                salvando={salvando}
                desabilitado={false}
                rotulo="Marcar como não participa"
                perigo
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AcoesConfirmar({
  onVoltar, onConfirmar, salvando, desabilitado, rotulo, perigo,
}: {
  onVoltar: () => void
  onConfirmar: () => void
  salvando: boolean
  desabilitado: boolean
  rotulo: string
  perigo?: boolean
}) {
  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={onVoltar}
        disabled={salvando}
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-40 transition-colors">
        Voltar
      </button>
      <button
        onClick={onConfirmar}
        disabled={salvando || desabilitado}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
          perigo ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1e3a5f] hover:bg-[#2d5986]'
        }`}>
        {salvando && <RefreshCw className="w-4 h-4 animate-spin" />}
        {rotulo}
      </button>
    </div>
  )
}

// Converte um ISO em valor aceito por <input type="datetime-local"> (local, sem TZ).
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
