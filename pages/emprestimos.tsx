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
  const [utenteQuery, setUtenteQuery] = useState('');
  const [utenteResults, setUtenteResults] = useState<Utente[]>([]);
  const [cart, setCart] = useState<number[]>([]);
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
      const response = await fetch('/api/exemplares?disponivel=true&limit=all');
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

  const searchUtentes = async (q: string) => {
    if (!q || q.trim().length < 2) {
      setUtenteResults([]);
      return;
    }
    try {
      const resp = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await resp.json();
      setUtenteResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setUtenteResults([]);
    }
  };

  const addToCart = (lexCod: number) => {
    if (!cart.includes(lexCod)) {
      setCart([...cart, lexCod]);
    }
  };

  const removeFromCart = (lexCod: number) => {
    setCart(cart.filter(id => id !== lexCod));
  };

  const clearCart = () => setCart([]);

  const handleEmprestimo = async () => {
    if (!selectedUtente || cart.length === 0) {
      setMessage({ type: 'error', text: 'Selecione um usuário e adicione exemplares ao carrinho' });
      return;
    }

    setLoading(true);
    try {
      // Criar empréstimos em série para cada exemplar do carrinho
      for (const lexCod of cart) {
        const response = await fetch('/api/requisicoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            re_ut_cod: selectedUtente,
            re_lex_cod: lexCod,
            re_data_requisicao: new Date().toISOString().split('T')[0]
          })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar empréstimo');
        }
      }

      setMessage({ type: 'success', text: 'Empréstimos registrados com sucesso!' });
      setSelectedUtente(null);
      setSelectedExemplar(null);
      clearCart();
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
                <label htmlFor="utenteSearch" className="form-label">Buscar por NIF ou Email:</label>
                <input
                  id="utenteSearch"
                  className="form-control"
                  placeholder="Digite NIF, email ou nome"
                  value={utenteQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setUtenteQuery(q);
                    searchUtentes(q);
                  }}
                />
                {utenteResults.length > 0 && (
                  <div className="list-group mt-2">
                    {utenteResults.map((u) => (
                      <button
                        key={u.ut_cod}
                        type="button"
                        className={`list-group-item list-group-item-action ${selectedUtente === u.ut_cod ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedUtente(u.ut_cod);
                          setUtenteQuery(`${u.ut_nome}${u.ut_email ? ' (' + u.ut_email + ')' : ''}`);
                          setUtenteResults([]);
                        }}
                      >
                        {u.ut_nome} {u.ut_email ? `(${u.ut_email})` : ''}
                      </button>
                    ))}
                  </div>
                )}
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
              <button
                className="btn btn-outline-primary"
                disabled={!selectedExemplar}
                onClick={() => selectedExemplar && addToCart(selectedExemplar)}
              >
                Adicionar ao carrinho
              </button>
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
              disabled={loading || !selectedUtente || cart.length === 0}
            >
              {loading ? 'Registrando...' : 'Finalizar Empréstimos'}
            </button>
          </div>
        </div>
      </div>

      {/* Carrinho */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Lista de Empréstimos (Carrinho)</h5>
            </div>
            <div className="card-body">
              {cart.length === 0 ? (
                <div className="text-muted">Nenhum exemplar no carrinho.</div>
              ) : (
                <ul className="list-group">
                  {cart.map((lex) => (
                    <li key={lex} className="list-group-item d-flex justify-content-between align-items-center">
                      Exemplar #{lex}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => removeFromCart(lex)}>Remover</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
