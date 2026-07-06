'use client'
// src/app/cadastro/[municipio]/page.tsx
// Tijolo 6 — Auto-cadastro do Cliente via QR Code
// Rota pública — não precisa de autenticação
import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  User, Phone, MapPin, FileText, Lock,
  CheckCircle, ChevronRight, ChevronLeft,
  Shield, Scale, Home, Eye, EyeOff
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────
type Etapa = 1 | 2 | 3 | 4
type AreaJuridica = 'violencia' | 'alimentos' | 'outros'

type DadosPessoais = {
  nome: string
  cpf: string
  telefone: string
  email: string
  endereco: string
  bairro: string
}

type DadosCaso = {
  area: AreaJuridica | ''
  descricao: string
}

type DadosAcesso = {
  senha: string
  confirmarSenha: string
  lgpd1: boolean
  lgpd2: boolean
}

// ── Helpers ────────────────────────────────────────────────
function formatCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatTel(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

const areaOpcoes = [
  { value: 'violencia', label: 'Violência Doméstica',  icon: Shield, cor: '#ef4444', bg: '#fee2e2', desc: 'Agressão física, psicológica, medida protetiva' },
  { value: 'alimentos', label: 'Alimentos / Família',  icon: Scale,  cor: '#f59e0b', bg: '#fef3c7', desc: 'Pensão alimentícia, guarda, divórcio' },
  { value: 'outros',    label: 'Outras demandas',      icon: Home,   cor: '#6366f1', bg: '#ede9fe', desc: 'Questões imobiliárias, trabalhistas e outras' },
]

const nomesMunicipios: Record<string, string> = {
  'rio-de-janeiro': 'Rio de Janeiro',
  'niteroi': 'Niterói',
  'sao-goncalo': 'São Gonçalo',
  'duque-de-caxias': 'Duque de Caxias',
  'nova-iguacu': 'Nova Iguaçu',
  'campos': 'Campos dos Goytacazes',
  'petropolis': 'Petrópolis',
  'volta-redonda': 'Volta Redonda',
  'macae': 'Macaé',
  'itaguai': 'Itaguaí',
}

// ── Componente principal ───────────────────────────────────
export default function CadastroClientePage() {
  const params = useParams()
  const municipioSlug = (params?.municipio as string) ?? ''
  const municipioNome = nomesMunicipios[municipioSlug] ?? municipioSlug.replace(/-/g, ' ')

  const [etapa, setEtapa] = useState<Etapa>(1)
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erroSubmit, setErroSubmit] = useState('')
  const [protocolo, setProtocolo] = useState('')

  const [pessoais, setPessoais] = useState<DadosPessoais>({
    nome: '', cpf: '', telefone: '', email: '', endereco: '', bairro: ''
  })
  const [caso, setCaso] = useState<DadosCaso>({ area: '', descricao: '' })
  const [acesso, setAcesso] = useState<DadosAcesso>({
    senha: '', confirmarSenha: '', lgpd1: false, lgpd2: false
  })

  // Validações por etapa
  const etapa1Valida = pessoais.nome.trim().length >= 3 &&
    pessoais.cpf.replace(/\D/g, '').length === 11 &&
    pessoais.telefone.replace(/\D/g, '').length >= 10 &&
    /^\S+@\S+\.\S+$/.test(pessoais.email)

  const etapa2Valida = caso.area !== '' && caso.descricao.trim().length >= 20

  const etapa3Valida = acesso.senha.length >= 8 &&
    acesso.senha === acesso.confirmarSenha &&
    acesso.lgpd1 && acesso.lgpd2

  async function handleSubmit() {
    setCarregando(true)
    setErroSubmit('')
    try {
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipio: municipioSlug,
          nome: pessoais.nome,
          cpf: pessoais.cpf,
          telefone: pessoais.telefone,
          email: pessoais.email,
          endereco: pessoais.endereco,
          bairro: pessoais.bairro,
          area: caso.area,
          descricao: caso.descricao,
          senha: acesso.senha,
          lgpd: acesso.lgpd1 && acesso.lgpd2,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErroSubmit(json.error ?? 'Não foi possível concluir o cadastro. Tente novamente.')
        return
      }
      setProtocolo(json.protocolo ?? '')
      setEtapa(4)
    } catch {
      setErroSubmit('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header institucional ── */}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <div style={{ width: '40px', height: '40px', background: '#c9a227', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
          ⚖️
        </div>
        <div>
          <div style={{ color: '#c9a227', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>OAB-RJ · Comissão Estadual</div>
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>Advocacia Dativa</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ color: '#94b8d8', fontSize: '10px' }}>Município</div>
          <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{municipioNome || 'Não identificado'}</div>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {/* Título */}
          {etapa < 4 && (
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f' }}>
                Cadastro gratuito
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Acesso à assistência jurídica pela OAB-RJ
              </p>
            </div>
          )}

          {/* Indicador de progresso */}
          {etapa < 4 && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '4px' }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : 'none' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                    background: etapa > n ? '#10b981' : etapa === n ? '#1e3a5f' : '#e2e8f0',
                    color: etapa >= n ? '#fff' : '#94a3b8',
                    transition: 'all 0.3s'
                  }}>
                    {etapa > n ? '✓' : n}
                  </div>
                  {n < 3 && (
                    <div style={{ flex: 1, height: '2px', background: etapa > n ? '#10b981' : '#e2e8f0', transition: 'background 0.3s' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── ETAPA 1 — Dados pessoais ── */}
          {etapa === 1 && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a5f', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#c9a227" /> Seus dados pessoais
              </h2>

              <Campo label="Nome completo *">
                <input value={pessoais.nome} onChange={e => setPessoais(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Como consta no RG ou CPF" style={inputStyle} />
              </Campo>

              <Campo label="CPF *">
                <input value={pessoais.cpf}
                  onChange={e => setPessoais(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
                  placeholder="000.000.000-00" style={inputStyle} inputMode="numeric" />
              </Campo>

              <Campo label="Telefone / WhatsApp *">
                <input value={pessoais.telefone}
                  onChange={e => setPessoais(p => ({ ...p, telefone: formatTel(e.target.value) }))}
                  placeholder="(21) 99999-9999" style={inputStyle} inputMode="tel" />
              </Campo>

              <Campo label="E-mail *">
                <input value={pessoais.email} onChange={e => setPessoais(p => ({ ...p, email: e.target.value }))}
                  placeholder="seu@email.com" style={inputStyle} type="email" />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Usado para criar seu acesso e receber atualizações do caso.
                </div>
              </Campo>

              <Campo label="Endereço">
                <input value={pessoais.endereco} onChange={e => setPessoais(p => ({ ...p, endereco: e.target.value }))}
                  placeholder="Rua, número, complemento" style={inputStyle} />
              </Campo>

              <Campo label="Bairro">
                <input value={pessoais.bairro} onChange={e => setPessoais(p => ({ ...p, bairro: e.target.value }))}
                  placeholder="Nome do bairro" style={inputStyle} />
              </Campo>

              <BotaoAvancar onClick={() => setEtapa(2)} disabled={!etapa1Valida} />
            </div>
          )}

          {/* ── ETAPA 2 — Tipo de caso ── */}
          {etapa === 2 && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a5f', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#c9a227" /> Qual é o seu caso?
              </h2>

              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                Selecione a área que melhor descreve sua situação:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {areaOpcoes.map(op => {
                  const Icon = op.icon
                  const selecionado = caso.area === op.value
                  return (
                    <button key={op.value}
                      onClick={() => setCaso(c => ({ ...c, area: op.value as AreaJuridica }))}
                      style={{
                        padding: '14px', borderRadius: '12px', border: `2px solid ${selecionado ? op.cor : '#e2e8f0'}`,
                        background: selecionado ? op.bg : '#fff', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s'
                      }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: op.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} color={op.cor} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: selecionado ? op.cor : '#1e293b' }}>{op.label}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{op.desc}</div>
                      </div>
                      {selecionado && <CheckCircle size={18} color={op.cor} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>

              <Campo label="Descreva brevemente sua situação *">
                <textarea
                  value={caso.descricao}
                  onChange={e => setCaso(c => ({ ...c, descricao: e.target.value }))}
                  placeholder="Conte o que aconteceu e o que você precisa. Quanto mais detalhes, melhor o advogado poderá te ajudar. (mínimo 20 caracteres)"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <div style={{ fontSize: '11px', color: caso.descricao.length >= 20 ? '#10b981' : '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                  {caso.descricao.length} caracteres {caso.descricao.length >= 20 ? '✓' : '(mínimo 20)'}
                </div>
              </Campo>

              <div style={{ display: 'flex', gap: '10px' }}>
                <BotaoVoltar onClick={() => setEtapa(1)} />
                <BotaoAvancar onClick={() => setEtapa(3)} disabled={!etapa2Valida} />
              </div>
            </div>
          )}

          {/* ── ETAPA 3 — Senha + LGPD ── */}
          {etapa === 3 && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a5f', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="#c9a227" /> Crie sua senha de acesso
              </h2>

              <Campo label="Senha *">
                <div style={{ position: 'relative' }}>
                  <input
                    value={acesso.senha}
                    onChange={e => setAcesso(a => ({ ...a, senha: e.target.value }))}
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    style={{ ...inputStyle, paddingRight: '40px' }}
                  />
                  <button onClick={() => setMostrarSenha(v => !v)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}>
                    {mostrarSenha ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                  </button>
                </div>
                {acesso.senha.length > 0 && acesso.senha.length < 8 && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>Mínimo 8 caracteres</div>
                )}
              </Campo>

              <Campo label="Confirmar senha *">
                <input
                  value={acesso.confirmarSenha}
                  onChange={e => setAcesso(a => ({ ...a, confirmarSenha: e.target.value }))}
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  style={{ ...inputStyle, borderColor: acesso.confirmarSenha && acesso.senha !== acesso.confirmarSenha ? '#ef4444' : undefined }}
                />
                {acesso.confirmarSenha && acesso.senha !== acesso.confirmarSenha && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>As senhas não coincidem</div>
                )}
              </Campo>

              {/* LGPD */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>TERMOS E PRIVACIDADE (LGPD)</div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={acesso.lgpd1}
                    onChange={e => setAcesso(a => ({ ...a, lgpd1: e.target.checked }))}
                    style={{ marginTop: '2px', flexShrink: 0, width: '16px', height: '16px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>
                    Autorizo a OAB-RJ a tratar meus dados pessoais para fins de prestação de assistência jurídica gratuita, conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018). *
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={acesso.lgpd2}
                    onChange={e => setAcesso(a => ({ ...a, lgpd2: e.target.checked }))}
                    style={{ marginTop: '2px', flexShrink: 0, width: '16px', height: '16px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>
                    Declaro que as informações fornecidas são verdadeiras e que estou ciente de que o atendimento é gratuito e destinado a pessoas em situação de vulnerabilidade socioeconômica. *
                  </span>
                </label>
              </div>

              {erroSubmit && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '12px' }}>
                  {erroSubmit}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <BotaoVoltar onClick={() => setEtapa(2)} />
                <button
                  onClick={handleSubmit}
                  disabled={!etapa3Valida || carregando}
                  style={{
                    flex: 1, padding: '14px', border: 'none', borderRadius: '10px',
                    background: etapa3Valida && !carregando ? '#10b981' : '#d1fae5',
                    color: '#fff', fontWeight: 700, fontSize: '14px',
                    cursor: etapa3Valida && !carregando ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {carregando ? 'Cadastrando...' : '✓ Finalizar cadastro'}
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA 4 — Sucesso ── */}
          {etapa === 4 && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px 24px', boxShadow: '0 2px 8px rgba(0,0,0,.08)', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={40} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f', marginBottom: '8px' }}>
                Cadastro realizado!
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '16px' }}>
                Seu pedido foi recebido com sucesso. Um advogado da Advocacia Dativa entrará em contato em breve.
              </p>
              {protocolo && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px' }}>PROTOCOLO</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#166534', fontFamily: 'monospace', letterSpacing: '1px' }}>#{protocolo}</div>
                </div>
              )}
              <div style={{ background: '#f0f4f8', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>PRÓXIMOS PASSOS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'O gestor municipal receberá seu pedido',
                    'Um advogado será designado em até 2 dias úteis',
                    'Você receberá contato pelo telefone informado',
                    'Use seu e-mail e senha para acompanhar seu caso',
                  ].map((passo, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1e3a5f', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.4 }}>{passo}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Advocacia Dativa OAB-RJ · Atendimento gratuito
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
        Advocacia Dativa OAB-RJ · Acesso restrito aos participantes do programa
      </footer>

    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1.5px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', color: '#1e293b',
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function BotaoAvancar({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: '13px', border: 'none', borderRadius: '10px',
      background: disabled ? '#e2e8f0' : '#1e3a5f',
      color: disabled ? '#94a3b8' : '#fff',
      fontWeight: 700, fontSize: '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
    }}>
      Avançar <ChevronRight size={18} />
    </button>
  )
}

function BotaoVoltar({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '13px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
      background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '14px',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
    }}>
      <ChevronLeft size={18} /> Voltar
    </button>
  )
}
