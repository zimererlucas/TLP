/**
 * API Route dinâmica para operações em requisições individuais
 * Suporta PUT e DELETE em /api/requisicoes/:id
 */

import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'ID da requisição é obrigatório' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id)
      case 'PUT':
        return await handlePut(req, res, id)
      case 'DELETE':
        return await handleDelete(req, res, id)
      default:
        return res.status(405).json({ error: 'Método não permitido' })
    }
  } catch (error) {
    console.error('Erro na API de requisições:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

/**
 * GET - Buscar uma requisição específica
 */
async function handleGet(req, res, id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('requisicao')
      .select(`
        re_cod,
        re_data_requisicao,
        re_data_prevista,
        re_data_devolucao,
        utente:utente(
          ut_cod,
          ut_nome,
          ut_email
        ),
        exemplar:livro_exemplar(
          lex_cod,
          livro:livro(
            li_cod,
            li_titulo,
            autor:autor(au_nome)
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

    return res.status(200).json({ data })
  } catch (error) {
    console.error('Erro ao buscar requisição:', error)
    return res.status(500).json({ error: 'Erro ao buscar requisição' })
  }
}

/**
 * PUT - Atualizar requisição (principalmente para registrar devolução)
 */
async function handlePut(req, res, id) {
  const { re_data_devolucao } = req.body

  try {
    // Buscar a requisição para obter o exemplar
    const { data: requisicao, error: fetchError } = await supabaseAdmin
      .from('requisicao')
      .select('re_lex_cod, re_data_devolucao')
      .eq('re_cod', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Requisição não encontrada' })
      }
      throw fetchError
    }

    // Verificar se já foi devolvido
    if (requisicao.re_data_devolucao) {
      return res.status(400).json({ error: 'Esta requisição já foi devolvida' })
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

    return res.status(200).json({ 
      success: true,
      message: 'Devolução registrada com sucesso!',
      data: requisicaoAtualizada 
    })
  } catch (error) {
    console.error('Erro ao atualizar requisição:', error)
    return res.status(500).json({ error: 'Erro ao registrar devolução' })
  }
}

/**
 * DELETE - Deletar requisição
 */
async function handleDelete(req, res, id) {
  try {
    // Verificar se existe
    const { data: existing } = await supabaseAdmin
      .from('requisicao')
      .select('re_cod')
      .eq('re_cod', id)
      .single()

    if (!existing) {
      return res.status(404).json({ error: 'Requisição não encontrada' })
    }

    const { error } = await supabaseAdmin
      .from('requisicao')
      .delete()
      .eq('re_cod', id)

    if (error) throw error

    return res.status(200).json({ 
      success: true,
      message: 'Requisição deletada com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao deletar requisição:', error)
    return res.status(500).json({ error: 'Erro ao deletar requisição' })
  }
}

