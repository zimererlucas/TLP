import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function TestUtentesSimplePage() {
  const [status, setStatus] = useState('Testando...');
  const [utentes, setUtentes] = useState<any[]>([]);

  useEffect(() => {
    testUtentes();
  }, []);

  const testUtentes = async () => {
    try {
      setStatus('Buscando utentes...');
      
      const response = await fetch('/api/utentes');
      const result = await response.json();
      
      if (response.ok) {
        setUtentes(result.data || []);
        setStatus(`✅ Encontrados ${result.data?.length || 0} utentes`);
      } else {
        setStatus(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Erro de conexão: ${error}`);
    }
  };

  const addUtente = async () => {
    try {
      setStatus('Adicionando utente...');
      
      const response = await fetch('/api/utentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ut_nome: 'Teste ' + new Date().getTime(),
          ut_nif: '123456789',
          ut_email: 'teste@exemplo.com',
          ut_tlm: '912345678',
          ut_morada: 'Rua Teste, 123',
          ut_cod_postal: '1000-001'
        })
      });

      if (response.ok) {
        setStatus('✅ Utente adicionado!');
        testUtentes(); // Recarregar lista
      } else {
        const result = await response.json();
        setStatus(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Erro: ${error}`);
    }
  };

  return (
    <Layout pageTitle="Teste Utentes Simples">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Teste Utentes Simples</h1>
          <p className="page-subtitle">Teste direto da API de utentes</p>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Status da Conexão</h5>
            </div>
            <div className="card-body">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Total de Utentes:</strong> {utentes.length}</p>
              
              <div className="mt-3">
                <button 
                  className="btn btn-primary me-2"
                  onClick={testUtentes}
                >
                  🔄 Recarregar Utentes
                </button>
                <button 
                  className="btn btn-success"
                  onClick={addUtente}
                >
                  ➕ Adicionar Utente de Teste
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {utentes.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5>Utentes Encontrados</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utentes.map((utente) => (
                        <tr key={utente.ut_cod}>
                          <td>{utente.ut_cod}</td>
                          <td><strong>{utente.ut_nome}</strong></td>
                          <td>{utente.ut_email || '-'}</td>
                          <td>{utente.ut_tlm || '-'}</td>
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
    </Layout>
  );
}
