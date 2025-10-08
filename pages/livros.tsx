/**
 * livros.tsx - Página de busca de livros
 * Convertido de livros.php para Next.js com Supabase
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';

interface Livro {
  li_cod: number;
  li_titulo: string;
  li_isbn?: string;
  li_ano?: number;
  autor?: { au_nome: string };
  editora?: { ed_nome: string };
  genero?: { ge_genero: string };
  total_exemplares: number;
  exemplares_disponiveis: number;
}

interface SearchResults {
  livros: Livro[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
}

export default function LivrosPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Buscar livros quando a página carregar com parâmetros
  useEffect(() => {
    if (router.query.search) {
      const term = router.query.search as string;
      const page = router.query.page as string || '1';
      setSearchTerm(term);
      searchBooks(term, page);
    }
  }, [router.query]);

  const searchBooks = async (term: string, page: string = '1') => {
    if (!term.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/livros?search=${encodeURIComponent(term)}&page=${page}&limit=10`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar livros');
      }

      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar livros');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/livros?search=${encodeURIComponent(searchTerm.trim())}&page=1`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (searchTerm.trim()) {
      router.push(`/livros?search=${encodeURIComponent(searchTerm.trim())}&page=${newPage}`);
    }
  };

  const formatDate = (date: string): string => {
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Layout pageTitle="Buscar Livros - Biblioteca Escolar">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Buscar Livros</h1>
          <p className="page-subtitle">Encontre o livro que você está procurando</p>
        </div>
      </div>

      {/* Formulário de Busca */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSearch} className="row g-3">
                <div className="col-md-8">
                  <label htmlFor="search" className="form-label">Termo de busca</label>
                  <input
                    type="text"
                    className="form-control"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o título, autor, ISBN, editora ou gênero do livro"
                    aria-describedby="searchHelp"
                    required
                    autoFocus
                  />
                  <div id="searchHelp" className="form-text">
                    Você pode buscar por título do livro, nome do autor, ISBN, nome da editora ou gênero.
                  </div>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="loading me-2"></div>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search me-2"></i>
                        Buscar Livros
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Resultados da Busca */}
      {searchResults && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">
                  Resultados para "{searchTerm}"
                  <small className="text-muted ms-2">
                    ({searchResults.pagination.totalResults} livro(s) encontrado(s))
                  </small>
                </h3>
              </div>
              <div className="card-body">
                {searchResults.livros.length === 0 ? (
                  <div className="alert alert-info" role="alert">
                    <i className="fas fa-info-circle me-2"></i>
                    Nenhum livro encontrado para o termo "{searchTerm}".
                    Tente buscar com outros termos ou verifique a ortografia.
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Título</th>
                            <th>Autor</th>
                            <th>Editora</th>
                            <th>Ano</th>
                            <th>Gênero</th>
                            <th>Exemplares</th>
                            <th>Disponíveis</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.livros.map((livro) => (
                            <tr key={livro.li_cod}>
                              <td>
                                <strong>{livro.li_titulo}</strong>
                                {livro.li_isbn && (
                                  <>
                                    <br />
                                    <small className="text-muted">ISBN: {livro.li_isbn}</small>
                                  </>
                                )}
                              </td>
                              <td>{livro.autor?.au_nome || 'N/A'}</td>
                              <td>{livro.editora?.ed_nome || 'N/A'}</td>
                              <td>{livro.li_ano || 'N/A'}</td>
                              <td>{livro.genero?.ge_genero || 'N/A'}</td>
                              <td>
                                <span className="badge bg-secondary">
                                  {livro.total_exemplares}
                                </span>
                              </td>
                              <td>
                                {livro.exemplares_disponiveis > 0 ? (
                                  <span className="badge bg-success">
                                    {livro.exemplares_disponiveis} Disponível(is)
                                  </span>
                                ) : (
                                  <span className="badge bg-danger">Indisponível</span>
                                )}
                              </td>
                              <td>
                                <Link
                                  href={`/livro/${livro.li_cod}`}
                                  className="btn btn-primary btn-sm"
                                >
                                  <i className="fas fa-eye me-1"></i>
                                  Ver Detalhes
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginação */}
                    {searchResults.pagination.totalPages > 1 && (
                      <nav aria-label="Navegação de páginas">
                        <ul className="pagination justify-content-center">
                          {searchResults.pagination.currentPage > 1 && (
                            <li className="page-item">
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(searchResults.pagination.currentPage - 1)}
                              >
                                <i className="fas fa-chevron-left"></i> Anterior
                              </button>
                            </li>
                          )}

                          {Array.from({ length: searchResults.pagination.totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              const current = searchResults.pagination.currentPage;
                              return page >= current - 2 && page <= current + 2;
                            })
                            .map((page) => (
                              <li
                                key={page}
                                className={`page-item ${page === searchResults.pagination.currentPage ? 'active' : ''}`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </button>
                              </li>
                            ))}

                          {searchResults.pagination.currentPage < searchResults.pagination.totalPages && (
                            <li className="page-item">
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(searchResults.pagination.currentPage + 1)}
                              >
                                Próximo <i className="fas fa-chevron-right"></i>
                              </button>
                            </li>
                          )}
                        </ul>
                      </nav>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dicas de Busca */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h5><i className="fas fa-lightbulb me-2"></i>Dicas para uma busca mais eficiente:</h5>
              <ul className="mb-0">
                <li>Use palavras-chave do título do livro</li>
                <li>Digite o nome completo ou sobrenome do autor</li>
                <li>Para ISBN, digite apenas os números</li>
                <li>Busque por gênero: Romance, Ficção, História, etc.</li>
                <li>Use o nome da editora se souber</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
