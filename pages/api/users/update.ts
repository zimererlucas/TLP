/**
 * API Route para atualizar usuários
 * Substitui a funcionalidade de edição de usuários do utentes.php
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, isValidEmail } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { utente_id, ut_nome, ut_email, ut_tlm, ut_morada, ut_cod_postal } = req.body;

  if (!utente_id) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

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
    // Verificar se usuário existe
    const { data: existingUser } = await supabaseAdmin
      .from('utente')
      .select('ut_cod')
      .eq('ut_cod', utente_id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se email já existe em outro usuário (se fornecido)
    if (ut_email) {
      const { data: emailExists } = await supabaseAdmin
        .from('utente')
        .select('ut_cod')
        .eq('ut_email', ut_email)
        .neq('ut_cod', utente_id)
        .single();

      if (emailExists) {
        return res.status(400).json({ error: 'Este email já está cadastrado' });
      }
    }

    // Atualizar utente
    const { data: utenteAtualizado, error } = await supabaseAdmin
      .from('utente')
      .update({
        ut_nome: ut_nome.trim(),
        ut_email: ut_email?.trim() || null,
        ut_tlm: ut_tlm?.trim() || null,
        ut_morada: ut_morada?.trim() || null,
        ut_cod_postal: ut_cod_postal || null
      })
      .eq('ut_cod', utente_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar utente:', error);
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }

    res.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso!',
      data: utenteAtualizado
    });

  } catch (error) {
    console.error('Erro na API de atualização de usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
