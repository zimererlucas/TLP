/**
 * API Route para aprovar reserva e criar empréstimo automaticamente
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;
  const reservaId = parseInt(id as string);

  if (!reservaId || isNaN(reservaId)) {
    return res.status(400).json({ error: 'ID da reserva inválido' });
  }

  try {
    // Buscar detalhes da reserva
    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from('reserva')
      .select('res_cod, res_ut_cod, res_li_cod')
      .eq('res_cod', reservaId)
      .single();

    if (reservaError || !reserva) {
      console.error('Erro ao buscar reserva:', reservaError);
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    // Verificar se reserva já foi processada
    const { data: reservaStatus, error: statusError } = await supabaseAdmin
      .from('reserva')
      .select('res_status')
      .eq('res_cod', reservaId)
      .single();

    if (statusError) {
      console.error('Erro ao verificar status da reserva:', statusError);
      return res.status(500).json({ error: 'Erro ao verificar reserva' });
    }

    if (reservaStatus.res_status !== 'pendente') {
      return res.status(400).json({ error: 'Esta reserva já foi processada' });
    }

    // Buscar exemplares disponíveis para o livro
    const { data: exemplares, error: exemplarError } = await supabaseAdmin
      .from('livro_exemplar')
      .select('lex_cod')
      .eq('lex_li_cod', reserva.res_li_cod)
      .eq('lex_disponivel', true);

    if (exemplarError || !exemplares || exemplares.length === 0) {
      console.error('Erro ao buscar exemplares:', exemplarError);
      return res.status(400).json({ error: 'Nenhum exemplar disponível para este livro' });
    }

    // Verificar quais exemplares estão disponíveis (não emprestados)
    const exemplaresIds = exemplares.map(e => e.lex_cod);
    const { data: emprestimosAtivos, error: emprestimoError } = await supabaseAdmin
      .from('requisicao')
      .select('re_lex_cod')
      .in('re_lex_cod', exemplaresIds)
      .is('re_data_devolucao', null);

    if (emprestimoError) {
      console.error('Erro ao verificar empréstimos ativos:', emprestimoError);
      return res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
    }

    const emprestadosIds = emprestimosAtivos?.map(e => e.re_lex_cod) || [];
    const exemplarDisponivel = exemplares.find(e => !emprestadosIds.includes(e.lex_cod));

    if (!exemplarDisponivel) {
      return res.status(400).json({ error: 'Todos os exemplares estão emprestados' });
    }

    // Verificar se utente tem empréstimos em atraso
    const hoje = new Date().toISOString().split('T')[0];
    const { data: emprestimosAtraso, error: atrasoError } = await supabaseAdmin
      .from('requisicao')
      .select('re_cod, re_data_prevista')
      .eq('re_ut_cod', reserva.res_ut_cod)
      .is('re_data_devolucao', null)
      .lt('re_data_prevista', hoje);

    if (atrasoError) {
      console.error('Erro ao verificar empréstimos em atraso:', atrasoError);
      return res.status(500).json({ error: 'Erro ao verificar situação do utente' });
    }

    if (emprestimosAtraso && emprestimosAtraso.length > 0) {
      return res.status(400).json({ error: 'Este utente possui empréstimos em atraso' });
    }

    // Criar empréstimo ativo com data prevista (14 dias)
    const dataPrevista = new Date();
    dataPrevista.setDate(dataPrevista.getDate() + 14);

    const { error: createError } = await supabaseAdmin
      .from('requisicao')
      .insert({
        re_ut_cod: reserva.res_ut_cod,
        re_lex_cod: exemplarDisponivel.lex_cod,
        re_data_requisicao: new Date().toISOString().split('T')[0],
        re_data_prevista: dataPrevista.toISOString().split('T')[0]
      });

    if (createError) {
      console.error('Erro ao criar empréstimo:', createError);
      return res.status(500).json({ error: 'Erro ao criar empréstimo' });
    }

    // Atualizar exemplar como indisponível
    const { error: updateExemplarError } = await supabaseAdmin
      .from('livro_exemplar')
      .update({ lex_disponivel: false })
      .eq('lex_cod', exemplarDisponivel.lex_cod);

    if (updateExemplarError) {
      console.error('Erro ao atualizar exemplar:', updateExemplarError);
      // Tentar reverter a requisição
      await supabaseAdmin
        .from('requisicao')
        .delete()
        .eq('re_lex_cod', exemplarDisponivel.lex_cod)
        .eq('re_ut_cod', reserva.res_ut_cod)
        .is('re_data_devolucao', null);
      return res.status(500).json({ error: 'Erro ao atualizar exemplar' });
    }

    // Atualizar status da reserva
    const { error: updateError } = await supabaseAdmin
      .from('reserva')
      .update({ res_status: 'aprovada' })
      .eq('res_cod', reservaId);

    if (updateError) {
      console.error('Erro ao aprovar reserva:', updateError);
      // Tentar reverter as mudanças
      await supabaseAdmin
        .from('requisicao')
        .delete()
        .eq('re_lex_cod', exemplarDisponivel.lex_cod)
        .eq('re_ut_cod', reserva.res_ut_cod)
        .is('re_data_devolucao', null);
      await supabaseAdmin
        .from('livro_exemplar')
        .update({ lex_disponivel: true })
        .eq('lex_cod', exemplarDisponivel.lex_cod);
      return res.status(500).json({ error: 'Erro ao aprovar reserva' });
    }

    res.status(200).json({
      success: true,
      message: 'Reserva aprovada e empréstimo criado com sucesso!'
    });

  } catch (error) {
    console.error('Erro na API de aprovação de reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
