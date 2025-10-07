/**
 * emprestimos.tsx - Página de gestão de empréstimos
 * Convertido de emprestimos.php para Next.js com Supabase
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface Utente {
  ut_cod: number;
  ut_nome: string;
  ut_email?: string;
}

interface Exemplar {
  lex_cod: number;
  lex_li_cod: number;
  livro: {
    li_titulo: string;
    autor: {
      au_nome: string;
    };
  };
}

export default function EmprestimosPage() {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [exemplares, setExemplares] = useState<Exemplar[]>([]);
  const [selectedUtente, setSelectedUtente] = useState<number | null>(null);
  const [selectedExemplar, setSelectedExemplar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUtentes();
    fetchExemplaresDisponiveis();
  }, []);

  const fetchUtentes = async () => {
    try {
      const { data, error } = await supabase
        .from('utente')
        .select('ut_cod, ut_nome, ut_email')
        .order('ut_nome');

      if (error) throw error;
      setUtentes(data || []);
    } catch (error) {
      console.error('Erro ao buscar utentes:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar utentes' });
    }
  };

  const fetchExemplaresDisponiveis = async () => {
    try {
      const response = await fetch('/api/exemplares?disponivel=true');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao carregar exemplares');
      }
      setExemplares(result.data || []);
    } catch (error) {
      console.error('Erro ao buscar exemplares:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar exemplares' });
    }
  };

  const handleEmprestimo = async () => {
    if (!selectedUtente || !selectedExemplar) {
      setMessage({ type: 'error', text: 'Selecione um usuário e um exemplar' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('requisicao')
        .insert({
          re_ut_cod: selectedUtente,
          re_lex_cod: selectedExemplar,
          re_data_requisicao: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      // Atualizar exemplar como indisponível
      await supabase
        .from('livro_exemplar')
        .update({ lex_disponivel: false })
        .eq('lex_cod', selectedExemplar);

      setMessage({ type: 'success', text: 'Empréstimo registrado com sucesso!' });
      setSelectedUtente(null);
      setSelectedExemplar(null);
      fetchExemplaresDisponiveis();
    } catch (error) {
      console.error('Erro ao registrar empréstimo:', error);
      setMessage({ type: 'error', text: 'Erro ao registrar empréstimo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageTitle="Registrar Empréstimo">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Registrar Empréstimo</h1>
          <p className="page-subtitle">Selecione o usuário e o exemplar para registrar o empréstimo</p>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Selecionar Usuário</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="utente" className="form-label">Usuário:</label>
                <select
                  id="utente"
                  className="form-select"
                  value={selectedUtente || ''}
                  onChange={(e) => setSelectedUtente(Number(e.target.value) || null)}
                >
                  <option value="">Selecione um usuário</option>
                  {utentes.map((utente) => (
                    <option key={utente.ut_cod} value={utente.ut_cod}>
                      {utente.ut_nome} {utente.ut_email && `(${utente.ut_email})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Selecionar Exemplar</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="exemplar" className="form-label">Exemplar:</label>
                <select
                  id="exemplar"
                  className="form-select"
                  value={selectedExemplar || ''}
                  onChange={(e) => setSelectedExemplar(Number(e.target.value) || null)}
                >
                  <option value="">Selecione um exemplar</option>
                  {exemplares.map((exemplar) => (
                    <option key={exemplar.lex_cod} value={exemplar.lex_cod}>
                      {exemplar.livro.li_titulo} - {exemplar.livro.autor.au_nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="d-grid gap-2">
            <button
              className="btn btn-success btn-lg"
              onClick={handleEmprestimo}
              disabled={loading || !selectedUtente || !selectedExemplar}
            >
              {loading ? 'Registrando...' : 'Registrar Empréstimo'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
