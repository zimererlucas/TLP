/**
 * API Route para registrar devoluções
 * Substitui a funcionalidade de devolução do devolucoes.php
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { emprestimo_id } = req.body;

  if (!emprestimo_id) {
    return res.status(400).json({ error: 'ID do empréstimo é obrigatório' });
  }

  try {
    // Buscar informações do empréstimo
    const { data: emprestimo, error: emprestimoError } = await supabaseAdmin
      .from('requisicao')
      .select(`
        re_cod,
        re_lex_cod,
        re_data_devolucao
      `)
      .eq('re_cod', emprestimo_id)
      .is('re_data_devolucao', null)
      .single();

    if (emprestimoError || !emprestimo) {
      return res.status(404).json({ error: 'Empréstimo não encontrado ou já devolvido' });
    }

    const dataDevolucao = new Date().toISOString().split('T')[0];

    // Atualizar requisição com data de devolução
    const { error: requisicaoError } = await supabaseAdmin
      .from('requisicao')
      .update({ re_data_devolucao: dataDevolucao })
      .eq('re_cod', emprestimo_id);

    if (requisicaoError) {
      console.error('Erro ao atualizar requisição:', requisicaoError);
      return res.status(500).json({ error: 'Erro ao registrar devolução' });
    }

    // Atualizar exemplar como disponível
    const { error: exemplarError } = await supabaseAdmin
      .from('livro_exemplar')
      .update({ lex_disponivel: true })
      .eq('lex_cod', emprestimo.re_lex_cod);

    if (exemplarError) {
      console.error('Erro ao atualizar exemplar:', exemplarError);
      // Tentar reverter a requisição
      await supabaseAdmin
        .from('requisicao')
        .update({ re_data_devolucao: null })
        .eq('re_cod', emprestimo_id);
      
      return res.status(500).json({ error: 'Erro ao registrar devolução' });
    }

    res.status(200).json({
      success: true,
      message: 'Devolução registrada com sucesso!',
      data: {
        emprestimo_id,
        data_devolucao: dataDevolucao,
        data_devolucao_formatada: new Date(dataDevolucao).toLocaleDateString('pt-BR')
      }
    });

  } catch (error) {
    console.error('Erro na API de devolução:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
