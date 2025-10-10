/**
 * livro/[id].tsx - Página de detalhes do livro
 * Convertido de livro_ver.php para Next.js com Supabase
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase, formatDate, calculateDueDate } from '../../lib/supabase';

interface LivroDetalhes {
  li_cod: number;
  li_titulo: string;
  li_isbn?: string;
  li_ano?: number;
  li_descricao?: string;
  autor?: { au_nome: string };
  editora?: { ed_nome: string };
  genero?: { ge_genero: string };
}

interface Exemplar {
  lex_cod: number;
  lex_estado?: string;
  lex_disponivel: boolean;
  re_data_requisicao?: string;
  re_data_prevista?: string;
  ut_nome?: string;
}

interface EmprestimoForm {
  exemplar_id: string;
  utente_id: string;
  utente_nome: string;
}

export default function LivroDetalhesPage() {
  const router = useRouter();
  const { id } = router.query;
  const [livro, setLivro] = useState<LivroDetalhes | null>(null);
  const [exemplares, setExemplares] = useState<Exemplar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emprestimoForm, setEmprestimoForm] = useState<EmprestimoForm>({
    exemplar_id: '',
    utente_id: '',
    utente_nome: ''
  });
  const [showEmprestimoModal, setShowEmprestimoModal] = useState(false);
  const [emprestimoLoading, setEmprestimoLoading] = useState(false);
  const [emprestimoError, setEmprestimoError] = useState('');

  useEffect(() => {
    if (id) {
      fetchLivroDetalhes(id as string);
    }
  }, [id]);

  const fetchLivroDetalhes = async (livroId: string) => {
    try {
      setLoading(true);
      setError('');

      // Buscar informações do livro
      const { data: livroData, error: livroError } = await supabase
        .from('livro')
        .select(`
          *,
          autor:autor(au_nome),
          editora:editora(ed_nome),
          genero:genero(ge_genero)
        `)
        .eq('li_cod', livroId)
        .single();

      if (livroError || !livroData) {
        throw new Error('Livro não encontrado');
      }

      setLivro(livroData);

      // Buscar exemplares via API (já traz status de empréstimo ativo)
      const respEx = await fetch(`/api/exemplares?livro=${encodeURIComponent(livroId)}&limit=all`);
      if (!respEx.ok) throw new Error('Erro ao buscar exemplares');
      const jsonEx = await respEx.json();
      const exemplaresData = (jsonEx?.data || []) as any[];
      const adaptados: Exemplar[] = exemplaresData.map((ex: any) => ({
        lex_cod: ex.lex_cod,
        lex_estado: ex.lex_estado,
        lex_disponivel: Boolean(ex.lex_disponivel),
        re_data_requisicao: ex.re_data_requisicao || undefined,
        re_data_prevista: ex.re_data_prevista || undefined,
        ut_nome: ex.ut_nome || undefined,
      }));
      setExemplares(adaptados);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar livro');
    } finally {
      setLoading(false);
    }
  };

  const handleEmprestimo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emprestimoForm.exemplar_id || !emprestimoForm.utente_id) {
      setEmprestimoError('Por favor, selecione um exemplar e um usuário');
      return;
    }

    setEmprestimoLoading(true);
    setEmprestimoError('');

    try {
      const response = await fetch('/api/loans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          utente_id: parseInt(emprestimoForm.utente_id),
          exemplar_id: parseInt(emprestimoForm.exemplar_id),
          dias_emprestimo: 14
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar empréstimo');
      }

      // Recarregar dados da página
      await fetchLivroDetalhes(id as string);
      setShowEmprestimoModal(false);
      setEmprestimoForm({ exemplar_id: '', utente_id: '', utente_nome: '' });

      // Mostrar mensagem de sucesso
      alert('Empréstimo registrado com sucesso!');

    } catch (err) {
      setEmprestimoError(err instanceof Error ? err.message : 'Erro ao registrar empréstimo');
    } finally {
      setEmprestimoLoading(false);
    }
  };

  const searchUtentes = async (query: string) => {
    if (query.length < 2) return [];

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  const exemplaresDisponiveis = exemplares.filter(ex => ex.lex_disponivel);
  const exemplaresEmprestados = exemplares.filter(ex => !ex.lex_disponivel);

  if (loading) {
    return (
      <Layout pageTitle="Carregando...">
        <div className="text-center">
          <div className="loading"></div>
          <p>Carregando detalhes do livro...</p>
        </div>
      </Layout>
    );
  }

  if (error || !livro) {
    return (
      <Layout pageTitle="Erro">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error || 'Livro não encontrado'}
        </div>
        <div className="text-center mt-4">
          <Link href="/livros" className="btn btn-primary">
            <i className="fas fa-arrow-left me-2"></i>
            Voltar à Busca
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle={`${livro.li_titulo} - Biblioteca Escolar`}>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/">Início</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/livros">Buscar Livros</Link>
          </li>
          <li className="breadcrumb-item active">{livro.li_titulo}</li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-12">
          <h1 className="page-title">{livro.li_titulo}</h1>
        </div>
      </div>

      <div className="row mt-4">
        {/* Informações do Livro */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h3><i className="fas fa-book me-2"></i>Informações do Livro</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td><strong>Título:</strong></td>
                        <td>{livro.li_titulo}</td>
                      </tr>
                      <tr>
                        <td><strong>Autor:</strong></td>
                        <td>{livro.autor?.au_nome || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Editora:</strong></td>
                        <td>{livro.editora?.ed_nome || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Ano de Publicação:</strong></td>
                        <td>{livro.li_ano || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td><strong>ISBN:</strong></td>
                        <td>{livro.li_isbn || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Gênero:</strong></td>
                        <td>{livro.genero?.ge_genero || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Total de Exemplares:</strong></td>
                        <td>
                          <span className="badge bg-primary">{exemplares.length}</span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Disponíveis:</strong></td>
                        <td>
                          <span className="badge bg-success">{exemplaresDisponiveis.length}</span>
                          {exemplaresEmprestados.length > 0 && (
                            <span className="badge bg-warning ms-2">
                              {exemplaresEmprestados.length} emprestado(s)
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {livro.li_descricao && (
                <div className="mt-4">
                  <h5>Descrição</h5>
                  <p>{livro.li_descricao}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h3><i className="fas fa-tasks me-2"></i>Ações</h3>
            </div>
            <div className="card-body">
              {exemplaresDisponiveis.length > 0 ? (
                <>
                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-success btn-lg"
                      onClick={() => setShowEmprestimoModal(true)}
                    >
                      <i className="fas fa-hand-holding me-2"></i>
                      Emprestar Livro
                    </button>
                  </div>
                  <div className="mt-3 text-center">
                    <small className="text-success">
                      <i className="fas fa-check-circle me-1"></i>
                      {exemplaresDisponiveis.length} exemplar(es) disponível(is) para empréstimo
                    </small>
                  </div>
                </>
              ) : (
                <div className="alert alert-warning" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Todos os exemplares estão emprestados no momento.
                </div>
              )}

              <div className="mt-4">
                <Link href="/livros" className="btn btn-secondary btn-lg w-100">
                  <i className="fas fa-arrow-left me-2"></i>
                  Voltar à Busca
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Exemplares */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3><i className="fas fa-list me-2"></i>Exemplares</h3>
            </div>
            <div className="card-body">
              {exemplares.length === 0 ? (
                <div className="alert alert-info" role="alert">
                  <i className="fas fa-info-circle me-2"></i>
                  Nenhum exemplar cadastrado para este livro.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Código do Exemplar</th>
                        <th>Estado</th>
                        <th>Status</th>
                        <th>Informações do Empréstimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exemplares.map((exemplar) => (
                        <tr key={exemplar.lex_cod}>
                          <td>
                            <strong>{exemplar.lex_cod}</strong>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {exemplar.lex_estado || 'Bom'}
                            </span>
                          </td>
                          <td>
                            {exemplar.lex_disponivel ? (
                              <span className="status-disponivel">
                                <i className="fas fa-check-circle me-1"></i>
                                Disponível
                              </span>
                            ) : (
                              <span className="status-indisponivel">
                                <i className="fas fa-times-circle me-1"></i>
                                Emprestado
                              </span>
                            )}
                          </td>
                          <td>
                            {!exemplar.lex_disponivel && exemplar.ut_nome ? (
                              <>
                                <strong>Emprestado para:</strong> {exemplar.ut_nome}<br />
                                <strong>Data do empréstimo:</strong> {formatDate(exemplar.re_data_requisicao ?? null)}<br />
                                <strong>Data prevista de devolução:</strong>{' '}
                                {exemplar.re_data_prevista && (
                                  <>
                                    {(() => {
                                      const hoje = new Date();
                                      const vencimento = new Date(exemplar.re_data_prevista!);
                                      const isOverdue = hoje > vencimento;
                                      return (
                                        <span className={isOverdue ? 'text-danger' : ''}>
                                          {formatDate(exemplar.re_data_prevista ?? null)}
                                          {isOverdue && ' (Em atraso)'}
                                        </span>
                                      );
                                    })()}
                                  </>
                                )}
                              </>
                            ) : (
                              <span className="text-muted">Disponível para empréstimo</span>
                            )}
                          </td>
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

      {/* Modal de Empréstimo */}
      {showEmprestimoModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-hand-holding me-2"></i>
                  Emprestar Livro
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEmprestimoModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEmprestimo}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="exemplar_id" className="form-label required">
                      Exemplar
                    </label>
                    <select
                      className="form-control"
                      id="exemplar_id"
                      value={emprestimoForm.exemplar_id}
                      onChange={(e) => setEmprestimoForm({ ...emprestimoForm, exemplar_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione um exemplar disponível</option>
                      {exemplaresDisponiveis.map((exemplar) => (
                        <option key={exemplar.lex_cod} value={exemplar.lex_cod}>
                          {exemplar.lex_cod} - {exemplar.lex_estado || 'Bom'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="utente_search" className="form-label required">
                      Buscar Usuário
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="utente_search"
                      placeholder="Digite o nome ou email do usuário"
                      onChange={async (e) => {
                        const query = e.target.value;
                        if (query.length >= 2) {
                          const utentes = await searchUtentes(query);
                          // Implementar dropdown de resultados aqui
                        }
                      }}
                    />
                    <input
                      type="hidden"
                      id="utente_id"
                      value={emprestimoForm.utente_id}
                      onChange={(e) => setEmprestimoForm({ ...emprestimoForm, utente_id: e.target.value })}
                      required
                    />
                  </div>

                  {emprestimoError && (
                    <div className="alert alert-danger" role="alert">
                      {emprestimoError}
                    </div>
                  )}

                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Informações:</strong>
                    <ul className="mb-0 mt-2">
                      <li>O prazo de empréstimo é de 14 dias</li>
                      <li>Data de devolução prevista: <strong>{formatDate(calculateDueDate(14))}</strong></li>
                      <li>Usuários com empréstimos em atraso não podem fazer novos empréstimos</li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEmprestimoModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={emprestimoLoading}
                  >
                    {emprestimoLoading ? (
                      <>
                        <div className="loading me-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-2"></i>
                        Confirmar Empréstimo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Overlay do modal */}
      {showEmprestimoModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </Layout>
  );
}
