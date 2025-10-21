/**
 * index.tsx - Página inicial da biblioteca
 * Convertido de index.php para Next.js com Supabase
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

interface EmprestimoAtraso {
  re_cod: number;
  li_titulo: string;
  ut_nome: string;
  re_data_prevista: string;
}

interface ReservaPendente {
  res_cod: number;
  li_titulo: string;
  ut_nome: string;
  res_data: string;
}

export default function HomePage() {
  const [emprestimosAtraso, setEmprestimosAtraso] = useState<EmprestimoAtraso[]>([]);
  const [reservasPendentes, setReservasPendentes] = useState<ReservaPendente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchEmprestimosAtraso(), fetchReservasPendentes()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchEmprestimosAtraso = async () => {
    try {
      const res = await fetch('/api/requisicoes?status=ativo');
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Falha ao carregar requisições');
      }

      const hoje = new Date();
      const emprestimos = (json.data || [])
        .filter((item: any) => {
          const dataPrevista = new Date(item.re_data_prevista);
          return dataPrevista < hoje && !item.re_data_devolucao;
        })
        .map((item: any) => ({
          re_cod: item.re_cod,
          li_titulo: item.exemplar?.livro?.li_titulo || 'Livro',
          ut_nome: item.utente?.ut_nome || 'Utente',
          re_data_prevista: item.re_data_prevista,
        }));

      setEmprestimosAtraso(emprestimos);
    } catch (error) {
      console.error('Erro ao buscar empréstimos em atraso:', error);
    }
  };

  const fetchReservasPendentes = async () => {
    try {
      const { data, error } = await import('../lib/supabase').then(({ supabase }) =>
        supabase
          .from('reserva')
          .select(`
            res_cod,
            res_data,
            utente!res_ut_cod (
              ut_cod,
              ut_nome
            ),
            livro!res_li_cod (
              li_cod,
              li_titulo,
              autor!li_autor (
                au_nome
              )
            )
          `)
          .eq('res_status', 'pendente')
      );

      if (error) {
        console.error('Erro ao buscar reservas pendentes:', error);
        return;
      }

      const reservas = (data || []).map((item: any) => {
        const livro = Array.isArray(item.livro) ? item.livro[0] : item.livro;
        const autor = Array.isArray(livro?.autor) ? livro.autor[0] : livro?.autor;
        return {
          res_cod: item.res_cod,
          li_titulo: livro?.li_titulo || 'Livro',
          ut_nome: item.utente?.ut_nome || 'Utente',
          res_data: item.res_data,
        };
      });

      setReservasPendentes(reservas);
    } catch (error) {
      console.error('Erro ao buscar reservas pendentes:', error);
    }
  };

  const handleAprovarReserva = async (reservaId: number) => {
    try {
      const response = await fetch(`/api/reservas/${reservaId}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Reserva aprovada e empréstimo criado com sucesso!');
        fetchReservasPendentes();
        fetchEmprestimosAtraso(); // Atualizar lista de empréstimos ativos
      } else {
        alert(result.error || 'Erro ao aprovar reserva');
      }
    } catch (error) {
      console.error('Erro ao aprovar reserva:', error);
      alert('Erro ao aprovar reserva');
    }
  };

  const handleRejeitarReserva = async (reservaId: number) => {
    try {
      const { error } = await import('../lib/supabase').then(({ supabase }) =>
        supabase
          .from('reserva')
          .update({ res_status: 'rejeitada' })
          .eq('res_cod', reservaId)
      );

      if (error) {
        console.error('Erro ao rejeitar reserva:', error);
        alert('Erro ao rejeitar reserva');
      } else {
        alert('Reserva rejeitada com sucesso!');
        fetchReservasPendentes();
      }
    } catch (error) {
      console.error('Erro ao rejeitar reserva:', error);
      alert('Erro ao rejeitar reserva');
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
    <Layout pageTitle="Biblioteca Escolar - Página Inicial">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Biblioteca Escolar</h1>
          <p className="page-subtitle">Sistema de Gestão de Biblioteca</p>
        </div>
      </div>

      {/* Painel de Atalhos */}
      <div className="row mt-4">
        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card shortcut-card">
            <div className="card-body text-center">
              <div className="shortcut-icon">📚</div>
              <h3 className="card-title">Buscar Livros</h3>
              <p className="card-text">Pesquise livros por título, autor ou ISBN</p>
              <Link href="/livros" className="btn btn-primary btn-lg">
                Buscar
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card shortcut-card">
            <div className="card-body text-center">
              <div className="shortcut-icon">📖</div>
              <h3 className="card-title">Registrar Empréstimo</h3>
              <p className="card-text">Registre um novo empréstimo de livro</p>
              <Link href="/emprestimos" className="btn btn-success btn-lg">
                Emprestar
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card shortcut-card">
            <div className="card-body text-center">
              <div className="shortcut-icon">↩️</div>
              <h3 className="card-title">Registrar Devolução</h3>
              <p className="card-text">Registre a devolução de um livro</p>
              <Link href="/devolucoes" className="btn btn-warning btn-lg">
                Devolver
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card shortcut-card">
            <div className="card-body text-center">
              <div className="shortcut-icon">👥</div>
              <h3 className="card-title">Gestão de Utentes</h3>
              <p className="card-text">Cadastre e gerencie utentes da biblioteca</p>
              <Link href="/utentes" className="btn btn-info btn-lg">
                Utentes
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card shortcut-card">
            <div className="card-body text-center">
              <div className="shortcut-icon">📊</div>
              <h3 className="card-title">Relatórios</h3>
              <p className="card-text">Visualize relatórios da biblioteca</p>
              <Link href="/relatorios" className="btn btn-secondary btn-lg">
                Relatórios
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4 mb-4">
          <div className="card shortcut-card">
            <div className="card-body text-center">
              <div className="shortcut-icon">⚙️</div>
              <h3 className="card-title">Administração</h3>
              <p className="card-text">Gerencie livros, autores e editoras</p>
              <Link href="/admin" className="btn btn-dark btn-lg">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Avisos */}
      {loading ? (
        <div className="row mt-4">
          <div className="col-12">
            <div className="text-center">
              <div className="loading"></div>
              <p>Carregando avisos...</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {reservasPendentes.length > 0 && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5>📋 Reservas Pendentes</h5>
                  </div>
                  <div className="card-body">
                    <p>Há {reservasPendentes.length} reserva(s) aguardando aprovação:</p>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Utente</th>
                            <th>Livro</th>
                            <th>Data da Reserva</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservasPendentes.map((reserva) => (
                            <tr key={reserva.res_cod}>
                              <td><strong>{reserva.ut_nome}</strong></td>
                              <td>{reserva.li_titulo}</td>
                              <td>{formatDate(reserva.res_data)}</td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm me-2"
                                  onClick={() => handleAprovarReserva(reserva.res_cod)}
                                >
                                  <i className="fas fa-check"></i> Aprovar
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRejeitarReserva(reserva.res_cod)}
                                >
                                  <i className="fas fa-times"></i> Rejeitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {emprestimosAtraso.length > 0 && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <h4 className="alert-heading">⚠️ Avisos Importantes</h4>
                  <p>Os seguintes empréstimos estão em atraso:</p>
                  <ul className="mb-0">
                    {emprestimosAtraso.map((emprestimo) => (
                      <li key={emprestimo.re_cod}>
                        <strong>{emprestimo.ut_nome}</strong> - "{emprestimo.li_titulo}"
                        (Vencimento: {formatDate(emprestimo.re_data_prevista)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
