/**
 * API Route para CRUD da tabela editora
 * Gerencia editoras dos livros da biblioteca
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
    console.error('Erro na API de editoras:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * GET - Buscar editoras
 * Suporta busca por nome, país e paginação
 */
async function handleGet(req, res) {
  const { search, page = 1, limit = 10, id } = req.query

  try {
    // Se foi fornecido um ID específico, buscar apenas essa editora
    if (id) {
      const { data: editora, error } = await supabaseAdmin
        .from('editora')
        .select(`
          *,
          codigo_postal:codigo_postal(cod_localidade),
          livros:livro(
            li_cod,
            li_titulo,
            li_ano
          )
        `)
        .eq('ed_cod', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Editora não encontrada' })
        }
        throw error
      }

      return res.status(200).json({ editora })
    }

    // Busca geral com filtros
    let query = supabaseAdmin
      .from('editora')
      .select(`
        *,
        codigo_postal:codigo_postal(cod_localidade),
        livros:livro(
          li_cod,
          li_titulo
        )
      `)

    // Aplicar filtro de busca se fornecido
    if (search) {
      query = query.or(`ed_nome.ilike.%${search}%,ed_pais.ilike.%${search}%,ed_email.ilike.%${search}%`)
    }

    // Aplicar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query
      .order('ed_nome')
      .range(offset, offset + parseInt(limit) - 1)

    const { data: editoras, error } = await query

    if (error) {
      throw error
    }

    // Contar total de registros para paginação
    let countQuery = supabaseAdmin
      .from('editora')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`ed_nome.ilike.%${search}%,ed_pais.ilike.%${search}%,ed_email.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    // Processar dados para incluir contagem de livros
    const editorasProcessadas = editoras?.map(editora => ({
      ...editora,
      total_livros: editora.livros?.length || 0,
      livros: undefined // Remover dados detalhados dos livros da resposta
    })) || []

    const totalPages = Math.ceil((count || 0) / parseInt(limit))

    res.status(200).json({
      editoras: editorasProcessadas,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults: count || 0,
        resultsPerPage: parseInt(limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar editoras:', error)
    res.status(500).json({ error: 'Erro ao buscar editoras' })
  }
}

/**
 * POST - Criar nova editora
 */
async function handlePost(req, res) {
  const { ed_nome, ed_pais, ed_morada, ed_cod_postal, ed_email, ed_tlm } = req.body

  // Validações
  if (!ed_nome || ed_nome.trim().length === 0) {
    return res.status(400).json({ error: 'Nome da editora é obrigatório' })
  }

  if (ed_email && !isValidEmail(ed_email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }

  try {
    const { data: novaEditora, error } = await supabaseAdmin
      .from('editora')
      .insert({
        ed_nome: ed_nome.trim(),
        ed_pais: ed_pais?.trim() || null,
        ed_morada: ed_morada?.trim() || null,
        ed_cod_postal: ed_cod_postal || null,
        ed_email: ed_email?.trim() || null,
        ed_tlm: ed_tlm?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar editora:', error)
      return res.status(500).json({ error: 'Erro ao criar editora' })
    }

    res.status(201).json({
      success: true,
      message: 'Editora criada com sucesso!',
      editora: novaEditora
    })

  } catch (error) {
    console.error('Erro ao criar editora:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * PUT - Atualizar editora existente
 */
async function handlePut(req, res) {
  const { id } = req.query
  const { ed_nome, ed_pais, ed_morada, ed_cod_postal, ed_email, ed_tlm } = req.body

  if (!id) {
    return res.status(400).json({ error: 'ID da editora é obrigatório' })
  }

  // Validações
  if (!ed_nome || ed_nome.trim().length === 0) {
    return res.status(400).json({ error: 'Nome da editora é obrigatório' })
  }

  if (ed_email && !isValidEmail(ed_email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }

  try {
    // Verificar se a editora existe
    const { data: existingEditora } = await supabaseAdmin
      .from('editora')
      .select('ed_cod')
      .eq('ed_cod', id)
      .single()

    if (!existingEditora) {
      return res.status(404).json({ error: 'Editora não encontrada' })
    }

    const { data: editoraAtualizada, error } = await supabaseAdmin
      .from('editora')
      .update({
        ed_nome: ed_nome.trim(),
        ed_pais: ed_pais?.trim() || null,
        ed_morada: ed_morada?.trim() || null,
        ed_cod_postal: ed_cod_postal || null,
        ed_email: ed_email?.trim() || null,
        ed_tlm: ed_tlm?.trim() || null
      })
      .eq('ed_cod', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar editora:', error)
      return res.status(500).json({ error: 'Erro ao atualizar editora' })
    }

    res.status(200).json({
      success: true,
      message: 'Editora atualizada com sucesso!',
      editora: editoraAtualizada
    })

  } catch (error) {
    console.error('Erro ao atualizar editora:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * DELETE - Excluir editora
 */
async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'ID da editora é obrigatório' })
  }

  try {
    // Verificar se a editora existe
    const { data: existingEditora } = await supabaseAdmin
      .from('editora')
      .select('ed_cod')
      .eq('ed_cod', id)
      .single()

    if (!existingEditora) {
      return res.status(404).json({ error: 'Editora não encontrada' })
    }

    // Verificar se há livros associados
    const { data: livros, error: livrosError } = await supabaseAdmin
      .from('livro')
      .select('li_cod')
      .eq('li_editora', id)

    if (livrosError) {
      throw livrosError
    }

    if (livros && livros.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir a editora pois existem livros associados' 
      })
    }

    // Excluir a editora
    const { error } = await supabaseAdmin
      .from('editora')
      .delete()
      .eq('ed_cod', id)

    if (error) {
      console.error('Erro ao excluir editora:', error)
      return res.status(500).json({ error: 'Erro ao excluir editora' })
    }

    res.status(200).json({
      success: true,
      message: 'Editora excluída com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao excluir editora:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
