import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';

interface Emprestimo {
  re_cod: number;
  re_data_requisicao: string;
  utente: {
    ut_nome: string;
    ut_email?: string;
  };
  exemplar: {
    lex_cod: number;
    livro: {
      li_titulo: string;
      autor: {
        au_nome: string;
      };
    };
  };
}

export default function DevolucoesPage() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<number | null>(null);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEmprestimosAtivos = useCallback(async () => {
    try {
      setLoadingFetch(true);
      const response = await fetch('/api/requisicoes?status=ativo');
      const result = await response.json();

      if (response.ok) {
        setEmprestimos(result.data || []);
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar empréstimos' });
      }
    } catch (error) {
      console.error('Erro ao buscar empréstimos:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar empréstimos' });
    } finally {
      setLoadingFetch(false);
    }
  }, []);

  useEffect(() => {
    fetchEmprestimosAtivos();
  }, [fetchEmprestimosAtivos]);

  const handleDevolucao = async () => {
    if (!selectedEmprestimo) {
      setMessage({ type: 'error', text: 'Selecione um empréstimo' });
      return;
    }

    setLoadingSubmit(true);
    try {
      const response = await fetch(`/api/requisicoes/${selectedEmprestimo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ re_data_devolucao: new Date().toISOString().split('T')[0] }),
      });

      let result: any;
      try {
        result = await response.json();
      } catch {
        result = { error: 'Erro desconhecido' };
      }

      if (response.ok) {
        setMessage({ type: 'success', text: 'Devolução registrada com sucesso!' });
        setSelectedEmprestimo(null);
        fetchEmprestimosAtivos();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao registrar devolução' });
      }
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
      setMessage({ type: 'error', text: 'Erro ao registrar devolução' });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const formatDate = useCallback((date: string): string => {
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }, []);

  return (
    <Layout pageTitle="Registrar Devolução">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Registrar Devolução</h1>
          <p className="page-subtitle">Selecione o empréstimo para registrar a devolução</p>
        </div>
      </div>

      {message && (
        <div
          className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}
          role="alert"
        >
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Empréstimos Ativos</h5>
            </div>
            <div className="card-body">
              {loadingFetch ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : emprestimos.length === 0 ? (
                <p className="text-muted">Nenhum empréstimo ativo encontrado.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Selecionar</th>
                        <th>Utente</th>
                        <th>Livro</th>
                        <th>Autor</th>
                        <th>Data do Empréstimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emprestimos.map(({ re_cod, utente, exemplar, re_data_requisicao }) => (
                        <tr key={re_cod}>
                          <td>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="emprestimo"
                                id={`emprestimo-${re_cod}`}
                                value={re_cod}
                                checked={selectedEmprestimo === re_cod}
                                onChange={(e) => setSelectedEmprestimo(Number(e.target.value))}
                              />
                              <label htmlFor={`emprestimo-${re_cod}`} className="form-check-label visually-hidden">
                                Selecionar empréstimo {re_cod}
                              </label>
                            </div>
                          </td>
                          <td>
                            <strong>{utente.ut_nome}</strong>
                            {utente.ut_email && (
                              <>
                                <br />
                                <small className="text-muted">{utente.ut_email}</small>
                              </>
                            )}
                          </td>
                          <td>{exemplar.livro.li_titulo}</td>
                          <td>{exemplar.livro.autor.au_nome}</td>
                          <td>{formatDate(re_data_requisicao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {emprestimos.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="d-grid gap-2">
              <button
                className="btn btn-warning btn-lg"
                onClick={handleDevolucao}
                disabled={loadingSubmit || !selectedEmprestimo}
              >
                {loadingSubmit ? 'Registrando...' : 'Registrar Devolução'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
