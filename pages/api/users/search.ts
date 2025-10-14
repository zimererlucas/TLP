/**
 * API Route para busca de usuários
 * Substitui search_utentes.php do PHP original
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(200).json([]);
  }

  try {
    const searchTerm = q.trim();

    // Montar filtros dinamicamente para suportar NIF numérico (eq) e texto (ilike)
    const onlyDigits = searchTerm.replace(/\D/g, '');
    const nifFilter = onlyDigits.length > 0 && onlyDigits.length === searchTerm.length
      ? `ut_nif.eq.${onlyDigits}`
      : `ut_nif.ilike.%${searchTerm}%`;

    const orFilters = [
      `ut_nome.ilike.%${searchTerm}%`,
      `ut_email.ilike.%${searchTerm}%`,
      nifFilter,
    ].join(',');

    const { data: utentes, error } = await supabaseAdmin
      .from('utente')
      .select('ut_cod, ut_nome, ut_email, ut_tlm, ut_nif')
      .or(orFilters)
      .order('ut_nome')
      .limit(10);

    if (error) {
      console.error('Erro ao buscar utentes:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.status(200).json(utentes || []);

  } catch (error) {
    console.error('Erro na API de busca de usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
