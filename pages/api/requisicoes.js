/**
 * API Route para CRUD da tabela requisicao
 * Gerencia empréstimos da biblioteca
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
    console.error('Erro na API de requisições:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * GET - Buscar requisições
 * Suporta filtros por status (ativo, devolvido) e paginação
 */
async function handleGet(req, res) {
  const { status, page = 1, limit = 10, id } = req.query

  try {
    // Se foi fornecido um ID específico, buscar apenas essa requisição
    if (id) {
      const { data: requisicao, error } = await supabaseAdmin
        .from('requisicao')
        .select(`
          re_cod,
          re_data_requisicao,
          re_data_devolucao,
          utente:utente (
            ut_cod,
            ut_nome,
            ut_email
          ),
          exemplar:livro_exemplar (
            lex_cod,
            lex_estado,
            lex_disponivel,
            livro:livro (
              li_titulo,
              autor:autor (
                au_nome
              )
            )
          )
        `)
        .eq('re_cod', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Requisição não encontrada' })
        }
        throw error
      }

      return res.status(200).json({ data: requisicao })
    }

    // Busca geral com filtros
    let query = supabaseAdmin
      .from('requisicao')
      .select(`
        re_cod,
        re_data_requisicao,
        re_data_devolucao,
        utente:utente (
          ut_cod,
          ut_nome,
          ut_email
        ),
        exemplar:livro_exemplar (
          lex_cod,
          lex_estado,
          lex_disponivel,
          livro:livro (
            li_titulo,
            autor:autor (
              au_nome
            )
          )
        )
      `)

    // Aplicar filtros
    if (status === 'ativo') {
      query = query.is('re_data_devolucao', null)
    } else if (status === 'devolvido') {
      query = query.not('re_data_devolucao', 'is', null)
    }

    // Ordenar por data de requisição (mais recentes primeiro)
    query = query.order('re_data_requisicao', { ascending: false })

    // Aplicar paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: requisicoes, error } = await query

    if (error) throw error

    return res.status(200).json({ data: requisicoes })
  } catch (error) {
    console.error('Erro ao buscar requisições:', error)
    return res.status(500).json({ error: error.message })
  }
}

/**
 * POST - Criar nova requisição (empréstimo)
 */
async function handlePost(req, res) {
  const { re_ut_cod, re_lex_cod, re_data_requisicao } = req.body

  try {
    // Validar dados obrigatórios
    if (!re_ut_cod || !re_lex_cod) {
      return res.status(400).json({ error: 'Utente e exemplar são obrigatórios' })
    }

    // Permitido múltiplos empréstimos por utente: removida verificação de ativo único

    // Verificar se o exemplar está disponível
    const { data: exemplar, error: exemplarError } = await supabaseAdmin
      .from('livro_exemplar')
      .select('lex_disponivel')
      .eq('lex_cod', re_lex_cod)
      .single()

    if (exemplarError) {
      return res.status(400).json({ error: 'Exemplar não encontrado' })
    }

    if (!exemplar.lex_disponivel) {
      return res.status(400).json({ error: 'Exemplar não está disponível' })
    }

    // Criar a requisição
    const { data: novaRequisicao, error } = await supabaseAdmin
      .from('requisicao')
      .insert({
        re_ut_cod,
        re_lex_cod,
        re_data_requisicao: re_data_requisicao || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) throw error

    // Atualizar exemplar como indisponível
    const { error: updateError } = await supabaseAdmin
      .from('livro_exemplar')
      .update({ lex_disponivel: false })
      .eq('lex_cod', re_lex_cod)

    if (updateError) {
      console.error('Erro ao atualizar exemplar:', updateError)
      // Não falhar a operação, apenas logar o erro
    }

    return res.status(201).json({ data: novaRequisicao })
  } catch (error) {
    console.error('Erro ao criar requisição:', error)
    return res.status(500).json({ error: error.message })
  }
}

/**
 * PUT - Atualizar requisição (devolução)
 */
async function handlePut(req, res) {
  const { id } = req.query
  const { re_data_devolucao } = req.body

  try {
    if (!id) {
      return res.status(400).json({ error: 'ID da requisição é obrigatório' })
    }

    // Buscar a requisição para obter o exemplar
    const { data: requisicao, error: fetchError } = await supabaseAdmin
      .from('requisicao')
      .select('re_lex_cod')
      .eq('re_cod', id)
      .single()

    if (fetchError) {
      return res.status(404).json({ error: 'Requisição não encontrada' })
    }

    // Atualizar a requisição com a data de devolução
    const { data: requisicaoAtualizada, error } = await supabaseAdmin
      .from('requisicao')
      .update({
        re_data_devolucao: re_data_devolucao || new Date().toISOString().split('T')[0]
      })
      .eq('re_cod', id)
      .select()
      .single()

    if (error) throw error

    // Atualizar exemplar como disponível
    const { error: updateError } = await supabaseAdmin
      .from('livro_exemplar')
      .update({ lex_disponivel: true })
      .eq('lex_cod', requisicao.re_lex_cod)

    if (updateError) {
      console.error('Erro ao atualizar exemplar:', updateError)
      // Não falhar a operação, apenas logar o erro
    }

    return res.status(200).json({ data: requisicaoAtualizada })
  } catch (error) {
    console.error('Erro ao atualizar requisição:', error)
    return res.status(500).json({ error: error.message })
  }
}

/**
 * DELETE - Deletar requisição
 */
async function handleDelete(req, res) {
  const { id } = req.query

  try {
    if (!id) {
      return res.status(400).json({ error: 'ID da requisição é obrigatório' })
    }

    const { error } = await supabaseAdmin
      .from('requisicao')
      .delete()
      .eq('re_cod', id)

    if (error) throw error

    return res.status(200).json({ message: 'Requisição deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar requisição:', error)
    return res.status(500).json({ error: error.message })
  }
}