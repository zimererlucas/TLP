/**
 * API Route para CRUD da tabela livro_exemplar
 * Gerencia exemplares da biblioteca
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
    console.error('Erro na API de exemplares:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * GET - Buscar exemplares
 * Suporta filtros por disponibilidade, livro e paginação
 */
async function handleGet(req, res) {
  const { disponivel, livro, page = 1, limit = 10, id } = req.query

  try {
    // Se foi fornecido um ID específico, buscar apenas esse exemplar
  if (id) {
      const { data: exemplar, error } = await supabaseAdmin
        .from('livro_exemplar')
        .select(`
          lex_cod,
          lex_estado,
          lex_disponivel,
          lex_li_cod,
          livro:livro (
            li_titulo,
            autor:autor (
              au_nome
            )
          )
        `)
        .eq('lex_cod', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Exemplar não encontrado' })
        }
        throw error
      }

      return res.status(200).json({ data: exemplar })
    }

    // Busca geral com filtros
    let query = supabaseAdmin
      .from('livro_exemplar')
      .select(`
        lex_cod,
        lex_estado,
        lex_disponivel,
        lex_li_cod,
        livro:livro (
          li_titulo,
          autor:autor (
            au_nome
          )
        )
      `)

    // Aplicar filtros
    if (disponivel !== undefined) {
      query = query.eq('lex_disponivel', disponivel === 'true')
    }

    if (livro) {
      query = query.eq('lex_li_cod', livro)
    }

    // Ordenar por código do exemplar
    query = query.order('lex_cod', { ascending: true })

    // Aplicar paginação somente quando apropriado
    const pageNum = parseInt(page, 10) || 1
    const limitNum = limit === 'all' ? null : (parseInt(limit, 10) || 10)
    if (limitNum !== null) {
      const from = (pageNum - 1) * limitNum
      const to = from + limitNum - 1
      query = query.range(from, to)
    }

    const { data: exemplares, error } = await query

    if (error) throw error
    
    // Enriquecer com status de empréstimo ativo (servidor)
    const exemplarIds = (exemplares || []).map(e => e.lex_cod)
    let exemplaresComStatus = exemplares
    if (exemplarIds.length > 0) {
      const { data: requisicoesAtivas } = await supabaseAdmin
        .from('requisicao')
        .select(`
          re_lex_cod,
          re_data_requisicao,
          re_data_prevista,
          re_data_devolucao,
          utente:utente(ut_nome)
        `)
        .in('re_lex_cod', exemplarIds)
        .or('re_data_devolucao.is.null,re_data_devolucao.eq.')

      const ativoPorExemplar = new Map()
      ;(requisicoesAtivas || []).forEach((req) => {
        if (!ativoPorExemplar.has(req.re_lex_cod)) {
          ativoPorExemplar.set(req.re_lex_cod, req)
        }
      })

      exemplaresComStatus = exemplares.map((ex) => {
        const ativo = ativoPorExemplar.get(ex.lex_cod)
        const utenteField = ativo?.utente
        const utenteNome = Array.isArray(utenteField) ? utenteField[0]?.ut_nome : utenteField?.ut_nome
        return {
          ...ex,
          // Considerar indisponível se houver empréstimo ativo, independentemente do flag salvo
          lex_disponivel: ex.lex_disponivel && !ativo,
          re_data_requisicao: ativo?.re_data_requisicao || null,
          re_data_prevista: ativo?.re_data_prevista || null,
          ut_nome: utenteNome || null,
        }
      })
    }

    return res.status(200).json({ data: exemplaresComStatus })
  } catch (error) {
    console.error('Erro ao buscar exemplares:', error)
    return res.status(500).json({ error: error.message })
  }
}

/**
 * POST - Criar novo exemplar
 */
async function handlePost(req, res) {
  const { lex_li_cod, lex_estado, lex_disponivel } = req.body

  try {
    // Validar dados obrigatórios
    if (!lex_li_cod) {
      return res.status(400).json({ error: 'Código do livro é obrigatório' })
    }

    // Verificar se o livro existe
    const { data: livro, error: livroError } = await supabaseAdmin
      .from('livro')
      .select('li_cod')
      .eq('li_cod', lex_li_cod)
      .single()

    if (livroError) {
      return res.status(400).json({ error: 'Livro não encontrado' })
    }

    // Criar o exemplar
    const { data: novoExemplar, error } = await supabaseAdmin
      .from('livro_exemplar')
      .insert({
        lex_li_cod,
        lex_estado: lex_estado || 'Bom',
        lex_disponivel: lex_disponivel !== undefined ? lex_disponivel : true
      })
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({ data: novoExemplar })
  } catch (error) {
    console.error('Erro ao criar exemplar:', error)
    return res.status(500).json({ error: error.message })
  }
}

/**
 * PUT - Atualizar exemplar
 */
async function handlePut(req, res) {
  const { id } = req.query
  const { lex_estado, lex_disponivel } = req.body

  try {
    if (!id) {
      return res.status(400).json({ error: 'ID do exemplar é obrigatório' })
    }

    const updateData = {}
    if (lex_estado !== undefined) updateData.lex_estado = lex_estado
    if (lex_disponivel !== undefined) updateData.lex_disponivel = lex_disponivel

    const { data: exemplarAtualizado, error } = await supabaseAdmin
      .from('livro_exemplar')
      .update(updateData)
      .eq('lex_cod', id)
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ data: exemplarAtualizado })
  } catch (error) {
    console.error('Erro ao atualizar exemplar:', error)
    return res.status(500).json({ error: error.message })
  }
}

/**
 * DELETE - Deletar exemplar
 */
async function handleDelete(req, res) {
  const { id } = req.query

  try {
    if (!id) {
      return res.status(400).json({ error: 'ID do exemplar é obrigatório' })
    }

    const { error } = await supabaseAdmin
      .from('livro_exemplar')
      .delete()
      .eq('lex_cod', id)

    if (error) throw error

    return res.status(200).json({ message: 'Exemplar deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar exemplar:', error)
    return res.status(500).json({ error: error.message })
  }
}