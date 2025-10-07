/**
 * API Route para buscar gêneros literários
 * Utilizada para preenchimento de formulários
 */

import { supabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  // Configurar CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
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
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ error: 'Método não permitido' })
    }
  } catch (error) {
    console.error('Erro na API de gêneros:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * GET - Buscar gêneros
 */
async function handleGet(req, res) {
  const { search } = req.query

  try {
    let query = supabaseAdmin
      .from('genero')
      .select('ge_genero')
      .order('ge_genero')

    // Aplicar filtro de busca se fornecido
    if (search) {
      query = query.ilike('ge_genero', `%${search}%`)
    }

    const { data: generos, error } = await query

    if (error) {
      console.error('Erro ao buscar gêneros:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    res.status(200).json(generos || [])

  } catch (error) {
    console.error('Erro ao buscar gêneros:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * POST - Criar novo gênero
 */
async function handlePost(req, res) {
  const { ge_genero } = req.body

  // Validações
  if (!ge_genero || ge_genero.trim().length === 0) {
    return res.status(400).json({ error: 'Nome do gênero é obrigatório' })
  }

  try {
    const { data: novoGenero, error } = await supabaseAdmin
      .from('genero')
      .insert({
        ge_genero: ge_genero.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar gênero:', error)
      return res.status(500).json({ error: 'Erro ao criar gênero' })
    }

    res.status(201).json({
      success: true,
      message: 'Gênero criado com sucesso!',
      genero: novoGenero
    })

  } catch (error) {
    console.error('Erro ao criar gênero:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * DELETE - Excluir gênero
 */
async function handleDelete(req, res) {
  const { genero } = req.query

  if (!genero) {
    return res.status(400).json({ error: 'Nome do gênero é obrigatório' })
  }

  try {
    // Verificar se o gênero existe
    const { data: existingGenero } = await supabaseAdmin
      .from('genero')
      .select('ge_genero')
      .eq('ge_genero', genero)
      .single()

    if (!existingGenero) {
      return res.status(404).json({ error: 'Gênero não encontrado' })
    }

    // Verificar se há livros associados
    const { data: livros, error: livrosError } = await supabaseAdmin
      .from('livro')
      .select('li_cod')
      .eq('li_genero', genero)

    if (livrosError) {
      throw livrosError
    }

    if (livros && livros.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir o gênero pois existem livros associados' 
      })
    }

    // Excluir o gênero
    const { error } = await supabaseAdmin
      .from('genero')
      .delete()
      .eq('ge_genero', genero)

    if (error) {
      console.error('Erro ao excluir gênero:', error)
      return res.status(500).json({ error: 'Erro ao excluir gênero' })
    }

    res.status(200).json({
      success: true,
      message: 'Gênero excluído com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao excluir gênero:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
