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
    console.log('=== Iniciando aprovação de reserva ===', { reservaId });
    
    // Buscar detalhes da reserva (incluindo status)
    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from('reserva')
      .select('res_cod, res_ut_cod, res_li_cod, res_status')
      .eq('res_cod', reservaId)
      .single();

    if (reservaError || !reserva) {
      console.error('Erro ao buscar reserva:', reservaError);
      return res.status(404).json({ error: 'Reserva não encontrada', details: reservaError?.message });
    }

    console.log('Reserva encontrada:', { 
      cod: reserva.res_cod, 
      utente: reserva.res_ut_cod, 
      livro: reserva.res_li_cod,
      status: reserva.res_status 
    });

    // Verificar se reserva já foi processada
    if (reserva.res_status !== 'pendente') {
      console.error('Reserva já foi processada:', reserva.res_status);
      return res.status(400).json({ error: 'Esta reserva já foi processada', status: reserva.res_status });
    }

    // Buscar TODOS os exemplares do livro (não apenas os marcados como disponíveis)
    // Isso evita problemas de inconsistência no banco de dados
    const { data: todosExemplares, error: exemplarError } = await supabaseAdmin
      .from('livro_exemplar')
      .select('lex_cod')
      .eq('lex_li_cod', reserva.res_li_cod);

    if (exemplarError) {
      console.error('Erro ao buscar exemplares:', exemplarError);
      return res.status(500).json({ error: 'Erro ao buscar exemplares' });
    }

    if (!todosExemplares || todosExemplares.length === 0) {
      console.error('Nenhum exemplar encontrado para o livro:', reserva.res_li_cod);
      return res.status(400).json({ error: 'Nenhum exemplar encontrado para este livro' });
    }

    // Buscar TODOS os empréstimos ativos para esses exemplares
    const exemplaresIds = todosExemplares.map(e => Number(e.lex_cod)).filter(id => !isNaN(id));
    
    console.log('Verificando disponibilidade:', {
      reservaId,
      livroCod: reserva.res_li_cod,
      totalExemplares: todosExemplares.length,
      exemplaresIds,
      qtdExemplares: exemplaresIds.length
    });

    let emprestadosIds: number[] = [];
    let emprestimosAtivosDetalhes: any[] = [];
    const emprestimosPorExemplar = new Map(); // Declarar fora do if para estar no escopo correto
    
    // Buscar empréstimos ativos (sem data de devolução)
    // IMPORTANTE: Verificar se há empréstimos ativos para esses exemplares
    if (exemplaresIds.length > 0) {
      // Buscar todos os empréstimos desses exemplares primeiro para debug
      const { data: todosEmprestimos, error: todosEmprestimosError } = await supabaseAdmin
        .from('requisicao')
        .select('re_lex_cod, re_data_devolucao')
        .in('re_lex_cod', exemplaresIds);
      
      console.log('Todos os empréstimos dos exemplares:', {
        total: todosEmprestimos?.length || 0,
        emprestimos: todosEmprestimos
      });
      
      // Buscar todos os empréstimos desses exemplares ordenados por data (mais recente primeiro)
      // IMPORTANTE: Pode haver múltiplos registros de empréstimo para o mesmo exemplar
      // Vamos buscar todos e filtrar para pegar apenas o mais recente de cada exemplar que está realmente ativo
      const { data: todosEmprestimosExemplares, error: emprestimoError } = await supabaseAdmin
        .from('requisicao')
        .select('re_cod, re_lex_cod, re_data_devolucao, re_data_requisicao')
        .in('re_lex_cod', exemplaresIds)
        .order('re_data_requisicao', { ascending: false });
      
      if (emprestimoError) {
        console.error('Erro ao verificar empréstimos ativos:', emprestimoError);
        return res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
      }
      
      // Filtrar: pegar apenas o empréstimo mais recente de cada exemplar que NÃO tem data de devolução
      // Isso evita problemas de múltiplos registros ou empréstimos antigos não devolvidos
      (todosEmprestimosExemplares || []).forEach(emp => {
        const exemplarId = Number(emp.re_lex_cod);
        if (!emprestimosPorExemplar.has(exemplarId)) {
          // Se não tem data de devolução, está ativo
          if (!emp.re_data_devolucao) {
            emprestimosPorExemplar.set(exemplarId, emp);
          }
        }
      });
      
      console.log('Empréstimos por exemplar (mais recente sem devolução):', {
        total: emprestimosPorExemplar.size,
        emprestimos: Array.from(emprestimosPorExemplar.entries()).map(([id, emp]) => ({
          exemplar: id,
          dataRequisicao: emp.re_data_requisicao,
          dataDevolucao: emp.re_data_devolucao
        }))
      });
      
      // Converter para array
      const emprestimosAtivos = Array.from(emprestimosPorExemplar.values());

      // Guardar detalhes para debug
      emprestimosAtivosDetalhes = emprestimosAtivos || [];

      // Converter IDs de empréstimos ativos para números
      emprestadosIds = emprestimosAtivosDetalhes.map(e => {
        const id = Number(e.re_lex_cod);
        if (isNaN(id)) {
          console.warn('ID de empréstimo inválido:', e.re_lex_cod);
          return null;
        }
        return id;
      }).filter((id): id is number => id !== null);
    }
    
    console.log('Empréstimos ativos encontrados:', {
      qtdEmprestimos: emprestadosIds.length,
      emprestadosIds
    });
    
    // Buscar exemplares marcados como disponíveis
    // IMPORTANTE: Se um exemplar está marcado como disponível, confiamos nisso
    // Mesmo que haja registros antigos de empréstimo sem data de devolução
    const { data: exemplaresMarcadosDisponiveis, error: marcadosError } = await supabaseAdmin
      .from('livro_exemplar')
      .select('lex_cod, lex_disponivel')
      .eq('lex_li_cod', reserva.res_li_cod)
      .eq('lex_disponivel', true);
    
    const exemplaresMarcadosIds = (exemplaresMarcadosDisponiveis || []).map(e => Number(e.lex_cod));
    console.log('Exemplares marcados como disponíveis no banco:', exemplaresMarcadosIds);
    
    // Encontrar um exemplar disponível
    // ESTRATÉGIA: Se um exemplar está marcado como disponível, usamos ele
    // mesmo que haja registros antigos de empréstimo sem devolução (inconsistência no banco)
    let exemplarDisponivel = null;
    
    // Primeiro: verificar exemplares marcados como disponíveis
    // Se estão marcados como disponíveis, confiamos nisso e usamos eles
    for (const exemplar of todosExemplares) {
      const exemplarId = Number(exemplar.lex_cod);
      if (isNaN(exemplarId)) {
        console.warn('ID de exemplar inválido:', exemplar.lex_cod);
        continue;
      }
      
      // Se está marcado como disponível, usar mesmo que tenha registro antigo de empréstimo
      // Isso corrige inconsistências automaticamente
      if (exemplaresMarcadosIds.includes(exemplarId)) {
        exemplarDisponivel = exemplar;
        console.log('Exemplar disponível encontrado (marcado como disponível):', exemplarId);
        
        // Se há empréstimo antigo sem devolução, vamos corrigir isso
        if (emprestadosIds.includes(exemplarId)) {
          console.warn('⚠️ INCONSISTÊNCIA DETECTADA: Exemplar', exemplarId, 'está marcado como disponível mas tem empréstimo ativo');
          console.log('Corrigindo inconsistência: marcando o empréstimo mais recente como devolvido...');
          
          // Buscar o empréstimo mais recente desse exemplar
          const emprestimoParaCorrigir = emprestimosPorExemplar.get(exemplarId);
          if (emprestimoParaCorrigir) {
            try {
              // Atualizar a data de devolução para hoje
              const hoje = new Date().toISOString().split('T')[0];
              const { error: updateError } = await supabaseAdmin
                .from('requisicao')
                .update({ re_data_devolucao: hoje })
                .eq('re_cod', emprestimoParaCorrigir.re_cod);
              
              if (updateError) {
                console.error('Erro ao corrigir inconsistência:', updateError);
                // Não bloquear o processo, apenas logar o erro
              } else {
                // Remover da lista de emprestados para que possa ser usado
                emprestadosIds = emprestadosIds.filter(id => id !== exemplarId);
                console.log('✓ Inconsistência corrigida: empréstimo marcado como devolvido');
              }
            } catch (error) {
              console.error('Erro ao corrigir inconsistência:', error);
              // Não bloquear o processo, continuar mesmo assim
            }
          }
        }
        
        break;
      }
    }
    
    // Se não encontrou exemplar marcado como disponível, procurar um que não está emprestado
    if (!exemplarDisponivel) {
      for (const exemplar of todosExemplares) {
        const exemplarId = Number(exemplar.lex_cod);
        if (isNaN(exemplarId)) {
          continue;
        }
        
        // Se o exemplar não está na lista de emprestados, ele está disponível
        if (!emprestadosIds.includes(exemplarId)) {
          exemplarDisponivel = exemplar;
          console.log('Exemplar disponível encontrado:', exemplarId);
          break;
        }
      }
    }

    if (!exemplarDisponivel) {
      console.error('=== ERRO: Nenhum exemplar disponível encontrado ===');
      console.error('Detalhes da verificação de disponibilidade:', {
        reservaId: reservaId,
        livroCod: reserva.res_li_cod,
        totalExemplares: todosExemplares.length,
        exemplaresIds: exemplaresIds,
        emprestimosAtivos: emprestadosIds.length,
        emprestadosIds: emprestadosIds
      });
      // Incluir informações detalhadas no erro para debug
      const detalhesEmprestimos = emprestimosAtivosDetalhes.map(e => ({
        exemplar: e.re_lex_cod,
        dataDevolucao: e.re_data_devolucao
      }));
      
      return res.status(400).json({ 
        error: 'Todos os exemplares estão emprestados',
        debug: {
          totalExemplares: todosExemplares.length,
          exemplaresIds: exemplaresIds,
          totalEmprestimosAtivos: emprestadosIds.length,
          emprestadosIds: emprestadosIds,
          detalhesEmprestimos: detalhesEmprestimos,
          livroCod: reserva.res_li_cod
        }
      });
    }

    // Verificação de empréstimos em atraso REMOVIDA
    // Permitir aprovar reservas mesmo que o utente tenha empréstimos em atraso
    // Apenas registrar no log para informação (opcional)
    const hoje = new Date().toISOString().split('T')[0];
    const { data: emprestimosAtraso, error: atrasoError } = await supabaseAdmin
      .from('requisicao')
      .select('re_cod, re_data_prevista')
      .eq('re_ut_cod', reserva.res_ut_cod)
      .is('re_data_devolucao', null)
      .lt('re_data_prevista', hoje);

    if (!atrasoError && emprestimosAtraso && emprestimosAtraso.length > 0) {
      console.log('⚠️ Utente possui empréstimos em atraso:', emprestimosAtraso.length, '(mas permitindo aprovação da reserva)');
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
