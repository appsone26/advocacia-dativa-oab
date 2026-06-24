'use client'

import { useState } from 'react'
import {
  Users, UserPlus, CheckCircle, XCircle, Shield,
  MapPin, Mail, Hash, X, ChevronDown, ToggleLeft,
  ToggleRight, AlertCircle, Loader2, Search
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Usuario {
  id: string
  nome: string
  email: string
  nivel: string
  cargo: string | null
  oab_numero: string | null
  municipio_id: string | null
  municipio_nome?: string
  primeiro_acesso: boolean
  ativo: boolean
  criado_em: string
  regioes?: string[]
  permissoes?: string[]
  liberar_tudo?: boolean
}

interface Municipio {
  id: string
  nome: string
  regiao: string
}

interface UsuariosDashboardProps {
  membrosComissao: Usuario[]
  gestores: Usuario[]
  advogados: Usuario[]
  municipios: Municipio[]
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const REGIOES = [
  'Costa Verde', 'Noroeste', 'Lagos', 'Centro-Sul',
  'Sul Fluminense', 'Baixada Fluminense', 'Metropolitana',
  'Serrana', 'Norte Fluminense'
]

const PERMISSOES_LABELS: Record<string, string> = {
  cadastrar_gestor:    'Cadastrar gestor',
  ver_relatorios:      'Ver relatórios',
  exportar_relatorios: 'Exportar relatórios',
  mensagens_em_massa:  'Mensagens em massa',
  ver_agenda:          'Ver agenda',
  editar_agenda:       'Editar agenda',
}

type Aba = 'comissao' | 'gestores' | 'advogados'

// ─── Componente principal ─────────────────────────────────────────────────────

export default function UsuariosDashboard({
  membrosComissao: membrosInicial,
  gestores: gestoresInicial,
  advogados: advogadosInicial,
  municipios,
}: UsuariosDashboardProps) {
  const [aba, setAba] = useState<Aba>('comissao')
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msgSucesso, setMsgSucesso] = useState('')
  const [msgErro, setMsgErro] = useState('')

  // Listas locais (atualizadas sem reload)
  const [membros, setMembros] = useState(membrosInicial)
  const [gestores, setGestores] = useState(gestoresInicial)
  const [advogados, setAdvogados] = useState(advogadosInicial)

  // Form de cadastro
  const [form, setForm] = useState({
    nome: '',
    email: '',
    nivel: aba === 'comissao' ? 'comissao' : aba === 'gestores' ? 'gestor' : 'advogado',
    cargo: '',
    oab_numero: '',
    municipio_id: '',
    regioes: [] as string[],
    permissoes: [] as string[],
    liberar_tudo: false,
  })

  function abrirModal() {
    setForm({
      nome: '', email: '',
      nivel: aba === 'comissao' ? 'comissao' : aba === 'gestores' ? 'gestor' : 'advogado',
      cargo: '', oab_numero: '', municipio_id: '',
      regioes: [], permissoes: [], liberar_tudo: false,
    })
    setMsgErro('')
    setModalAberto(true)
  }

  function toggleRegiao(r: string) {
    setForm(p => ({
      ...p,
      regioes: p.regioes.includes(r)
        ? p.regioes.filter(x => x !== r)
        : [...p.regioes, r]
    }))
  }

  function toggleTodasRegioes() {
    setForm(p => ({
      ...p,
      regioes: p.regioes.length === REGIOES.length ? [] : [...REGIOES]
    }))
  }

  function toggleTodasPermissoes() {
    const todas = Object.keys(PERMISSOES_LABELS)
    setForm(p => ({
      ...p,
      permissoes: p.permissoes.length === todas.length ? [] : [...todas],
      liberar_tudo: p.permissoes.length !== todas.length,
    }))
  }

  function togglePermissao(k: string) {
    setForm(p => {
      const novasPermissoes = p.permissoes.includes(k)
        ? p.permissoes.filter(x => x !== k)
        : [...p.permissoes, k]
      const todas = Object.keys(PERMISSOES_LABELS)
      return {
        ...p,
        permissoes: novasPermissoes,
        liberar_tudo: novasPermissoes.length === todas.length,
      }
    })
  }

  async function salvar() {
    if (!form.nome || !form.email) {
      setMsgErro('Nome e email são obrigatórios.')
      return
    }
    if (form.nivel === 'comissao') {
      if (form.regioes.length === 0) {
        setMsgErro('Selecione pelo menos uma região de atuação.')
        return
      }
      if (form.permissoes.length === 0) {
        setMsgErro('Selecione pelo menos uma permissão.')
        return
      }
    }
    if (form.nivel === 'gestor' && !form.municipio_id) {
      setMsgErro('Selecione o município do gestor.')
      return
    }
    setSalvando(true)
    setMsgErro('')
    try {
      const res = await fetch('/api/usuarios/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsgErro(data.error ?? 'Erro ao cadastrar usuário.')
        return
      }
      // Adiciona à lista local
      const novoUsuario: Usuario = {
        id: data.id,
        nome: form.nome,
        email: form.email,
        nivel: form.nivel,
        cargo: form.cargo || null,
        oab_numero: form.oab_numero || null,
        municipio_id: form.municipio_id || null,
        municipio_nome: municipios.find(m => m.id === form.municipio_id)?.nome,
        primeiro_acesso: true,
        ativo: true,
        criado_em: new Date().toISOString(),
        regioes: form.regioes,
        permissoes: form.permissoes,
        liberar_tudo: form.liberar_tudo,
      }
      if (aba === 'comissao') setMembros(p => [novoUsuario, ...p])
      if (aba === 'gestores') setGestores(p => [novoUsuario, ...p])
      if (aba === 'advogados') setAdvogados(p => [novoUsuario, ...p])

      setModalAberto(false)
      setMsgSucesso(`${form.nome} cadastrado(a) com sucesso! Email de boas-vindas enviado.`)
      setTimeout(() => setMsgSucesso(''), 4000)
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(u: Usuario) {
    const novoAtivo = !u.ativo
    await fetch('/api/usuarios/criar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, ativo: novoAtivo }),
    })
    const atualizar = (lista: Usuario[]) =>
      lista.map(x => x.id === u.id ? { ...x, ativo: novoAtivo } : x)
    if (aba === 'comissao') setMembros(atualizar)
    if (aba === 'gestores') setGestores(atualizar)
    if (aba === 'advogados') setAdvogados(atualizar)
  }

  // Lista atual filtrada por busca
  const listaAtual = (
    aba === 'comissao' ? membros :
    aba === 'gestores' ? gestores : advogados
  ).filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  )

  const totalAtivos = listaAtual.filter(u => u.ativo).length

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full overflow-x-hidden">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Gestão de Usuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cadastro e controle de acesso ao sistema
          </p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#2d5986] transition-colors">
          <UserPlus size={16} />
          Cadastrar {aba === 'comissao' ? 'membro' : aba === 'gestores' ? 'gestor' : 'advogado'}
        </button>
      </div>

      {/* Feedback */}
      {msgSucesso && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle size={16} /> {msgSucesso}
        </div>
      )}

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'comissao', label: 'Comissão', total: membros.length, ativos: membros.filter(u => u.ativo).length },
          { key: 'gestores', label: 'Gestores', total: gestores.length, ativos: gestores.filter(u => u.ativo).length },
          { key: 'advogados', label: 'Advogados', total: advogados.length, ativos: advogados.filter(u => u.ativo).length },
        ].map(({ key, label, total, ativos }) => (
          <button
            key={key}
            onClick={() => setAba(key as Aba)}
            className={`rounded-xl border p-3 md:p-4 text-left transition-all
              ${aba === key
                ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
            <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-tight md:tracking-wide mb-1 truncate">{label}</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">{total}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{ativos} ativo{ativos !== 1 ? 's' : ''}</p>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar em ${aba === 'comissao' ? 'Comissão' : aba === 'gestores' ? 'Gestores' : 'Advogados'}...`}
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] bg-white"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#1e3a5f] text-sm">
            {aba === 'comissao' ? 'Membros da Comissão' : aba === 'gestores' ? 'Gestores Municipais' : 'Advogados'}
            <span className="ml-2 text-gray-400 font-normal">({listaAtual.length})</span>
          </h2>
          <span className="text-xs text-gray-400">{totalAtivos} ativo{totalAtivos !== 1 ? 's' : ''}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left whitespace-nowrap">Nome</th>
                <th className="px-4 py-2 text-left whitespace-nowrap">Email</th>
                {aba === 'comissao' && <th className="px-4 py-2 text-left whitespace-nowrap">Regiões</th>}
                {aba === 'comissao' && <th className="px-4 py-2 text-left whitespace-nowrap">Acesso</th>}
                {aba !== 'comissao' && <th className="px-4 py-2 text-left whitespace-nowrap">Município</th>}
                {aba === 'advogados' && <th className="px-4 py-2 text-left whitespace-nowrap">OAB</th>}
                <th className="px-4 py-2 text-left whitespace-nowrap">1º acesso</th>
                <th className="px-4 py-2 text-left whitespace-nowrap">Status</th>
                <th className="px-4 py-2 text-left whitespace-nowrap">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listaAtual.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.ativo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-800">{u.nome}</p>
                    {u.cargo && <p className="text-xs text-gray-400">{u.cargo}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.email}</td>

                  {aba === 'comissao' && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.regioes ?? []).slice(0, 2).map(r => (
                          <span key={r} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{r}</span>
                        ))}
                        {(u.regioes ?? []).length > 2 && (
                          <span className="text-xs text-gray-400">+{(u.regioes ?? []).length - 2}</span>
                        )}
                      </div>
                    </td>
                  )}

                  {aba === 'comissao' && (
                    <td className="px-4 py-3">
                      {u.liberar_tudo
                        ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Shield size={10} /> Completo</span>
                        : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{(u.permissoes ?? []).length} permissões</span>
                      }
                    </td>
                  )}

                  {aba !== 'comissao' && (
                    <td className="px-4 py-3 text-gray-500">
                      {u.municipio_nome ?? <span className="text-gray-300">—</span>}
                    </td>
                  )}

                  {aba === 'advogados' && (
                    <td className="px-4 py-3 text-gray-500">
                      {u.oab_numero ?? <span className="text-gray-300">—</span>}
                    </td>
                  )}

                  <td className="px-4 py-3">
                    {u.primeiro_acesso
                      ? <span className="text-xs text-amber-500 flex items-center gap-1"><AlertCircle size={11} /> Pendente</span>
                      : <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={11} /> Feito</span>
                    }
                  </td>

                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${u.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAtivo(u)}
                      title={u.ativo ? 'Desativar' : 'Reativar'}
                      className="text-gray-400 hover:text-[#1e3a5f] transition-colors">
                      {u.ativo ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {listaAtual.length === 0 && (
            <div className="py-12 text-center">
              <Users size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">
                {busca ? 'Nenhum resultado encontrado.' : 'Nenhum usuário cadastrado ainda.'}
              </p>
              {!busca && (
                <button onClick={abrirModal} className="mt-2 text-sm text-[#2d5986] hover:underline">
                  Cadastrar o primeiro
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-[#1e3a5f]">
                Cadastrar {form.nivel === 'comissao' ? 'membro da Comissão' : form.nivel === 'gestor' ? 'Gestor Municipal' : 'Advogado'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Erro */}
              {msgErro && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
                  <XCircle size={15} /> {msgErro}
                </div>
              )}

              {/* Tipo de usuário (só se não estiver em aba específica) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de usuário</label>
                <div className="flex gap-2">
                  {[
                    { value: 'comissao', label: 'Comissão' },
                    { value: 'gestor',   label: 'Gestor' },
                    { value: 'advogado', label: 'Advogado' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setForm(p => ({ ...p, nivel: value }))}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors
                        ${form.nivel === value
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Dr. João da Silva"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))}
                  placeholder={
                    form.nivel === 'comissao' ? 'Ex: Vice-presidente' :
                    form.nivel === 'gestor' ? 'Ex: Gestor Municipal' :
                    'Ex: Advogado Criminalista'
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>

              {/* OAB (comissão e advogado) */}
              {(form.nivel === 'comissao' || form.nivel === 'advogado') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Número OAB</label>
                  <input
                    type="text"
                    value={form.oab_numero}
                    onChange={e => setForm(p => ({ ...p, oab_numero: e.target.value }))}
                    placeholder="Ex: 123456"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
              )}

              {/* Município (gestor e advogado) */}
              {(form.nivel === 'gestor' || form.nivel === 'advogado') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Município {form.nivel === 'gestor' ? '*' : ''}
                  </label>
                  <select
                    value={form.municipio_id}
                    onChange={e => setForm(p => ({ ...p, municipio_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]">
                    <option value="">Selecione o município...</option>
                    {municipios.map(m => (
                      <option key={m.id} value={m.id}>{m.nome} — {m.regiao}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Regiões (comissão) */}
              {form.nivel === 'comissao' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-600">Regiões de atuação</label>
                    <button
                      onClick={toggleTodasRegioes}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors
                        ${form.regioes.length === REGIOES.length
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f] font-medium'
                          : 'border-gray-200 text-gray-500'
                        }`}>
                      <MapPin size={11} />
                      Todas as regiões
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {REGIOES.map(r => (
                      <button
                        key={r}
                        onClick={() => toggleRegiao(r)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                          ${form.regioes.includes(r)
                            ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f] font-medium'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissões (comissão) */}
              {form.nivel === 'comissao' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Permissões</label>
                    <button
                      onClick={toggleTodasPermissoes}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors
                        ${form.liberar_tudo
                          ? 'border-amber-300 bg-amber-50 text-amber-700 font-medium'
                          : 'border-gray-200 text-gray-500'
                        }`}>
                      <Shield size={11} />
                      Marcar todas
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(PERMISSOES_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.permissoes.includes(key)}
                          onChange={() => togglePermissao(key)}
                          className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]/20"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#1e3a5f]">{label}</span>
                      </label>
                    ))}
                  </div>
                  {form.liberar_tudo && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-2">
                      Este membro terá acesso completo a todas as funcionalidades da Comissão.
                    </p>
                  )}
                </div>
              )}

              {/* Info senha */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
                <Mail size={12} className="inline mr-1" />
                Um email de boas-vindas com a senha <strong>Dativa@2026</strong> será enviado automaticamente.
              </div>

            </div>

            {/* Footer modal */}
            <div className="px-5 pb-5 flex gap-2 justify-end sticky bottom-0 bg-white border-t border-gray-100 pt-4">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={
                  salvando || !form.nome || !form.email ||
                  (form.nivel === 'comissao' && (form.regioes.length === 0 || form.permissoes.length === 0)) ||
                  (form.nivel === 'gestor' && !form.municipio_id)
                }
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5986] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {salvando ? <><Loader2 size={14} className="animate-spin" /> Cadastrando...</> : 'Cadastrar e enviar email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
