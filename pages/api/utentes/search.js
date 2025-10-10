/**
 * API Route para busca de utentes (autocomplete)
 * Substitui search_utentes.php do PHP original
 */

import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  // Configurar CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { q } = req.query

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(200).json([])
  }

  try {
    const searchTerm = q.trim()

    // Buscar utentes que correspondem ao termo de busca
    const { data: utentes, error } = await supabaseAdmin
      .from('utente')
      .select('ut_cod, ut_nome, ut_email, ut_tlm, ut_nif')
      .or(`ut_nome.ilike.%${searchTerm}%,ut_email.ilike.%${searchTerm}%,ut_nif.ilike.%${searchTerm}%`)
      .order('ut_nome')
      .limit(10)

    if (error) {
      console.error('Erro ao buscar utentes:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    res.status(200).json(utentes || [])

  } catch (error) {
    console.error('Erro na API de busca de utentes:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
