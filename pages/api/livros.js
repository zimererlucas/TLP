/**
 * API Route para CRUD completo da tabela livro
 * Substitui as funcionalidades de livros do PHP original
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
    console.error('Erro na API de livros:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * GET - Buscar livros
 * Suporta busca por título, autor, ISBN, editora ou gênero
 * Suporta paginação
 */
async function handleGet(req, res) {
  const { search, page = 1, limit = 10, id } = req.query

  try {
    // Se foi fornecido um ID específico, buscar apenas esse livro
    if (id) {
      const { data: livro, error } = await supabaseAdmin
        .from('livro')
        .select(`
          *,
          autor:autor(au_nome, au_pais),
          editora:editora(ed_nome, ed_pais),
          genero:genero(ge_genero),
          exemplares:livro_exemplar(
            lex_cod,
            lex_estado,
            lex_disponivel
          )
        `)
        .eq('li_cod', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Livro não encontrado' })
        }
        throw error
      }

      return res.status(200).json({ livro })
    }

    // Busca geral com filtros
    let query = supabaseAdmin
      .from('livro')
      .select(`
        *,
        autor:autor(au_nome, au_pais),
        editora:editora(ed_nome, ed_pais),
        genero:genero(ge_genero),
        exemplares:livro_exemplar(
          lex_cod,
          lex_estado,
          lex_disponivel
        )
      `)

    // Aplicar filtro de busca se fornecido (apenas em campos da tabela livro)
    if (search) {
      query = query.or(`li_titulo.ilike.%${search}%,li_isbn.ilike.%${search}%`)
    }

    // Aplicar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query
      .order('li_titulo')
      .range(offset, offset + parseInt(limit) - 1)

    const { data: livros, error } = await query

    if (error) {
      throw error
    }

    // Contar total de registros para paginação
    let countQuery = supabaseAdmin
      .from('livro')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`li_titulo.ilike.%${search}%,li_isbn.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    // Processar dados para incluir estatísticas de exemplares
    let livrosProcessados = livros?.map(livro => {
      const exemplares = livro.exemplares || []
      const totalExemplares = exemplares.length
      const exemplaresDisponiveis = exemplares.filter(ex => ex.lex_disponivel).length

      return {
        ...livro,
        total_exemplares: totalExemplares,
        exemplares_disponiveis: exemplaresDisponiveis,
        exemplares: undefined // Remover dados detalhados dos exemplares da resposta
      }
    }) || []

    // Filtrar por autor, editora ou gênero se houver busca
    if (search) {
      const searchLower = search.toLowerCase()
      livrosProcessados = livrosProcessados.filter(livro => {
        const autorMatch = livro.autor?.au_nome?.toLowerCase().includes(searchLower)
        const editoraMatch = livro.editora?.ed_nome?.toLowerCase().includes(searchLower)
        const generoMatch = livro.genero?.ge_genero?.toLowerCase().includes(searchLower)
        const tituloMatch = livro.li_titulo?.toLowerCase().includes(searchLower)
        const isbnMatch = livro.li_isbn?.toLowerCase().includes(searchLower)
        
        return autorMatch || editoraMatch || generoMatch || tituloMatch || isbnMatch
      })
    }

    // Usar o total de livros filtrados para paginação quando houver busca
    const totalResults = search ? livrosProcessados.length : (count || 0)
    const totalPages = Math.ceil(totalResults / parseInt(limit))

    res.status(200).json({
      livros: livrosProcessados,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults,
        resultsPerPage: parseInt(limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar livros:', error)
    res.status(500).json({ error: 'Erro ao buscar livros' })
  }
}

/**
 * POST - Criar novo livro
 */
async function handlePost(req, res) {
  const { li_titulo, li_ano, li_edicao, li_isbn, li_editora, li_autor, li_genero } = req.body

  // Validações
  if (!li_titulo || li_titulo.trim().length === 0) {
    return res.status(400).json({ error: 'Título do livro é obrigatório' })
  }

  try {
    const { data: novoLivro, error } = await supabaseAdmin
      .from('livro')
      .insert({
        li_titulo: li_titulo.trim(),
        li_ano: li_ano || null,
        li_edicao: li_edicao || null,
        li_isbn: li_isbn || null,
        li_editora: li_editora || null,
        li_autor: li_autor || null,
        li_genero: li_genero || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar livro:', error)
      return res.status(500).json({ error: 'Erro ao criar livro' })
    }

    res.status(201).json({
      success: true,
      message: 'Livro criado com sucesso!',
      livro: novoLivro
    })

  } catch (error) {
    console.error('Erro ao criar livro:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * PUT - Atualizar livro existente
 */
async function handlePut(req, res) {
  const { id } = req.query
  const { li_titulo, li_ano, li_edicao, li_isbn, li_editora, li_autor, li_genero } = req.body

  if (!id) {
    return res.status(400).json({ error: 'ID do livro é obrigatório' })
  }

  // Validações
  if (!li_titulo || li_titulo.trim().length === 0) {
    return res.status(400).json({ error: 'Título do livro é obrigatório' })
  }

  try {
    // Verificar se o livro existe
    const { data: existingBook } = await supabaseAdmin
      .from('livro')
      .select('li_cod')
      .eq('li_cod', id)
      .single()

    if (!existingBook) {
      return res.status(404).json({ error: 'Livro não encontrado' })
    }

    const { data: livroAtualizado, error } = await supabaseAdmin
      .from('livro')
      .update({
        li_titulo: li_titulo.trim(),
        li_ano: li_ano || null,
        li_edicao: li_edicao || null,
        li_isbn: li_isbn || null,
        li_editora: li_editora || null,
        li_autor: li_autor || null,
        li_genero: li_genero || null
      })
      .eq('li_cod', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar livro:', error)
      return res.status(500).json({ error: 'Erro ao atualizar livro' })
    }

    res.status(200).json({
      success: true,
      message: 'Livro atualizado com sucesso!',
      livro: livroAtualizado
    })

  } catch (error) {
    console.error('Erro ao atualizar livro:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * DELETE - Excluir livro
 */
async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'ID do livro é obrigatório' })
  }

  try {
    // Verificar se o livro existe
    const { data: existingBook } = await supabaseAdmin
      .from('livro')
      .select('li_cod')
      .eq('li_cod', id)
      .single()

    if (!existingBook) {
      return res.status(404).json({ error: 'Livro não encontrado' })
    }

    // Verificar se há exemplares associados
    const { data: exemplares, error: exemplaresError } = await supabaseAdmin
      .from('livro_exemplar')
      .select('lex_cod')
      .eq('lex_li_cod', id)

    if (exemplaresError) {
      throw exemplaresError
    }

    if (exemplares && exemplares.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir o livro pois existem exemplares associados' 
      })
    }

    // Excluir o livro
    const { error } = await supabaseAdmin
      .from('livro')
      .delete()
      .eq('li_cod', id)

    if (error) {
      console.error('Erro ao excluir livro:', error)
      return res.status(500).json({ error: 'Erro ao excluir livro' })
    }

    res.status(200).json({
      success: true,
      message: 'Livro excluído com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao excluir livro:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
