import React, { useState } from 'react';
import Layout from '../components/Layout';

export default function TestApiDirectPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setStatus('Testando API...');

    try {
      // Testar API de utentes
      const response = await fetch('/api/utentes');
      const result = await response.json();
      
      if (response.ok) {
        setStatus(`✅ API funcionando! Encontrados ${result.data?.length || 0} utentes`);
        
        if (result.data && result.data.length > 0) {
          setStatus(prev => prev + `\n\nUtentes encontrados:\n${result.data.map(u => `- ${u.ut_nome} (${u.ut_email})`).join('\n')}`);
        }
      } else {
        setStatus(`❌ Erro na API: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Erro de conexão: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addTestUtente = async () => {
    setLoading(true);
    setStatus('Adicionando utente de teste...');

    try {
      const response = await fetch('/api/utentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ut_nome: 'João Teste',
          ut_nif: '123456789',
          ut_email: 'joao@teste.com',
          ut_tlm: '912345678',
          ut_morada: 'Rua Teste, 123',
          ut_cod_postal: '1000-001'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Utente adicionado: ${result.data?.ut_nome}`);
      } else {
        setStatus(`❌ Erro ao adicionar: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Erro: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageTitle="Teste API Direto">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Teste API Direto</h1>
          <p className="page-subtitle">Teste direto da API de utentes</p>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Teste da API</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={testApi}
                  disabled={loading}
                >
                  {loading ? 'Testando...' : '🔍 Testar API de Utentes'}
                </button>
                
                <button 
                  className="btn btn-success"
                  onClick={addTestUtente}
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : '➕ Adicionar Utente de Teste'}
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
