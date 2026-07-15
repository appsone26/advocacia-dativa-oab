'use client'
// src/components/dashboard/OwnerDashboard.tsx
// Visão Geral (fase Defensoria) — placar por status de atendimento das 92 cidades.

import { useState, useMemo } from 'react'
import {
  Users, AlertTriangle, CheckCircle2, Search, ChevronRight, X,
  Clock, Filter, RefreshCw, TrendingDown, Globe, MapPin,
  CalendarDays, ShieldCheck, Route,
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

interface Props {
  municipios: Municipio[]
}

// ---------------------------------------------------------------------------
// População de apoio (IBGE 2022) — usada só como fallback visual enquanto a
// coluna `populacao` do banco não estiver preenchida. Não substitui o banco.
// ---------------------------------------------------------------------------
const POP_FALLBACK: Record<string, number> = {
  'Angra dos Reis': 213027, 'Aperibé': 11025, 'Araruama': 135640, 'Areal': 12024,
  'Armação dos Búzios': 34509, 'Arraial do Cabo': 32017, 'Barra do Piraí': 100488,
  'Barra Mansa': 182017, 'Belford Roxo': 523406, 'Bom Jardim': 24987,
  'Bom Jesus do Itabapoana': 35124, 'Cabo Frio': 230528, 'Cachoeiras de Macacu': 59128,
  'Cambuci': 14891, 'Campos dos Goytacazes': 511110, 'Cantagalo': 20112,
  'Cardoso Moreira': 12440, 'Carmo': 17645, 'Casimiro de Abreu': 47011,
  'Comendador Levy Gasparian': 8432, 'Conceição de Macabu': 22013, 'Cordeiro': 22217,
  'Duas Barras': 11240, 'Duque de Caxias': 924624, 'Engenheiro Paulo de Frontin': 14012,
  'Guapimirim': 70219, 'Iguaba Grande': 25403, 'Itaboraí': 246141, 'Itaguaí': 130456,
  'Italva': 14302, 'Itaocara': 23218, 'Itaperuna': 106019, 'Itatiaia': 36308,
  'Japeri': 105776, 'Laje do Muriaé': 7941, 'Macaé': 262577, 'Macuco': 5474,
  'Magé': 240547, 'Mangaratiba': 47300, 'Maricá': 178277, 'Mendes': 17981,
  'Mesquita': 174025, 'Miguel Pereira': 25009, 'Miracema': 27011, 'Natividade': 15214,
  'Nilópolis': 157483, 'Niterói': 515317, 'Nova Friburgo': 185752, 'Nova Iguaçu': 820245,
  'Paracambi': 51447, 'Paraíba do Sul': 42014, 'Paraty': 43027, 'Paty do Alferes': 28219,
  'Petrópolis': 295917, 'Pinheiral': 24118, 'Piraí': 30107, 'Porciúncula': 17511,
  'Porto Real': 21447, 'Quatis': 13519, 'Queimados': 145107, 'Quissamã': 23016,
  'Resende': 131408, 'Rio Bonito': 57014, 'Rio Claro': 17841, 'Rio das Flores': 9016,
  'Rio das Ostras': 147077, 'Rio de Janeiro': 6748000, 'Santa Maria Madalena': 10119,
  'Santo Antônio de Pádua': 40514, 'São Fidélis': 36811, 'São Francisco de Itabapoana': 41014,
  'São Gonçalo': 1084839, 'São João da Barra': 37219, 'São João de Meriti': 471038,
  'São José de Ubá': 7514, 'São José do Vale do Rio Preto': 21812, 'São Pedro da Aldeia': 104219,
  'São Sebastião do Alto': 9011, 'Sapucaia': 17219, 'Saquarema': 101718, 'Seropédica': 89007,
  'Silva Jardim': 22019, 'Sumidouro': 15319, 'Tanguá': 33519, 'Teresópolis': 178210,
  'Trajano de Moraes': 10819, 'Três Rios': 77912, 'Valença': 74512, 'Varre-Sai': 9912,
  'Vassouras': 35714, 'Volta Redonda': 272029,
}

function popDe(m: Municipio): number | null {
  return m.populacao ?? POP_FALLBACK[m.nome] ?? null
}

function formatPopulacao(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return n.toString()
}

// ---------------------------------------------------------------------------
// Status de atendimento — a espinha dorsal da fase Defensoria
// ---------------------------------------------------------------------------
type StatusChave = 'nao_visitada' | 'marcada' | 'realizada' | 'negociacao' | 'fechado'

const ORDEM_STATUS: StatusChave[] = ['nao_visitada', 'marcada', 'realizada', 'negociacao', 'fechado']

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
  realizada: {
    label: 'Reunião realizada', curto: 'Realizadas',
    color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', borda: 'border-indigo-400',
    icone: <CheckCircle2 className="w-5 h-5 text-indigo-600" />,
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
}

function chaveStatus(m: Municipio): StatusChave {
  const s = (m.status_atendimento ?? 'nao_visitada') as StatusChave
  return ORDEM_STATUS.includes(s) ? s : 'nao_visitada'
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
export default function OwnerDashboard({ municipios }: Props) {
  // Cópia local para o placar/lista atualizarem na hora ao salvar (sem reload)
  const [lista, setLista] = useState<Municipio[]>(municipios)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusChave>('todos')
  const [filtroRegiao, setFiltroRegiao] = useState('Todas as regiões')
  const [selecionado, setSelecionado] = useState<Municipio | null>(null)
  const [novoStatus, setNovoStatus] = useState<StatusChave>('nao_visitada')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  // ── Contadores por status ──
  const totais = useMemo(() => {
    const acc: Record<StatusChave, number> = {
      nao_visitada: 0, marcada: 0, realizada: 0, negociacao: 0, fechado: 0,
    }
    for (const m of lista) acc[chaveStatus(m)]++
    return acc
  }, [lista])

  const iniciadas = TOTAL - totais.nao_visitada
  const progresso = Math.round((iniciadas / TOTAL) * 100)

  // ── Lista filtrada ──
  const filtrados = useMemo(() => {
    return lista.filter(m => {
      const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase())
      const matchStatus = filtroStatus === 'todos' || chaveStatus(m) === filtroStatus
      const matchRegiao = filtroRegiao === 'Todas as regiões' || m.regiao === filtroRegiao
      return matchBusca && matchStatus && matchRegiao
    })
  }, [lista, busca, filtroStatus, filtroRegiao])

  // ── Prioritárias: maiores cidades ainda não visitadas ──
  const prioritarias = useMemo(() => {
    return lista
      .filter(m => chaveStatus(m) === 'nao_visitada')
      .sort((a, b) => (popDe(b) ?? 0) - (popDe(a) ?? 0))
      .slice(0, 5)
  }, [lista])

  function abrir(m: Municipio) {
    setSelecionado(m)
    setNovoStatus(chaveStatus(m))
    setMensagem(null)
  }

  async function salvar() {
    if (!selecionado) return
    setSalvando(true)
    setMensagem(null)
    try {
      const res = await fetch('/api/municipios/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selecionado.id, status_atendimento: novoStatus }),
      })
      const data = await res.json().catch(() => ({} as { error?: string }))
      if (!res.ok) throw new Error(data?.error || `Falha (HTTP ${res.status})`)

      // Atualiza a cópia local → placar, lista e ranking mudam na hora
      setLista(prev => prev.map(m =>
        m.id === selecionado.id ? { ...m, status_atendimento: novoStatus } : m
      ))
      setSelecionado(prev => (prev ? { ...prev, status_atendimento: novoStatus } : prev))
      setMensagem({ tipo: 'ok', texto: 'Status atualizado com sucesso.' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar. Tente novamente.'
      setMensagem({ tipo: 'erro', texto: msg })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Cabeçalho ── */}
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Visão Geral — Estado do Rio de Janeiro</h1>
          <p className="text-sm text-gray-500 mt-1">
            Situação do atendimento nos 92 municípios · OAB-RJ e Defensoria Pública
          </p>
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

        {/* ── Barra de progresso ── */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1e3a5f] flex items-center gap-2">
              <Globe className="w-4 h-4" /> Cidades com atendimento iniciado
            </span>
            <span className="text-sm font-bold text-[#1e3a5f]">{progresso}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-[#2d5986] to-[#1e3a5f] transition-all duration-700"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{iniciadas} iniciadas · {totais.fechado} fechadas</span>
            <span>{totais.nao_visitada} ainda não visitadas</span>
          </div>
        </div>

        {/* ── Corpo: Lista + coluna direita ── */}
        <div className="flex gap-6 items-start">

          {/* ── Lista de municípios ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Filtros */}
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
                {ORDEM_STATUS.map(s => (
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
              <p className="text-xs text-gray-400">{filtrados.length} de {TOTAL} municípios</p>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50 overflow-y-auto max-h-[calc(100vh-320px)]">
                {filtrados.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    Nenhum município encontrado com os filtros selecionados.
                  </div>
                ) : (
                  filtrados.map(m => {
                    const cfg = STATUS[chaveStatus(m)]
                    const pop = popDe(m)
                    const sel = selecionado?.id === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => abrir(m)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                          sel ? 'bg-blue-50 border-r-2 border-[#1e3a5f]' : ''
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{m.nome}</p>
                          <p className="text-xs text-gray-400 truncate">{m.regiao}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {pop && (
                            <span className="text-xs text-gray-400 hidden sm:block">
                              {formatPopulacao(pop)} hab.
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Coluna direita ── */}
          <div className="w-80 shrink-0 hidden lg:block space-y-4">
            {selecionado ? (
              <PainelCidade
                municipio={selecionado}
                novoStatus={novoStatus}
                setNovoStatus={setNovoStatus}
                salvando={salvando}
                mensagem={mensagem}
                onSalvar={salvar}
                onFechar={() => setSelecionado(null)}
              />
            ) : (
              <Prioritarias municipios={prioritarias} onSelecionar={abrir} />
            )}
          </div>
        </div>

        {/* ── Painel em mobile ── */}
        {selecionado && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <PainelCidade
              municipio={selecionado}
              novoStatus={novoStatus}
              setNovoStatus={setNovoStatus}
              salvando={salvando}
              mensagem={mensagem}
              onSalvar={salvar}
              onFechar={() => setSelecionado(null)}
            />
          </div>
        )}
      </div>
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

function Prioritarias({
  municipios, onSelecionar,
}: {
  municipios: Municipio[]
  onSelecionar: (m: Municipio) => void
}) {
  if (municipios.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">Todas as cidades já foram visitadas!</p>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-[#1e3a5f]" />
        <span className="text-sm font-semibold text-gray-700">Prioritárias a visitar</span>
      </div>
      <div className="divide-y divide-gray-50">
        {municipios.map((m, i) => {
          const pop = popDe(m)
          return (
            <button
              key={m.id}
              onClick={() => onSelecionar(m)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
            >
              <span className="text-xs font-bold text-[#1e3a5f] w-5 shrink-0">{i + 1}º</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{m.nome}</p>
                <p className="text-xs text-gray-400">{pop ? formatPopulacao(pop) + ' hab.' : m.regiao}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          )
        })}
      </div>
      <div className="px-4 py-2 bg-gray-50">
        <p className="text-xs text-gray-500">Maiores cidades ainda não visitadas</p>
      </div>
    </div>
  )
}

function PainelCidade({
  municipio, novoStatus, setNovoStatus, salvando, mensagem, onSalvar, onFechar,
}: {
  municipio: Municipio
  novoStatus: StatusChave
  setNovoStatus: (v: StatusChave) => void
  salvando: boolean
  mensagem: { tipo: 'ok' | 'erro'; texto: string } | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const atual = chaveStatus(municipio)
  const cfg = STATUS[atual]
  const pop = popDe(municipio)
  const alterado = novoStatus !== atual

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-[#1e3a5f] px-4 py-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-blue-300 uppercase tracking-wide font-medium">{municipio.regiao}</p>
          <h2 className="text-white font-bold text-lg leading-tight">{municipio.nome}</h2>
        </div>
        <button onClick={onFechar} className="text-blue-300 hover:text-white transition-colors mt-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Info */}
        {pop && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{pop.toLocaleString('pt-BR')} habitantes</span>
          </div>
        )}
        {municipio.distancia_capital_km != null && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Route className="w-4 h-4 text-gray-400" />
            <span>{municipio.distancia_capital_km} km da capital</span>
          </div>
        )}

        {/* Status atual */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Status de atendimento</p>
          <span className={`text-sm px-2 py-1 rounded-full font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>

        <hr className="border-gray-100" />

        {/* Edição */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Atualizar status</p>
          <select
            value={novoStatus}
            onChange={e => setNovoStatus(e.target.value as StatusChave)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2d5986] bg-white"
          >
            {ORDEM_STATUS.map(s => (
              <option key={s} value={s}>{STATUS[s].label}</option>
            ))}
          </select>

          {mensagem && (
            <div className={`text-xs px-3 py-2 rounded-lg ${
              mensagem.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              {mensagem.texto}
            </div>
          )}

          <button
            onClick={onSalvar}
            disabled={!alterado || salvando}
            className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2d5986] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {salvando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
