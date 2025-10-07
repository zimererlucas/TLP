/**
 * admin.tsx - Página de administração
 * Convertido de admin/index.php para Next.js com Supabase
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface Autor {
  au_cod: number;
  au_nome: string;
  au_pais?: string;
}

interface Editora {
  ed_cod: number;
  ed_nome: string;
  ed_pais?: string;
}

interface Genero {
  ge_genero: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('autores');
  const [autores, setAutores] = useState<Autor[]>([]);
  const [editoras, setEditoras] = useState<Editora[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulários
  const [autorForm, setAutorForm] = useState({ au_nome: '', au_pais: '' });
  const [editoraForm, setEditoraForm] = useState({ ed_nome: '', ed_pais: '' });
  const [generoForm, setGeneroForm] = useState({ ge_genero: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [autoresData, editorasData, generosData] = await Promise.all([
        supabase.from('autor').select('*').order('au_nome'),
        supabase.from('editora').select('*').order('ed_nome'),
        supabase.from('genero').select('*').order('ge_genero')
      ]);

      setAutores(autoresData.data || []);
      setEditoras(editorasData.data || []);
      setGeneros(generosData.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar dados' });
    }
  };

  const handleAutorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('autor')
        .insert(autorForm);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Autor adicionado com sucesso!' });
      setAutorForm({ au_nome: '', au_pais: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar autor:', error);
      setMessage({ type: 'error', text: 'Erro ao adicionar autor' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditoraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('editora')
        .insert(editoraForm);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Editora adicionada com sucesso!' });
      setEditoraForm({ ed_nome: '', ed_pais: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar editora:', error);
      setMessage({ type: 'error', text: 'Erro ao adicionar editora' });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('genero')
        .insert(generoForm);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Gênero adicionado com sucesso!' });
      setGeneroForm({ ge_genero: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar gênero:', error);
      setMessage({ type: 'error', text: 'Erro ao adicionar gênero' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (table: string, id: number | string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(table === 'autor' ? 'au_cod' : table === 'editora' ? 'ed_cod' : 'ge_genero', id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Item excluído com sucesso!' });
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      setMessage({ type: 'error', text: 'Erro ao excluir item' });
    }
  };

  return (
    <Layout pageTitle="Administração">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Administração</h1>
          <p className="page-subtitle">Gerencie autores, editoras e gêneros literários</p>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="row mt-4">
        <div className="col-12">
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'autores' ? 'active' : ''}`}
                onClick={() => setActiveTab('autores')}
              >
                Autores
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'editoras' ? 'active' : ''}`}
                onClick={() => setActiveTab('editoras')}
              >
                Editoras
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'generos' ? 'active' : ''}`}
                onClick={() => setActiveTab('generos')}
              >
                Gêneros
              </button>
            </li>
          </ul>

          <div className="tab-content mt-3">
            {/* Aba Autores */}
            {activeTab === 'autores' && (
              <div>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Adicionar Autor</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleAutorSubmit}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="au_nome" className="form-label">Nome do Autor *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="au_nome"
                            value={autorForm.au_nome}
                            onChange={(e) => setAutorForm({ ...autorForm, au_nome: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="au_pais" className="form-label">País</label>
                          <input
                            type="text"
                            className="form-control"
                            id="au_pais"
                            value={autorForm.au_pais}
                            onChange={(e) => setAutorForm({ ...autorForm, au_pais: e.target.value })}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adicionando...' : 'Adicionar Autor'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5>Lista de Autores</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>País</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {autores.map((autor) => (
                            <tr key={autor.au_cod}>
                              <td><strong>{autor.au_nome}</strong></td>
                              <td>{autor.au_pais || '-'}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete('autor', autor.au_cod)}
                                >
                                  <i className="fas fa-trash"></i>
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
            )}

            {/* Aba Editoras */}
            {activeTab === 'editoras' && (
              <div>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Adicionar Editora</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleEditoraSubmit}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="ed_nome" className="form-label">Nome da Editora *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="ed_nome"
                            value={editoraForm.ed_nome}
                            onChange={(e) => setEditoraForm({ ...editoraForm, ed_nome: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="ed_pais" className="form-label">País</label>
                          <input
                            type="text"
                            className="form-control"
                            id="ed_pais"
                            value={editoraForm.ed_pais}
                            onChange={(e) => setEditoraForm({ ...editoraForm, ed_pais: e.target.value })}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adicionando...' : 'Adicionar Editora'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5>Lista de Editoras</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>País</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editoras.map((editora) => (
                            <tr key={editora.ed_cod}>
                              <td><strong>{editora.ed_nome}</strong></td>
                              <td>{editora.ed_pais || '-'}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete('editora', editora.ed_cod)}
                                >
                                  <i className="fas fa-trash"></i>
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
            )}

            {/* Aba Gêneros */}
            {activeTab === 'generos' && (
              <div>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5>Adicionar Gênero</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleGeneroSubmit}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="ge_genero" className="form-label">Nome do Gênero *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="ge_genero"
                            value={generoForm.ge_genero}
                            onChange={(e) => setGeneroForm({ ge_genero: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adicionando...' : 'Adicionar Gênero'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h5>Lista de Gêneros</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Gênero</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generos.map((genero) => (
                            <tr key={genero.ge_genero}>
                              <td><strong>{genero.ge_genero}</strong></td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete('genero', genero.ge_genero)}
                                >
                                  <i className="fas fa-trash"></i>
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
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
