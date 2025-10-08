import React, { useState } from 'react';
import Layout from '../components/Layout';

export default function TestConnectionPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testando conexão...');

    try {
      // Testar se o servidor está respondendo
      const response = await fetch('/api/utentes');
      
      if (response.ok) {
        const result = await response.json();
        setStatus(`✅ Conexão funcionando! Encontrados ${result.data?.length || 0} utentes`);
        
        if (result.data && result.data.length > 0) {
          setStatus(prev => prev + `\n\nUtentes encontrados:\n${result.data.map((u: any) => `- ${u.ut_nome} (${u.ut_email || 'sem email'})`).join('\n')}`);
        } else {
          setStatus(prev => prev + '\n\nNenhum utente encontrado. Vamos adicionar um...');
          await addTestUtente();
        }
      } else {
        const error = await response.json();
        setStatus(`❌ Erro na API: ${error.error}`);
      }
    } catch (error) {
      setStatus(`❌ Erro de conexão: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addTestUtente = async () => {
    try {
      setStatus(prev => prev + '\n\nAdicionando utente de teste...');
      
      const response = await fetch('/api/utentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ut_nome: 'Maria Teste',
          ut_nif: '123456789',
          ut_email: 'maria@teste.com',
          ut_tlm: '912345678',
          ut_morada: 'Rua Teste, 123',
          ut_cod_postal: '1000-001'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setStatus(prev => prev + `\n✅ Utente adicionado: ${result.data?.ut_nome}`);
      } else {
        const error = await response.json();
        setStatus(prev => prev + `\n❌ Erro ao adicionar: ${error.error}`);
      }
    } catch (error) {
      setStatus(prev => prev + `\n❌ Erro: ${error}`);
    }
  };

  const clearStatus = () => {
    setStatus('');
  };

  return (
    <Layout pageTitle="Teste de Conexão">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Teste de Conexão</h1>
          <p className="page-subtitle">Teste completo da conexão com a base de dados</p>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Teste de Conexão</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={testConnection}
                  disabled={loading}
                >
                  {loading ? 'Testando...' : '🔍 Testar Conexão Completa'}
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={clearStatus}
                >
                  🗑️ Limpar Status
                </button>
              </div>
              
              {status && (
                <div className="mt-3">
                  <div className="alert alert-info">
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{status}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Páginas para Testar</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                <a href="/utentes" className="list-group-item list-group-item-action">
                  <strong>📋 Página de Utentes</strong> - Ver todos os utentes
                </a>
                <a href="/emprestimos" className="list-group-item list-group-item-action">
                  <strong>📚 Página de Empréstimos</strong> - Registrar empréstimos
                </a>
                <a href="/devolucoes" className="list-group-item list-group-item-action">
                  <strong>🔄 Página de Devoluções</strong> - Registrar devoluções
                </a>
                <a href="/relatorios" className="list-group-item list-group-item-action">
                  <strong>📊 Página de Relatórios</strong> - Ver estatísticas
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
