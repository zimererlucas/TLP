import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface Emprestimo {
  re_cod: number;
  re_data_requisicao: string;
  utente: {
    ut_cod: number;
    ut_nome: string;
    ut_email?: string;
    ut_nif?: string;
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

interface Reserva {
  res_cod: number;
  res_data: string;
  utente: {
    ut_cod: number;
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
  const [filteredEmprestimos, setFilteredEmprestimos] = useState<Emprestimo[]>([]);
  const [selectedEmprestimos, setSelectedEmprestimos] = useState<number[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        setFilteredEmprestimos(result.data || []);
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

  const fetchReservasPendentes = useCallback(async () => {
    try {
      console.log('Buscando reservas pendentes...');
      // Como a tabela 'reserva' não existe no schema atual, vamos buscar da tabela 'requisicao'
      // que é a tabela de empréstimos/requisições
      const { data, error } = await supabase
        .from('requisicao')
        .select(`
          re_cod,
          re_data_requisicao,
          utente!re_ut_cod (
            ut_cod,
            ut_nome,
            ut_email
          ),
          exemplar!re_lex_cod (
            lex_cod,
            livro!lex_li_cod (
              li_titulo,
              autor!li_autor (
                au_nome
              )
            )
          )
        `)
        .is('re_data_devolucao', null); // Empréstimos ativos (sem devolução)

      if (error) {
        console.error('Erro ao buscar empréstimos ativos:', error);
      } else {
        console.log('Fetched empréstimos ativos:', data);
        console.log('Número de empréstimos ativos encontrados:', data?.length || 0);
        // Transformar os dados para o formato esperado pela interface Reserva
        const reservasTransformadas = (data || []).map(item => ({
          res_cod: item.re_cod,
          res_data: item.re_data_requisicao,
          utente: item.utente,
          exemplar: item.exemplar
        })) as unknown as Reserva[];
        setReservas(reservasTransformadas);
      }
    } catch (error) {
      console.error('Erro ao buscar empréstimos ativos:', error);
    }
  }, []);

  useEffect(() => {
    fetchEmprestimosAtivos();
    fetchReservasPendentes();

    // Escuta novas requisições (empréstimos)
    const channel = supabase
      .channel('requisicoes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'requisicao'
      }, (payload) => {
        console.log('Nova requisição:', payload.new);
        // Atualizar empréstimos ativos
        fetchReservasPendentes();
        // Mostrar notificação de sucesso
        setMessage({ type: 'success', text: 'Nova requisição registrada! Verifique os empréstimos ativos.' });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmprestimosAtivos, fetchReservasPendentes]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmprestimos(emprestimos);
    } else {
      const filtered = emprestimos.filter(emprestimo =>
        emprestimo.utente.ut_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emprestimo.utente.ut_email && emprestimo.utente.ut_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emprestimo.utente.ut_nif && emprestimo.utente.ut_nif.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEmprestimos(filtered);
    }
  }, [searchTerm, emprestimos]);

  const handleDevolucao = async () => {
    if (selectedEmprestimos.length === 0) {
      setMessage({ type: 'error', text: 'Selecione pelo menos um empréstimo' });
      return;
    }

    setLoadingSubmit(true);
    try {
      const promises = selectedEmprestimos.map(async (emprestimoId) => {
        const response = await fetch(`/api/requisicoes/${emprestimoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ re_data_devolucao: new Date().toISOString().split('T')[0] }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(result.error || 'Erro ao registrar devolução');
        }

        return response;
      });

      await Promise.all(promises);

      setMessage({ type: 'success', text: `${selectedEmprestimos.length} devolução(ões) registrada(s) com sucesso!` });
      setSelectedEmprestimos([]);
      fetchEmprestimosAtivos();
    } catch (error) {
      console.error('Erro ao registrar devoluções:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao registrar devoluções' });
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
          <p className="page-subtitle">Selecione os empréstimos para registrar as devoluções</p>
        </div>
      </div>

      {reservas.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info alert-dismissible fade show" role="alert">
              <strong>Reservas Pendentes:</strong> Há {reservas.length} reserva(s) aguardando aprovação.
              <button type="button" className="btn-close" onClick={() => setReservas([])}></button>
            </div>
          </div>
        </div>
      )}

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
              <div className="d-flex justify-content-between align-items-center">
                <h5>Empréstimos Ativos</h5>
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nome, email ou NIF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                    disabled={!searchTerm}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loadingFetch ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : filteredEmprestimos.length === 0 ? (
                <p className="text-muted">
                  {emprestimos.length === 0 ? 'Nenhum empréstimo ativo encontrado.' : 'Nenhum empréstimo encontrado para a busca.'}
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Selecionar Todos<br /><input type="checkbox" onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmprestimos(filteredEmprestimos.map(emp => emp.re_cod));
                          } else {
                            setSelectedEmprestimos([]);
                          }
                        }} /></th>
                        <th>Utente</th>
                        <th>Livro</th>
                        <th>Autor</th>
                        <th>Data do Empréstimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmprestimos.map(({ re_cod, utente, exemplar, re_data_requisicao }) => (
                        <tr key={re_cod}>
                          <td>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                name="emprestimo"
                                id={`emprestimo-${re_cod}`}
                                value={re_cod}
                                checked={selectedEmprestimos.includes(re_cod)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEmprestimos([...selectedEmprestimos, re_cod]);
                                  } else {
                                    setSelectedEmprestimos(selectedEmprestimos.filter(id => id !== re_cod));
                                  }
                                }}
                              />
                              <label htmlFor={`emprestimo-${re_cod}`} className="form-check-label visually-hidden">
                                Selecionar empréstimo {re_cod}
                              </label>
                            </div>
                          </td>
                          <td>
                            <strong>{utente.ut_nome}</strong>
                            {utente.ut_nif && (
                              <>
                                <br />
                                <small className="text-muted">NIF: {utente.ut_nif}</small>
                              </>
                            )}
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
                disabled={loadingSubmit || selectedEmprestimos.length === 0}
              >
                {loadingSubmit ? 'Registrando...' : `Registrar ${selectedEmprestimos.length > 0 ? selectedEmprestimos.length : ''} Devolução${selectedEmprestimos.length !== 1 ? 'ões' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
