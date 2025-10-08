/**
 * utentes.tsx - Página de gestão de utentes
 * Convertido de utentes.php para Next.js com Supabase
 */

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface Utente {
  ut_cod: number;
  ut_nome: string;
  ut_nif?: string;
  ut_email?: string;
  ut_tlm?: string;
  ut_morada?: string;
  ut_cod_postal?: string;
  codigo_postal?: {
    cod_localidade: string;
  };
}

interface CodigoPostal {
  cod_postal: string;
  cod_localidade: string;
}

export default function UtentesPage() {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [codigosPostais, setCodigosPostais] = useState<CodigoPostal[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUtente, setEditingUtente] = useState<Utente | null>(null);

  const [formData, setFormData] = useState({
    ut_nome: '',
    ut_nif: '',
    ut_email: '',
    ut_tlm: '',
    ut_morada: '',
    ut_cod_postal: ''
  });

  useEffect(() => {
    fetchUtentes();
    fetchCodigosPostais();
  }, []);

  const fetchUtentes = async () => {
    try {
      const { data, error } = await supabase
        .from('utente')
        .select(`
          ut_cod,
          ut_nome,
          ut_nif,
          ut_email,
          ut_tlm,
          ut_morada,
          ut_cod_postal,
          codigo_postal:codigo_postal(cod_localidade)
        `)
        .order('ut_nome');

      if (error) throw error;
      
      // Mapear codigo_postal de array para objeto
      const utentesProcessados = (data as any[])?.map((u: any) => ({
        ...u,
        codigo_postal: Array.isArray(u.codigo_postal) ? u.codigo_postal[0] : u.codigo_postal
      })) || [];
      
      setUtentes(utentesProcessados);
    } catch (error) {
      console.error('Erro ao buscar utentes:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar utentes' });
    }
  };

  const fetchCodigosPostais = async () => {
    try {
      const { data, error } = await supabase
        .from('codigo_postal')
        .select('cod_postal, cod_localidade')
        .order('cod_postal');

      if (error) throw error;
      setCodigosPostais(data || []);
    } catch (error) {
      console.error('Erro ao buscar códigos postais:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUtente) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('utente')
          .update(formData)
          .eq('ut_cod', editingUtente.ut_cod);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Usuário atualizado com sucesso!' });
      } else {
        // Criar novo usuário
        const { error } = await supabase
          .from('utente')
          .insert(formData);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Usuário criado com sucesso!' });
      }

      setShowForm(false);
      setEditingUtente(null);
      resetForm();
      fetchUtentes();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar usuário' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (utente: Utente) => {
    setEditingUtente(utente);
    setFormData({
      ut_nome: utente.ut_nome,
      ut_nif: utente.ut_nif || '',
      ut_email: utente.ut_email || '',
      ut_tlm: utente.ut_tlm || '',
      ut_morada: utente.ut_morada || '',
      ut_cod_postal: utente.ut_cod_postal || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (ut_cod: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('utente')
        .delete()
        .eq('ut_cod', ut_cod);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Usuário excluído com sucesso!' });
      fetchUtentes();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setMessage({ type: 'error', text: 'Erro ao excluir usuário' });
    }
  };

  const resetForm = () => {
    setFormData({
      ut_nome: '',
      ut_nif: '',
      ut_email: '',
      ut_tlm: '',
      ut_morada: '',
      ut_cod_postal: ''
    });
  };

  const handleNewUser = () => {
    setEditingUtente(null);
    resetForm();
    setShowForm(true);
  };

  return (
    <Layout pageTitle="Gestão de Utentes">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Gestão de Utentes</h1>
          <p className="page-subtitle">Cadastre e gerencie utentes da biblioteca</p>
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
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Lista de Utentes</h3>
            <button className="btn btn-primary" onClick={handleNewUser}>
              <i className="fas fa-plus"></i> Novo Utente
            </button>
          </div>

          {showForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>{editingUtente ? 'Editar Usuário' : 'Novo Usuário'}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="ut_nome" className="form-label">Nome *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="ut_nome"
                        value={formData.ut_nome}
                        onChange={(e) => setFormData({ ...formData, ut_nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="ut_nif" className="form-label">NIF</label>
                      <input
                        type="text"
                        className="form-control"
                        id="ut_nif"
                        value={formData.ut_nif}
                        onChange={(e) => setFormData({ ...formData, ut_nif: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="ut_email" className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        id="ut_email"
                        value={formData.ut_email}
                        onChange={(e) => setFormData({ ...formData, ut_email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="ut_tlm" className="form-label">Telefone</label>
                      <input
                        type="text"
                        className="form-control"
                        id="ut_tlm"
                        value={formData.ut_tlm}
                        onChange={(e) => setFormData({ ...formData, ut_tlm: e.target.value })}
                      />
                    </div>
                    <div className="col-md-8 mb-3">
                      <label htmlFor="ut_morada" className="form-label">Morada</label>
                      <input
                        type="text"
                        className="form-control"
                        id="ut_morada"
                        value={formData.ut_morada}
                        onChange={(e) => setFormData({ ...formData, ut_morada: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="ut_cod_postal" className="form-label">Código Postal</label>
                      <select
                        className="form-select"
                        id="ut_cod_postal"
                        value={formData.ut_cod_postal}
                        onChange={(e) => setFormData({ ...formData, ut_cod_postal: e.target.value })}
                      >
                        <option value="">Selecione</option>
                        {codigosPostais.map((cp) => (
                          <option key={cp.cod_postal} value={cp.cod_postal}>
                            {cp.cod_postal} - {cp.cod_localidade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>NIF</th>
                      <th>Email</th>
                      <th>Telefone</th>
                      <th>Localidade</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utentes.map((utente) => (
                      <tr key={utente.ut_cod}>
                        <td><strong>{utente.ut_nome}</strong></td>
                        <td>{utente.ut_nif || '-'}</td>
                        <td>{utente.ut_email || '-'}</td>
                        <td>{utente.ut_tlm || '-'}</td>
                        <td>{utente.codigo_postal?.cod_localidade || '-'}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(utente)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(utente.ut_cod)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
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
    </Layout>
  );
}
