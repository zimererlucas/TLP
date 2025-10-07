import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

export default function TestUtentesPage() {
  const [status, setStatus] = useState('Testando conexão...');
  const [utentes, setUtentes] = useState<any[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    testUtentes();
  }, []);

  const testUtentes = async () => {
    try {
      setStatus('Conectando à tabela utente...');
      
      // Testar contagem
      const { count: totalCount, error: countError } = await supabase
        .from('utente')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        setStatus(`Erro na contagem: ${countError.message}`);
        return;
      }

      setCount(totalCount || 0);
      setStatus(`✅ Tabela utente encontrada! Total de registros: ${totalCount || 0}`);

      // Buscar alguns registros
      const { data: utentesData, error: dataError } = await supabase
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
        .limit(5);

      if (dataError) {
        setStatus(`Erro ao buscar dados: ${dataError.message}`);
        return;
      }

      setUtentes(utentesData || []);
      setStatus(`✅ Conexão funcionando! ${totalCount || 0} utentes encontrados.`);
      
    } catch (error) {
      setStatus(`❌ Erro: ${error}`);
      console.error('Erro:', error);
    }
  };

  const addSampleUtente = async () => {
    try {
      setStatus('Adicionando utente de exemplo...');
      
      const { data, error } = await supabase
        .from('utente')
        .insert({
          ut_nome: 'João Silva',
          ut_nif: '123456789',
          ut_email: 'joao@exemplo.com',
          ut_tlm: '912345678',
          ut_morada: 'Rua das Flores, 123',
          ut_cod_postal: '1000-001'
        })
        .select();

      if (error) {
        setStatus(`Erro ao adicionar: ${error.message}`);
        return;
      }

      setStatus('✅ Utente adicionado com sucesso!');
      testUtentes(); // Recarregar dados
      
    } catch (error) {
      setStatus(`❌ Erro ao adicionar: ${error}`);
    }
  };

  return (
    <Layout pageTitle="Teste de Utentes">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Teste de Utentes</h1>
          <p className="page-subtitle">Verificando dados na tabela utente</p>
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
              <p><strong>Total de Utentes:</strong> {count}</p>
              
              {count === 0 && (
                <div className="mt-3">
                  <button 
                    className="btn btn-primary"
                    onClick={addSampleUtente}
                  >
                    Adicionar Utente de Exemplo
                  </button>
                </div>
              )}
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
                        <th>NIF</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Localidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utentes.map((utente) => (
                        <tr key={utente.ut_cod}>
                          <td>{utente.ut_cod}</td>
                          <td><strong>{utente.ut_nome}</strong></td>
                          <td>{utente.ut_nif || '-'}</td>
                          <td>{utente.ut_email || '-'}</td>
                          <td>{utente.ut_tlm || '-'}</td>
                          <td>{utente.codigo_postal?.cod_localidade || '-'}</td>
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
