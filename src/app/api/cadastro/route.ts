// ============================================================
// POST /api/cadastro   (PÚBLICA — auto-cadastro do cliente via QR Code)
// Cria: usuário Auth (nivel=cliente) + clientes + casos (aguardando).
// O município é resolvido pelo parâmetro da URL (id UUID ou slug do nome).
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AREA_MAP: Record<string, string> = {
  violencia: 'violencia_domestica',
  alimentos: 'familia_alimentos',
  outros: 'outros',
}

function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export async function POST(request: NextRequest) {
  const admin = createAdminClient()
  const body = await request.json().catch(() => ({}))
  const { municipio, nome, cpf, telefone, email, endereco, bairro, area, descricao, senha, lgpd } = body

  // Validações
  if (!nome || String(nome).trim().length < 3) return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  if (!senha || String(senha).length < 8) return NextResponse.json({ error: 'Senha deve ter ao menos 8 caracteres' }, { status: 400 })
  if (!area || !AREA_MAP[area]) return NextResponse.json({ error: 'Área jurídica inválida' }, { status: 400 })
  if (!descricao || String(descricao).trim().length < 20) return NextResponse.json({ error: 'Descrição muito curta' }, { status: 400 })
  if (!lgpd) return NextResponse.json({ error: 'É necessário aceitar os termos (LGPD)' }, { status: 400 })
  if (!municipio) return NextResponse.json({ error: 'Município não identificado' }, { status: 400 })

  // Resolve município (id UUID direto ou slug do nome)
  let municipioId: string | null = null
  if (isUUID(String(municipio))) {
    const { data } = await admin.from('municipios').select('id').eq('id', municipio).single()
    municipioId = data?.id ?? null
  } else {
    const { data: muns } = await admin.from('municipios').select('id, nome')
    municipioId = (muns ?? []).find(m => slugify(m.nome) === slugify(String(municipio)))?.id ?? null
  }
  if (!municipioId) return NextResponse.json({ error: 'Município não encontrado' }, { status: 404 })

  const areaJuridica = AREA_MAP[area]
  const qualificacao = [
    cpf ? `CPF: ${cpf}` : null,
    telefone ? `Tel: ${telefone}` : null,
    endereco ? `Endereço: ${endereco}` : null,
    bairro ? `Bairro: ${bairro}` : null,
  ].filter(Boolean).join(' · ') || 'Não informado'

  // 1) Cria usuário Auth (cliente já com senha própria → primeiro_acesso=false)
  const { data: novo, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, nivel: 'cliente', municipio_id: municipioId, primeiro_acesso: false },
  })
  if (authErr || !novo.user) {
    const dup = authErr?.message?.toLowerCase().includes('already') || authErr?.status === 422
    return NextResponse.json(
      { error: dup ? 'Já existe um cadastro com este email.' : (authErr?.message ?? 'Erro ao criar cadastro') },
      { status: dup ? 409 : 500 },
    )
  }
  const uid = novo.user.id

  // Garante o profile (o trigger cria; upsert reforça os dados)
  await admin.from('profiles').upsert({
    id: uid, nome, email, nivel: 'cliente', municipio_id: municipioId, primeiro_acesso: false, ativo: true,
  })

  // 2) clientes
  const { error: cliErr } = await admin.from('clientes').upsert({
    id: uid,
    municipio_id: municipioId,
    area_juridica: areaJuridica,
    qualificacao,
    descricao_caso: String(descricao).trim(),
    aceite_lgpd: true,
    aceite_lgpd_em: new Date().toISOString(),
  })
  if (cliErr) return NextResponse.json({ error: cliErr.message }, { status: 500 })

  // 3) caso (entra na fila do município)
  const { data: caso, error: casoErr } = await admin.from('casos').insert({
    municipio_id: municipioId,
    cliente_id: uid,
    area_juridica: areaJuridica,
    observacoes: String(descricao).trim(),
  }).select('id').single()
  if (casoErr) return NextResponse.json({ error: casoErr.message }, { status: 500 })

  const protocolo = String(caso.id).slice(0, 8).toUpperCase()
  return NextResponse.json({ sucesso: true, protocolo })
}
