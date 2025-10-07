import React, { useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

export default function SeedDataPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const addSampleData = async () => {
    setLoading(true);
    setStatus('Iniciando inserção de dados de exemplo...');

    try {
      // 1. Adicionar códigos postais
      setStatus('Adicionando códigos postais...');
      const { error: cpError } = await supabase
        .from('codigo_postal')
        .upsert([
          { cod_postal: '1000-001', cod_localidade: 'Lisboa' },
          { cod_postal: '4000-001', cod_localidade: 'Porto' },
          { cod_postal: '3000-001', cod_localidade: 'Coimbra' }
        ], { onConflict: 'cod_postal' });

      if (cpError) throw cpError;

      // 2. Adicionar gêneros
      setStatus('Adicionando gêneros...');
      const { error: genError } = await supabase
        .from('genero')
        .upsert([
          { ge_genero: 'Ficção' },
          { ge_genero: 'Romance' },
          { ge_genero: 'Técnico' },
          { ge_genero: 'História' }
        ], { onConflict: 'ge_genero' });

      if (genError) throw genError;

      // 3. Adicionar autores
      setStatus('Adicionando autores...');
      const { error: autError } = await supabase
        .from('autor')
        .upsert([
          { au_nome: 'José Saramago', au_pais: 'Portugal' },
          { au_nome: 'Fernando Pessoa', au_pais: 'Portugal' },
          { au_nome: 'Eça de Queirós', au_pais: 'Portugal' },
          { au_nome: 'J.K. Rowling', au_pais: 'Reino Unido' }
        ], { onConflict: 'au_nome' });

      if (autError) throw autError;

      // 4. Adicionar editoras
      setStatus('Adicionando editoras...');
      const { error: edError } = await supabase
        .from('editora')
        .upsert([
          { 
            ed_nome: 'Porto Editora', 
            ed_pais: 'Portugal',
            ed_morada: 'Rua da Restauração, 365',
            ed_cod_postal: '4000-001',
            ed_email: 'info@portoeditora.pt',
            ed_tlm: '220123456'
          },
          { 
            ed_nome: 'Bertrand Editora', 
            ed_pais: 'Portugal',
            ed_morada: 'Rua das Flores, 100',
            ed_cod_postal: '1000-001',
            ed_email: 'info@bertrand.pt',
            ed_tlm: '210123456'
          }
        ], { onConflict: 'ed_nome' });

      if (edError) throw edError;

      // 5. Adicionar utentes
      setStatus('Adicionando utentes...');
      const { error: utError } = await supabase
        .from('utente')
        .upsert([
          {
            ut_nome: 'Maria Silva',
            ut_nif: '123456789',
            ut_email: 'maria@exemplo.com',
            ut_tlm: '912345678',
            ut_morada: 'Rua das Flores, 123',
            ut_cod_postal: '1000-001'
          },
          {
            ut_nome: 'João Santos',
            ut_nif: '987654321',
            ut_email: 'joao@exemplo.com',
            ut_tlm: '923456789',
            ut_morada: 'Avenida da Liberdade, 456',
            ut_cod_postal: '1000-001'
          },
          {
            ut_nome: 'Ana Costa',
            ut_nif: '456789123',
            ut_email: 'ana@exemplo.com',
            ut_tlm: '934567890',
            ut_morada: 'Rua do Comércio, 789',
            ut_cod_postal: '4000-001'
          }
        ], { onConflict: 'ut_email' });

      if (utError) throw utError;

      setStatus('✅ Dados de exemplo adicionados com sucesso!');
      
    } catch (error) {
      setStatus(`❌ Erro: ${error}`);
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageTitle="Dados de Exemplo">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Dados de Exemplo</h1>
          <p className="page-subtitle">Adicionar dados de exemplo à base de dados</p>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Inserir Dados de Exemplo</h5>
            </div>
            <div className="card-body">
              <p>Esta página irá adicionar dados de exemplo à base de dados, incluindo:</p>
              <ul>
                <li>Códigos postais (Lisboa, Porto, Coimbra)</li>
                <li>Gêneros literários (Ficção, Romance, Técnico, História)</li>
                <li>Autores (José Saramago, Fernando Pessoa, Eça de Queirós, J.K. Rowling)</li>
                <li>Editoras (Porto Editora, Bertrand Editora)</li>
                <li>Utentes (Maria Silva, João Santos, Ana Costa)</li>
              </ul>
              
              <div className="mt-3">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={addSampleData}
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : 'Adicionar Dados de Exemplo'}
                </button>
              </div>
              
              {status && (
                <div className="mt-3">
                  <div className="alert alert-info">
                    <strong>Status:</strong> {status}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
