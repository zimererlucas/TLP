import React, { useState } from 'react';
import Layout from '../components/Layout';

export default function AddSampleDataPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const addSampleData = async () => {
    setLoading(true);
    setStatus('Adicionando dados de exemplo...');

    try {
      // 1. Adicionar códigos postais
      setStatus('1. Adicionando códigos postais...');
      const codigos = [
        { cod_postal: '1000-001', cod_localidade: 'Lisboa' },
        { cod_postal: '4000-001', cod_localidade: 'Porto' },
        { cod_postal: '3000-001', cod_localidade: 'Coimbra' }
      ];

      for (const codigo of codigos) {
        await fetch('/api/codigos-postais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(codigo)
        });
      }

      // 2. Adicionar gêneros
      setStatus('2. Adicionando gêneros...');
      const generos = ['Ficção', 'Romance', 'Técnico', 'História'];
      for (const genero of generos) {
        await fetch('/api/generos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ge_genero: genero })
        });
      }

      // 3. Adicionar autores
      setStatus('3. Adicionando autores...');
      const autores = [
        { au_nome: 'José Saramago', au_pais: 'Portugal' },
        { au_nome: 'Fernando Pessoa', au_pais: 'Portugal' },
        { au_nome: 'Eça de Queirós', au_pais: 'Portugal' },
        { au_nome: 'J.K. Rowling', au_pais: 'Reino Unido' }
      ];

      for (const autor of autores) {
        await fetch('/api/autores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(autor)
        });
      }

      // 4. Adicionar editoras
      setStatus('4. Adicionando editoras...');
      const editoras = [
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
      ];

      for (const editora of editoras) {
        await fetch('/api/editoras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editora)
        });
      }

      // 5. Adicionar utentes
      setStatus('5. Adicionando utentes...');
      const utentes = [
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
      ];

      for (const utente of utentes) {
        await fetch('/api/utentes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(utente)
        });
      }

      // 6. Adicionar livros
      setStatus('6. Adicionando livros...');
      const livros = [
        {
          li_titulo: 'Memorial do Convento',
          li_ano: 1982,
          li_edicao: '1ª Edição',
          li_isbn: '978-972-665-123-4',
          li_autor: 1, // José Saramago
          li_editora: 1, // Porto Editora
          li_genero: 'Ficção'
        },
        {
          li_titulo: 'Os Maias',
          li_ano: 1888,
          li_edicao: '2ª Edição',
          li_isbn: '978-972-665-456-7',
          li_autor: 3, // Eça de Queirós
          li_editora: 2, // Bertrand Editora
          li_genero: 'Romance'
        },
        {
          li_titulo: 'Harry Potter e a Pedra Filosofal',
          li_ano: 1997,
          li_edicao: '1ª Edição',
          li_isbn: '978-972-665-789-0',
          li_autor: 4, // J.K. Rowling
          li_editora: 1, // Porto Editora
          li_genero: 'Ficção'
        }
      ];

      for (const livro of livros) {
        await fetch('/api/livros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(livro)
        });
      }

      // 7. Adicionar exemplares
      setStatus('7. Adicionando exemplares...');
      const exemplares = [
        { lex_li_cod: 1, lex_estado: 'Bom', lex_disponivel: true },
        { lex_li_cod: 1, lex_estado: 'Bom', lex_disponivel: true },
        { lex_li_cod: 2, lex_estado: 'Bom', lex_disponivel: true },
        { lex_li_cod: 2, lex_estado: 'Bom', lex_disponivel: true },
        { lex_li_cod: 3, lex_estado: 'Bom', lex_disponivel: true },
        { lex_li_cod: 3, lex_estado: 'Bom', lex_disponivel: true }
      ];

      for (const exemplar of exemplares) {
        await fetch('/api/exemplares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exemplar)
        });
      }

      setStatus('✅ Todos os dados de exemplo foram adicionados com sucesso!');
      
    } catch (error) {
      setStatus(`❌ Erro: ${error}`);
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageTitle="Adicionar Dados de Exemplo">
      <div className="row">
        <div className="col-12">
          <h1 className="page-title">Adicionar Dados de Exemplo</h1>
          <p className="page-subtitle">Adicionar dados completos de exemplo à base de dados</p>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Dados que serão adicionados</h5>
            </div>
            <div className="card-body">
              <ul>
                <li><strong>Códigos postais:</strong> Lisboa, Porto, Coimbra</li>
                <li><strong>Gêneros:</strong> Ficção, Romance, Técnico, História</li>
                <li><strong>Autores:</strong> José Saramago, Fernando Pessoa, Eça de Queirós, J.K. Rowling</li>
                <li><strong>Editoras:</strong> Porto Editora, Bertrand Editora</li>
                <li><strong>Utentes:</strong> Maria Silva, João Santos, Ana Costa</li>
                <li><strong>Livros:</strong> Memorial do Convento, Os Maias, Harry Potter</li>
                <li><strong>Exemplares:</strong> 6 exemplares dos livros</li>
              </ul>
              
              <div className="mt-3">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={addSampleData}
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : '➕ Adicionar Todos os Dados de Exemplo'}
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
