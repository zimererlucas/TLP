/**
 * API Route para códigos postais
 * Gerencia códigos postais da biblioteca
 */

import { supabaseAdminAdmin } from '../../lib/supabaseAdminClient';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getCodigosPostais(req, res);
      case 'POST':
        return await createCodigoPostal(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API de códigos postais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function getCodigosPostais(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('codigo_postal')
      .select('*')
      .order('cod_localidade');

    if (error) throw error;

    res.status(200).json({ data });
  } catch (error) {
    console.error('Erro ao buscar códigos postais:', error);
    res.status(500).json({ error: error.message });
  }
}

async function createCodigoPostal(req, res) {
  try {
    const { cod_postal, cod_localidade } = req.body;

    if (!cod_postal || !cod_localidade) {
      return res.status(400).json({ error: 'Código postal e localidade são obrigatórios' });
    }

    const { data, error } = await supabaseAdmin
      .from('codigo_postal')
      .insert({
        cod_postal,
        cod_localidade
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch (error) {
    console.error('Erro ao criar código postal:', error);
    res.status(500).json({ error: error.message });
  }
}