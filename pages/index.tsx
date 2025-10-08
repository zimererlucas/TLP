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

export default function HomePage() {
  const [emprestimosAtraso, setEmprestimosAtraso] = useState<EmprestimoAtraso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmprestimosAtraso();
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
          const dataRequisicao = new Date(item.re_data_requisicao);
          const diasEmprestado = Math.floor((hoje.getTime() - dataRequisicao.getTime()) / (1000 * 60 * 60 * 24));
          return diasEmprestado > 14;
        })
        .map((item: any) => ({
          re_cod: item.re_cod,
          li_titulo: item.exemplar?.livro?.li_titulo || 'Livro',
          ut_nome: item.utente?.ut_nome || 'Utente',
          re_data_prevista: item.re_data_requisicao,
        }));

      setEmprestimosAtraso(emprestimos);
    } catch (error) {
      console.error('Erro ao buscar empréstimos em atraso:', error);
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
      ) : emprestimosAtraso.length > 0 ? (
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
      ) : null}
    </Layout>
  );
}
