/**
 * API Route para CRUD da tabela autor
 * Gerencia autores dos livros da biblioteca
 */

import { supabaseAdmin } from '../../lib/supabase'

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
    console.error('Erro na API de autores:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * GET - Buscar autores
 * Suporta busca por nome e paginação
 */
async function handleGet(req, res) {
  const { search, page = 1, limit = 10, id } = req.query

  try {
    // Se foi fornecido um ID específico, buscar apenas esse autor
    if (id) {
      const { data: autor, error } = await supabaseAdmin
        .from('autor')
        .select(`
          *,
          livros:livro(
            li_cod,
            li_titulo,
            li_ano
          )
        `)
        .eq('au_cod', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Autor não encontrado' })
        }
        throw error
      }

      return res.status(200).json({ autor })
    }

    // Busca geral com filtros
    let query = supabaseAdmin
      .from('autor')
      .select(`
        *,
        livros:livro(
          li_cod,
          li_titulo
        )
      `)

    // Aplicar filtro de busca se fornecido
    if (search) {
      query = query.or(`au_nome.ilike.%${search}%,au_pais.ilike.%${search}%`)
    }

    // Aplicar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query
      .order('au_nome')
      .range(offset, offset + parseInt(limit) - 1)

    const { data: autores, error } = await query

    if (error) {
      throw error
    }

    // Contar total de registros para paginação
    let countQuery = supabaseAdmin
      .from('autor')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`au_nome.ilike.%${search}%,au_pais.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    // Processar dados para incluir contagem de livros
    const autoresProcessados = autores?.map(autor => ({
      ...autor,
      total_livros: autor.livros?.length || 0,
      livros: undefined // Remover dados detalhados dos livros da resposta
    })) || []

    const totalPages = Math.ceil((count || 0) / parseInt(limit))

    res.status(200).json({
      autores: autoresProcessados,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults: count || 0,
        resultsPerPage: parseInt(limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar autores:', error)
    res.status(500).json({ error: 'Erro ao buscar autores' })
  }
}

/**
 * POST - Criar novo autor
 */
async function handlePost(req, res) {
  const { au_nome, au_pais } = req.body

  // Validações
  if (!au_nome || au_nome.trim().length === 0) {
    return res.status(400).json({ error: 'Nome do autor é obrigatório' })
  }

  try {
    const { data: novoAutor, error } = await supabaseAdmin
      .from('autor')
      .insert({
        au_nome: au_nome.trim(),
        au_pais: au_pais?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar autor:', error)
      return res.status(500).json({ error: 'Erro ao criar autor' })
    }

    res.status(201).json({
      success: true,
      message: 'Autor criado com sucesso!',
      autor: novoAutor
    })

  } catch (error) {
    console.error('Erro ao criar autor:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * PUT - Atualizar autor existente
 */
async function handlePut(req, res) {
  const { id } = req.query
  const { au_nome, au_pais } = req.body

  if (!id) {
    return res.status(400).json({ error: 'ID do autor é obrigatório' })
  }

  // Validações
  if (!au_nome || au_nome.trim().length === 0) {
    return res.status(400).json({ error: 'Nome do autor é obrigatório' })
  }

  try {
    // Verificar se o autor existe
    const { data: existingAuthor } = await supabaseAdmin
      .from('autor')
      .select('au_cod')
      .eq('au_cod', id)
      .single()

    if (!existingAuthor) {
      return res.status(404).json({ error: 'Autor não encontrado' })
    }

    const { data: autorAtualizado, error } = await supabaseAdmin
      .from('autor')
      .update({
        au_nome: au_nome.trim(),
        au_pais: au_pais?.trim() || null
      })
      .eq('au_cod', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar autor:', error)
      return res.status(500).json({ error: 'Erro ao atualizar autor' })
    }

    res.status(200).json({
      success: true,
      message: 'Autor atualizado com sucesso!',
      autor: autorAtualizado
    })

  } catch (error) {
    console.error('Erro ao atualizar autor:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * DELETE - Excluir autor
 */
async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'ID do autor é obrigatório' })
  }

  try {
    // Verificar se o autor existe
    const { data: existingAuthor } = await supabaseAdmin
      .from('autor')
      .select('au_cod')
      .eq('au_cod', id)
      .single()

    if (!existingAuthor) {
      return res.status(404).json({ error: 'Autor não encontrado' })
    }

    // Verificar se há livros associados
    const { data: livros, error: livrosError } = await supabaseAdmin
      .from('livro')
      .select('li_cod')
      .eq('li_autor', id)

    if (livrosError) {
      throw livrosError
    }

    if (livros && livros.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir o autor pois existem livros associados' 
      })
    }

    // Excluir o autor
    const { error } = await supabaseAdmin
      .from('autor')
      .delete()
      .eq('au_cod', id)

    if (error) {
      console.error('Erro ao excluir autor:', error)
      return res.status(500).json({ error: 'Erro ao excluir autor' })
    }

    res.status(200).json({
      success: true,
      message: 'Autor excluído com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao excluir autor:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
