/**
 * API Route para criar empréstimos
 * Substitui a funcionalidade de empréstimo do emprestimos.php
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, calculateDueDate, hasOverdueLoans, isExemplarDisponivel } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { utente_id, exemplar_id, dias_emprestimo = 14 } = req.body;

  if (!utente_id || !exemplar_id) {
    return res.status(400).json({ error: 'ID do usuário e exemplar são obrigatórios' });
  }

  try {
    // Verificar se exemplar está disponível
    const exemplarDisponivel = await isExemplarDisponivel(exemplar_id);
    if (!exemplarDisponivel) {
      return res.status(400).json({ error: 'Este exemplar não está disponível para empréstimo' });
    }

    // Verificar se utente tem empréstimos em atraso
    const temEmprestimosAtraso = await hasOverdueLoans(utente_id);
    if (temEmprestimosAtraso) {
      return res.status(400).json({ error: 'Este usuário possui empréstimos em atraso e não pode fazer novos empréstimos' });
    }

    // Calcular datas
    const dataRequisicao = new Date().toISOString().split('T')[0];
    const dataPrevista = calculateDueDate(dias_emprestimo);

    // Inserir requisição
    const { data: requisicao, error: requisicaoError } = await supabaseAdmin
      .from('requisicao')
      .insert({
        re_ut_cod: utente_id,
        re_lex_cod: exemplar_id,
        re_data_requisicao: dataRequisicao,
        re_data_prevista: dataPrevista
      })
      .select()
      .single();

    if (requisicaoError) {
      console.error('Erro ao inserir requisição:', requisicaoError);
      return res.status(500).json({ error: 'Erro ao registrar empréstimo' });
    }

    // Atualizar exemplar como indisponível
    const { error: exemplarError } = await supabaseAdmin
      .from('livro_exemplar')
      .update({ lex_disponivel: false })
      .eq('lex_cod', exemplar_id);

    if (exemplarError) {
      console.error('Erro ao atualizar exemplar:', exemplarError);
      // Tentar reverter a requisição
      await supabaseAdmin
        .from('requisicao')
        .delete()
        .eq('re_cod', requisicao.re_cod);
      
      return res.status(500).json({ error: 'Erro ao registrar empréstimo' });
    }

    res.status(201).json({
      success: true,
      message: 'Empréstimo registrado com sucesso!',
      data: {
        ...requisicao,
        data_prevista_formatada: new Date(dataPrevista).toLocaleDateString('pt-BR')
      }
    });

  } catch (error) {
    console.error('Erro na API de empréstimo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
