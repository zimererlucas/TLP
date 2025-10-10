/**
 * API Route para CRUD da tabela utente
 * Gerencia usuários da biblioteca
 */

import { supabaseAdmin, isValidEmail } from '../../lib/supabase'

export default async function handler(req, res) {
  // Configurar CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'PUT':
        return await handlePut(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ error: 'Método não permitido' })
    }
  } catch (error) {
    console.error('Erro na API de utentes:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * GET - Buscar utentes
 * Suporta busca por nome, email, NIF e paginação
 */
async function handleGet(req, res) {
  const { search, page = 1, limit = 10, id } = req.query

  try {
    // Se foi fornecido um ID específico, buscar apenas esse utente
    if (id) {
      const { data: utente, error } = await supabaseAdmin
        .from('utente')
        .select(`
          *,
          codigo_postal:codigo_postal(cod_localidade),
          requisicoes:requisicao(
            re_cod,
            re_data_requisicao,
            re_data_devolucao,
            exemplar:livro_exemplar(
              lex_cod,
              livro:livro(li_titulo)
            )
          )
        `)
        .eq('ut_cod', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Utente não encontrado' })
        }
        throw error
      }

      return res.status(200).json({ utente })
    }

    // Busca geral com filtros
    let query = supabaseAdmin
      .from('utente')
      .select(`
        *,
        codigo_postal:codigo_postal(cod_localidade),
        requisicoes:requisicao(
          re_cod,
          re_data_requisicao,
          re_data_devolucao
        )
      `)

    // Aplicar filtro de busca se fornecido
    if (search) {
      query = query.or(`ut_nome.ilike.%${search}%,ut_email.ilike.%${search}%,ut_nif.ilike.%${search}%`)
    }

    // Aplicar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query
      .order('ut_nome')
      .range(offset, offset + parseInt(limit) - 1)

    const { data: utentes, error } = await query

    if (error) {
      throw error
    }

    // Contar total de registros para paginação
    let countQuery = supabaseAdmin
      .from('utente')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`ut_nome.ilike.%${search}%,ut_email.ilike.%${search}%,ut_nif.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    // Processar dados para incluir estatísticas de empréstimos
    const utentesProcessados = utentes?.map(utente => {
      const requisicoes = utente.requisicoes || []
      const totalEmprestimos = requisicoes.length
      const emprestimosAtivos = requisicoes.filter(req => !req.re_data_devolucao).length
      const emprestimosDevolvidos = requisicoes.filter(req => req.re_data_devolucao).length

      return {
        ...utente,
        total_emprestimos: totalEmprestimos,
        emprestimos_ativos: emprestimosAtivos,
        emprestimos_devolvidos: emprestimosDevolvidos,
        requisicoes: undefined // Remover dados detalhados das requisições da resposta
      }
    }) || []

    const totalPages = Math.ceil((count || 0) / parseInt(limit))

    res.status(200).json({
      utentes: utentesProcessados,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults: count || 0,
        resultsPerPage: parseInt(limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar utentes:', error)
    res.status(500).json({ error: 'Erro ao buscar utentes' })
  }
}

/**
 * POST - Criar novo utente
 */
async function handlePost(req, res) {
  const { ut_nome, ut_nif, ut_email, ut_tlm, ut_morada, ut_cod_postal } = req.body

  // Validações
  if (!ut_nome || ut_nome.trim().length === 0) {
    return res.status(400).json({ error: 'Nome do utente é obrigatório' })
  }

  if (ut_email && !isValidEmail(ut_email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }

  try {
    // Verificar se NIF já existe (se fornecido)
    if (ut_nif) {
      const { data: existingNif } = await supabaseAdmin
        .from('utente')
        .select('ut_cod')
        .eq('ut_nif', ut_nif)
        .single()

      if (existingNif) {
        return res.status(400).json({ error: 'NIF já está cadastrado' })
      }
    }

    // Verificar se email já existe (se fornecido)
    if (ut_email) {
      const { data: existingEmail } = await supabaseAdmin
        .from('utente')
        .select('ut_cod')
        .eq('ut_email', ut_email)
        .single()

      if (existingEmail) {
        return res.status(400).json({ error: 'Email já está cadastrado' })
      }
    }

    const { data: novoUtente, error } = await supabaseAdmin
      .from('utente')
      .insert({
        ut_nome: ut_nome.trim(),
        ut_nif: ut_nif?.trim() || null,
        ut_email: ut_email?.trim() || null,
        ut_tlm: ut_tlm?.trim() || null,
        ut_morada: ut_morada?.trim() || null,
        ut_cod_postal: ut_cod_postal || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar utente:', error)
      return res.status(500).json({ error: 'Erro ao criar utente' })
    }

    res.status(201).json({
      success: true,
      message: 'Utente criado com sucesso!',
      utente: novoUtente
    })

  } catch (error) {
    console.error('Erro ao criar utente:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * PUT - Atualizar utente existente
 */
async function handlePut(req, res) {
  const { id } = req.query
  const { ut_nome, ut_nif, ut_email, ut_tlm, ut_morada, ut_cod_postal } = req.body

  if (!id) {
    return res.status(400).json({ error: 'ID do utente é obrigatório' })
  }

  // Validações
  if (!ut_nome || ut_nome.trim().length === 0) {
    return res.status(400).json({ error: 'Nome do utente é obrigatório' })
  }

  if (ut_email && !isValidEmail(ut_email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }

  try {
    // Verificar se o utente existe
    const { data: existingUtente } = await supabaseAdmin
      .from('utente')
      .select('ut_cod')
      .eq('ut_cod', id)
      .single()

    if (!existingUtente) {
      return res.status(404).json({ error: 'Utente não encontrado' })
    }

    // Verificar se NIF já existe em outro utente (se fornecido)
    if (ut_nif) {
      const { data: existingNif } = await supabaseAdmin
        .from('utente')
        .select('ut_cod')
        .eq('ut_nif', ut_nif)
        .neq('ut_cod', id)
        .single()

      if (existingNif) {
        return res.status(400).json({ error: 'NIF já está cadastrado' })
      }
    }

    // Verificar se email já existe em outro utente (se fornecido)
    if (ut_email) {
      const { data: existingEmail } = await supabaseAdmin
        .from('utente')
        .select('ut_cod')
        .eq('ut_email', ut_email)
        .neq('ut_cod', id)
        .single()

      if (existingEmail) {
        return res.status(400).json({ error: 'Email já está cadastrado' })
      }
    }

    const { data: utenteAtualizado, error } = await supabaseAdmin
      .from('utente')
      .update({
        ut_nome: ut_nome.trim(),
        ut_nif: ut_nif?.trim() || null,
        ut_email: ut_email?.trim() || null,
        ut_tlm: ut_tlm?.trim() || null,
        ut_morada: ut_morada?.trim() || null,
        ut_cod_postal: ut_cod_postal || null
      })
      .eq('ut_cod', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar utente:', error)
      return res.status(500).json({ error: 'Erro ao atualizar utente' })
    }

    res.status(200).json({
      success: true,
      message: 'Utente atualizado com sucesso!',
      utente: utenteAtualizado
    })

  } catch (error) {
    console.error('Erro ao atualizar utente:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * DELETE - Excluir utente
 */
async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'ID do utente é obrigatório' })
  }

  try {
    // Verificar se o utente existe
    const { data: existingUtente } = await supabaseAdmin
      .from('utente')
      .select('ut_cod, ut_nome')
      .eq('ut_cod', id)
      .single()

    if (!existingUtente) {
      return res.status(404).json({ error: 'Utente não encontrado' })
    }

    // Verificar se há empréstimos ativos
    const { data: emprestimosAtivos, error: emprestimosError } = await supabaseAdmin
      .from('requisicao')
      .select('re_cod')
      .eq('re_ut_cod', id)
      .is('re_data_devolucao', null)

    if (emprestimosError) {
      console.error('Erro ao verificar empréstimos ativos:', emprestimosError)
    }

    if (emprestimosAtivos && emprestimosAtivos.length > 0) {
      return res.status(400).json({ 
        error: `Não é possível excluir o utente pois possui ${emprestimosAtivos.length} empréstimo(s) ativo(s)` 
      })
    }

    // Verificar se há empréstimos históricos
    const { data: todosEmprestimos } = await supabaseAdmin
      .from('requisicao')
      .select('re_cod')
      .eq('re_ut_cod', id)

    if (todosEmprestimos && todosEmprestimos.length > 0) {
      // Se houver empréstimos históricos, não excluir por integridade referencial
      return res.status(400).json({ 
        error: `Não é possível excluir o utente pois possui histórico de ${todosEmprestimos.length} empréstimo(s). Por integridade dos dados, utentes com histórico não podem ser excluídos.` 
      })
    }

    // Excluir o utente
    const { error } = await supabaseAdmin
      .from('utente')
      .delete()
      .eq('ut_cod', id)

    if (error) {
      console.error('Erro ao excluir utente:', error)
      // Retornar detalhes do erro do Supabase
      return res.status(500).json({ 
        error: `Erro ao excluir utente: ${error.message || 'Erro desconhecido'}`,
        details: error.details || error.hint || null
      })
    }

    res.status(200).json({
      success: true,
      message: `Utente "${existingUtente.ut_nome}" excluído com sucesso!`
    })

  } catch (error) {
    console.error('Erro ao excluir utente:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    })
  }
}
