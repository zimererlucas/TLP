/**
 * API Route para criar usuários
 * Substitui a funcionalidade de criação de usuários do utentes.php
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, isValidEmail } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { ut_nome, ut_email, ut_tlm, ut_morada, ut_cod_postal } = req.body;

  // Validações
  const errors: string[] = [];
  if (!ut_nome || ut_nome.trim().length === 0) {
    errors.push('Nome é obrigatório');
  }
  if (ut_email && !isValidEmail(ut_email)) {
    errors.push('Email inválido');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    // Verificar se email já existe (se fornecido)
    if (ut_email) {
      const { data: existingUser } = await supabaseAdmin
        .from('utente')
        .select('ut_cod')
        .eq('ut_email', ut_email)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Este email já está cadastrado' });
      }
    }

    // Inserir novo utente
    const { data: novoUtente, error } = await supabaseAdmin
      .from('utente')
      .insert({
        ut_nome: ut_nome.trim(),
        ut_email: ut_email?.trim() || null,
        ut_tlm: ut_tlm?.trim() || null,
        ut_morada: ut_morada?.trim() || null,
        ut_cod_postal: ut_cod_postal || null
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir utente:', error);
      return res.status(500).json({ error: 'Erro ao adicionar usuário' });
    }

    res.status(201).json({
      success: true,
      message: 'Usuário adicionado com sucesso!',
      data: novoUtente
    });

  } catch (error) {
    console.error('Erro na API de criação de usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
