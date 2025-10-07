/**
 * API Route para busca de livros
 * Substitui a funcionalidade de busca do livros.php
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { search, page = '1', limit = '10' } = req.query;

  if (!search || typeof search !== 'string') {
    return res.status(400).json({ error: 'Termo de busca é obrigatório' });
  }

  try {
    const currentPage = parseInt(page as string);
    const resultsPerPage = parseInt(limit as string);
    const offset = (currentPage - 1) * resultsPerPage;

    // Buscar livros com informações relacionadas
    const { data: livros, error: livrosError } = await supabaseAdmin
      .from('livro')
      .select(`
        *,
        autor:autor(au_nome),
        editora:editora(ed_nome),
        genero:genero(ge_genero),
        exemplares:livro_exemplar(
          lex_cod,
          lex_disponivel,
          lex_estado
        )
      `)
      .or(`li_titulo.ilike.%${search}%,autor.au_nome.ilike.%${search}%,li_isbn.ilike.%${search}%,editora.ed_nome.ilike.%${search}%,genero.ge_genero.ilike.%${search}%`)
      .order('li_titulo')
      .range(offset, offset + resultsPerPage - 1);

    if (livrosError) {
      console.error('Erro ao buscar livros:', livrosError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Contar total de resultados para paginação
    const { count, error: countError } = await supabaseAdmin
      .from('livro')
      .select('*', { count: 'exact', head: true })
      .or(`li_titulo.ilike.%${search}%,autor.au_nome.ilike.%${search}%,li_isbn.ilike.%${search}%,editora.ed_nome.ilike.%${search}%,genero.ge_genero.ilike.%${search}%`);

    if (countError) {
      console.error('Erro ao contar livros:', countError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Processar dados para incluir estatísticas de exemplares
    const livrosProcessados = livros?.map(livro => {
      const exemplares = livro.exemplares || [];
      const totalExemplares = exemplares.length;
      const exemplaresDisponiveis = exemplares.filter((ex: any) => ex.lex_disponivel).length;

      return {
        ...livro,
        total_exemplares: totalExemplares,
        exemplares_disponiveis: exemplaresDisponiveis,
        exemplares: undefined // Remover dados detalhados dos exemplares da resposta
      };
    }) || [];

    const totalPages = Math.ceil((count || 0) / resultsPerPage);

    res.status(200).json({
      livros: livrosProcessados,
      pagination: {
        currentPage,
        totalPages,
        totalResults: count || 0,
        resultsPerPage
      }
    });

  } catch (error) {
    console.error('Erro na API de busca de livros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
