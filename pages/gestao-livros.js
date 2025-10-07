/**
 * Página de Gestão de Livros
 * Demonstra o uso das APIs criadas com Bootstrap
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function GestaoLivros() {
  const [livros, setLivros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLivro, setEditingLivro] = useState(null)
  const [formData, setFormData] = useState({
    li_titulo: '',
    li_ano: '',
    li_edicao: '',
    li_isbn: '',
    li_editora: '',
    li_autor: '',
    li_genero: ''
  })

  // Carregar livros ao montar o componente
  useEffect(() => {
    fetchLivros()
  }, [])

  // Buscar livros
  const fetchLivros = async () => {
    try {
      setLoading(true)
      const url = searchTerm 
        ? `/api/livros?search=${encodeURIComponent(searchTerm)}`
        : '/api/livros'
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar livros')
      }

      setLivros(data.livros || [])
      setError('')
    } catch (err) {
      setError(err.message)
      setLivros([])
    } finally {
      setLoading(false)
    }
  }

  // Buscar livros quando o termo de busca mudar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchLivros()
      } else {
        fetchLivros()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Abrir modal para criar/editar livro
  const openModal = (livro = null) => {
    if (livro) {
      setEditingLivro(livro)
      setFormData({
        li_titulo: livro.li_titulo || '',
        li_ano: livro.li_ano || '',
        li_edicao: livro.li_edicao || '',
        li_isbn: livro.li_isbn || '',
        li_editora: livro.li_editora || '',
        li_autor: livro.li_autor || '',
        li_genero: livro.li_genero || ''
      })
    } else {
      setEditingLivro(null)
      setFormData({
        li_titulo: '',
        li_ano: '',
        li_edicao: '',
        li_isbn: '',
        li_editora: '',
        li_autor: '',
        li_genero: ''
      })
    }
    setShowModal(true)
  }

  // Fechar modal
  const closeModal = () => {
    setShowModal(false)
    setEditingLivro(null)
    setFormData({
      li_titulo: '',
      li_ano: '',
      li_edicao: '',
      li_isbn: '',
      li_editora: '',
      li_autor: '',
      li_genero: ''
    })
  }

  // Salvar livro
  const saveLivro = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingLivro 
        ? `/api/livros?id=${editingLivro.li_cod}`
        : '/api/livros'
      
      const method = editingLivro ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar livro')
      }

      // Mostrar mensagem de sucesso
      showAlert('success', data.message)
      
      // Fechar modal e recarregar lista
      closeModal()
      fetchLivros()
      
    } catch (err) {
      showAlert('danger', err.message)
    }
  }

  // Excluir livro
  const deleteLivro = async (livro) => {
    if (!confirm(`Tem certeza que deseja excluir o livro "${livro.li_titulo}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/livros?id=${livro.li_cod}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir livro')
      }

      showAlert('success', data.message)
      fetchLivros()
      
    } catch (err) {
      showAlert('danger', err.message)
    }
  }

  // Mostrar alerta
  const showAlert = (type, message) => {
    const alertDiv = document.createElement('div')
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `
    
    const container = document.querySelector('.container-fluid')
    container.insertBefore(alertDiv, container.firstChild)
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove()
      }
    }, 5000)
  }

  return (
    <>
      <Head>
        <title>Gestão de Livros - Biblioteca Escolar</title>
        <meta name="description" content="Sistema de gestão de livros da biblioteca escolar" />
      </Head>

      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <h1 className="page-title">Gestão de Livros</h1>
            <p className="page-subtitle">Gerencie o catálogo de livros da biblioteca</p>
          </div>
        </div>

        {/* Barra de busca e ações */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label htmlFor="search" className="form-label">Buscar livros</label>
                    <input
                      type="text"
                      className="form-control"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Digite o título, autor, ISBN, editora ou gênero"
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg w-100"
                      onClick={() => openModal()}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Novo Livro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Lista de livros */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">
                  <i className="fas fa-book me-2"></i>
                  Catálogo de Livros
                  {searchTerm && (
                    <small className="text-muted ms-2">
                      - Resultados para "{searchTerm}"
                    </small>
                  )}
                </h3>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="loading"></div>
                    <p className="mt-2">Carregando livros...</p>
                  </div>
                ) : livros.length === 0 ? (
                  <div className="alert alert-info" role="alert">
                    <i className="fas fa-info-circle me-2"></i>
                    {searchTerm ? 'Nenhum livro encontrado para sua busca.' : 'Nenhum livro cadastrado.'}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Autor</th>
                          <th>Editora</th>
                          <th>Ano</th>
                          <th>Gênero</th>
                          <th>Exemplares</th>
                          <th>Disponíveis</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {livros.map((livro) => (
                          <tr key={livro.li_cod}>
                            <td>
                              <strong>{livro.li_titulo}</strong>
                              {livro.li_isbn && (
                                <>
                                  <br />
                                  <small className="text-muted">ISBN: {livro.li_isbn}</small>
                                </>
                              )}
                            </td>
                            <td>{livro.autor?.au_nome || 'N/A'}</td>
                            <td>{livro.editora?.ed_nome || 'N/A'}</td>
                            <td>{livro.li_ano || 'N/A'}</td>
                            <td>{livro.genero?.ge_genero || 'N/A'}</td>
                            <td>
                              <span className="badge bg-secondary">
                                {livro.total_exemplares || 0}
                              </span>
                            </td>
                            <td>
                              {livro.exemplares_disponiveis > 0 ? (
                                <span className="badge bg-success">
                                  {livro.exemplares_disponiveis}
                                </span>
                              ) : (
                                <span className="badge bg-danger">0</span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => openModal(livro)}
                                  title="Editar"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => deleteLivro(livro)}
                                  title="Excluir"
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para criar/editar livro */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-book me-2"></i>
                  {editingLivro ? 'Editar Livro' : 'Novo Livro'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <form onSubmit={saveLivro}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label htmlFor="li_titulo" className="form-label required">
                          Título do Livro
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="li_titulo"
                          value={formData.li_titulo}
                          onChange={(e) => setFormData({ ...formData, li_titulo: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="li_ano" className="form-label">Ano</label>
                        <input
                          type="number"
                          className="form-control"
                          id="li_ano"
                          value={formData.li_ano}
                          onChange={(e) => setFormData({ ...formData, li_ano: e.target.value })}
                          min="1000"
                          max="2030"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="li_edicao" className="form-label">Edição</label>
                        <input
                          type="text"
                          className="form-control"
                          id="li_edicao"
                          value={formData.li_edicao}
                          onChange={(e) => setFormData({ ...formData, li_edicao: e.target.value })}
                          placeholder="Ex: 1ª Edição"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="li_isbn" className="form-label">ISBN</label>
                        <input
                          type="text"
                          className="form-control"
                          id="li_isbn"
                          value={formData.li_isbn}
                          onChange={(e) => setFormData({ ...formData, li_isbn: e.target.value })}
                          placeholder="Ex: 978-972-20-1234-5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="li_autor" className="form-label">Autor</label>
                        <input
                          type="text"
                          className="form-control"
                          id="li_autor"
                          value={formData.li_autor}
                          onChange={(e) => setFormData({ ...formData, li_autor: e.target.value })}
                          placeholder="ID do autor"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="li_editora" className="form-label">Editora</label>
                        <input
                          type="text"
                          className="form-control"
                          id="li_editora"
                          value={formData.li_editora}
                          onChange={(e) => setFormData({ ...formData, li_editora: e.target.value })}
                          placeholder="ID da editora"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="li_genero" className="form-label">Gênero</label>
                        <input
                          type="text"
                          className="form-control"
                          id="li_genero"
                          value={formData.li_genero}
                          onChange={(e) => setFormData({ ...formData, li_genero: e.target.value })}
                          placeholder="Ex: Romance"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <i className="fas fa-save me-2"></i>
                    {editingLivro ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Overlay do modal */}
      {showModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  )
}
