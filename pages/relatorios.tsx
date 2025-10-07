/**
 * relatorios.tsx - Página de relatórios
 * Convertido de relatorios.php para Next.js com Supabase
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface Estatisticas {
  totalLivros: number;
  totalExemplares: number;
  exemplaresDisponiveis: number;
  exemplaresEmprestados: number;
  totalUtentes: number;
  emprestimosAtivos: number;
  emprestimosAtraso: number;
}

interface EmprestimoRecente {
  re_cod: number;
  re_data_requisicao: string;
  utente: {
    ut_nome: string;
  };
  exemplar: {
    livro: {
      li_titulo: string;
      autor: {
        au_nome: string;
      };
    };
  };
}

export default function RelatoriosPage() {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [emprestimosRecentes, setEmprestimosRecentes] = useState<EmprestimoRecente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      setLoading(true);

      // Buscar estatísticas gerais
      const [
        { count: totalLivros },
        { count: totalExemplares },
        { count: exemplaresDisponiveis },
        { count: totalUtentes },
        { count: emprestimosAtivos }
      ] = await Promise.all([
        supabase.from('livro').select('*', { count: 'exact', head: true }),
        supabase.from('livro_exemplar').select('*', { count: 'exact', head: true }),
        supabase.from('livro_exemplar').select('*', { count: 'exact', head: true }).eq('lex_disponivel', true),
        supabase.from('utente').select('*', { count: 'exact', head: true }),
        supabase.from('requisicao').select('*', { count: 'exact', head: true }).is('re_data_devolucao', null)
      ]);

      // Buscar empréstimos em atraso (mais de 14 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 14);
      const { count: emprestimosAtraso } = await supabase
        .from('requisicao')
        .select('*', { count: 'exact', head: true })
        .is('re_data_devolucao', null)
        .lt('re_data_requisicao', dataLimite.toISOString().split('T')[0]);

      setEstatisticas({
        totalLivros: totalLivros || 0,
        totalExemplares: totalExemplares || 0,
        exemplaresDisponiveis: exemplaresDisponiveis || 0,
        exemplaresEmprestados: (totalExemplares || 0) - (exemplaresDisponiveis || 0),
        totalUtentes: totalUtentes || 0,
        emprestimosAtivos: emprestimosAtivos || 0,
        emprestimosAtraso: emprestimosAtraso || 0
      });

      // Buscar empréstimos recentes
      const { data: emprestimosData, error: emprestimosError } = await supabase
        .from('requisicao')
        .select(`
          re_cod,
          re_data_requisicao,
          utente:utente!inner(
            ut_nome
          ),
          exemplar:livro_exemplar!inner(
            livro:livro!inner(
              li_titulo,
              autor:autor!inner(au_nome)
            )
          )
        `)
        .is('re_data_devolucao', null)
        .order('re_data_requisicao', { ascending: false })
        .limit(10);

      if (emprestimosError) throw emprestimosError;
      setEmprestimosRecentes(emprestimosData || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string): string => {
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <Layout pageTitle="Relatórios">
        <div className="row">
          <div className="col-12">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <p className="mt-2">Carregando relatórios...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Relatórios">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Relatórios da Biblioteca</h1>
          <p className="page-subtitle">Estatísticas e informações gerais do sistema</p>
        </div>
      </div>

      {estatisticas && (
        <div className="row mt-4">
          <div className="col-md-3 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="display-4 text-primary">
                  <i className="fas fa-book"></i>
                </div>
                <h5 className="card-title">Total de Livros</h5>
                <h2 className="text-primary">{estatisticas.totalLivros}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="display-4 text-success">
                  <i className="fas fa-book-open"></i>
                </div>
                <h5 className="card-title">Exemplares Disponíveis</h5>
                <h2 className="text-success">{estatisticas.exemplaresDisponiveis}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="display-4 text-warning">
                  <i className="fas fa-book-reader"></i>
                </div>
                <h5 className="card-title">Emprestados</h5>
                <h2 className="text-warning">{estatisticas.exemplaresEmprestados}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="display-4 text-info">
                  <i className="fas fa-users"></i>
                </div>
                <h5 className="card-title">Utentes</h5>
                <h2 className="text-info">{estatisticas.totalUtentes}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Empréstimos Ativos</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <h3 className="text-primary">{estatisticas?.emprestimosAtivos || 0}</h3>
                  <p className="text-muted">Total Ativo</p>
                </div>
                <div className="col-6">
                  <h3 className="text-danger">{estatisticas?.emprestimosAtraso || 0}</h3>
                  <p className="text-muted">Em Atraso</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Status dos Exemplares</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <h3 className="text-success">{estatisticas?.exemplaresDisponiveis || 0}</h3>
                  <p className="text-muted">Disponíveis</p>
                </div>
                <div className="col-6">
                  <h3 className="text-warning">{estatisticas?.exemplaresEmprestados || 0}</h3>
                  <p className="text-muted">Emprestados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Empréstimos Recentes</h5>
            </div>
            <div className="card-body">
              {emprestimosRecentes.length === 0 ? (
                <p className="text-muted">Nenhum empréstimo ativo encontrado.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Usuário</th>
                        <th>Livro</th>
                        <th>Autor</th>
                        <th>Data do Empréstimo</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emprestimosRecentes.map((emprestimo) => {
                        const dataEmprestimo = new Date(emprestimo.re_data_requisicao);
                        const diasEmprestado = Math.floor((new Date().getTime() - dataEmprestimo.getTime()) / (1000 * 60 * 60 * 24));
                        const isAtraso = diasEmprestado > 14;

                        return (
                          <tr key={emprestimo.re_cod}>
                            <td><strong>{emprestimo.utente.ut_nome}</strong></td>
                            <td>{emprestimo.exemplar.livro.li_titulo}</td>
                            <td>{emprestimo.exemplar.livro.autor.au_nome}</td>
                            <td>{formatDate(emprestimo.re_data_requisicao)}</td>
                            <td>
                              <span className={`badge ${isAtraso ? 'bg-danger' : 'bg-success'}`}>
                                {isAtraso ? 'Em Atraso' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
