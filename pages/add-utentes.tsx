import React, { useState } from 'react';
import Layout from '../components/Layout';

export default function AddUtentesPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const addUtentes = async () => {
    setLoading(true);
    setStatus('Adicionando utentes...');

    try {
      // Adicionar utentes diretamente via API
      const response = await fetch('/api/utentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ut_nome: 'Maria Silva',
          ut_nif: '123456789',
          ut_email: 'maria@exemplo.com',
          ut_tlm: '912345678',
          ut_morada: 'Rua das Flores, 123',
          ut_cod_postal: '1000-001'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      setStatus(`✅ Utente adicionado: ${result.data?.ut_nome || 'Sucesso'}`);
      
      // Adicionar mais utentes
      const utentes = [
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
      ];

      for (const utente of utentes) {
        const response = await fetch('/api/utentes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(utente)
        });

        if (response.ok) {
          setStatus(prev => prev + `\n✅ ${utente.ut_nome} adicionado`);
        }
      }

      setStatus(prev => prev + '\n🎉 Todos os utentes foram adicionados!');
      
    } catch (error) {
      setStatus(`❌ Erro: ${error}`);
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCodigosPostais = async () => {
    setLoading(true);
    setStatus('Adicionando códigos postais...');

    try {
      const codigos = [
        { cod_postal: '1000-001', cod_localidade: 'Lisboa' },
        { cod_postal: '4000-001', cod_localidade: 'Porto' },
        { cod_postal: '3000-001', cod_localidade: 'Coimbra' }
      ];

      for (const codigo of codigos) {
        const response = await fetch('/api/codigos-postais', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(codigo)
        });

        if (response.ok) {
          setStatus(prev => prev + `\n✅ ${codigo.cod_localidade} adicionado`);
        }
      }

      setStatus(prev => prev + '\n🎉 Códigos postais adicionados!');
      
    } catch (error) {
      setStatus(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageTitle="Adicionar Utentes">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Adicionar Utentes</h1>
          <p className="page-subtitle">Adicionar dados de exemplo à base de dados</p>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Adicionar Dados de Exemplo</h5>
            </div>
            <div className="card-body">
              <p>Esta página adiciona dados de exemplo diretamente à base de dados:</p>
              
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={addCodigosPostais}
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : '1. Adicionar Códigos Postais'}
                </button>
                
                <button 
                  className="btn btn-success"
                  onClick={addUtentes}
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : '2. Adicionar Utentes'}
                </button>
              </div>
              
              {status && (
                <div className="mt-3">
                  <div className="alert alert-info">
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{status}</pre>
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
