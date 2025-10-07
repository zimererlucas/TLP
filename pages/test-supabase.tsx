import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

export default function TestSupabasePage() {
  const [status, setStatus] = useState('Testando conexão...');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('Conectando ao Supabase...');
      
      // Testar conexão básica
      const { data: testData, error } = await supabase
        .from('autor')
        .select('*')
        .limit(1);

      if (error) {
        setStatus(`Erro: ${error.message}`);
        console.error('Erro Supabase:', error);
      } else {
        setStatus('✅ Conexão com Supabase funcionando!');
        setData(testData);
      }
    } catch (error) {
      setStatus(`❌ Erro de conexão: ${error}`);
      console.error('Erro:', error);
    }
  };

  return (
    <Layout pageTitle="Teste de Conexão Supabase">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Teste de Conexão</h1>
          <p className="page-subtitle">Verificando conexão com o Supabase</p>
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
              {data && (
                <div>
                  <p><strong>Dados recebidos:</strong></p>
                  <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
