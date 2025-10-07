/**
 * Cliente Supabase para Biblioteca Escolar
 * Configuração do cliente Supabase com as variáveis de ambiente
 */

import { createClient } from '@supabase/supabase-js'

// Configuração do cliente Supabase
const supabaseUrl = 'https://xwmtuvdyhmnicutsumke.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXR1dmR5aG1uaWN1dHN1bWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzc0NzgsImV4cCI6MjA3NDgxMzQ3OH0.SrrI87xSOpwWJo_4D5-VrqBn8eZ-lOrTxGqLl3eJxCU'

// Criar e exportar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para operações do servidor (API routes)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Funções auxiliares para formatação e validação
export const formatDate = (date) => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('pt-BR')
  } catch (error) {
    return 'Data inválida'
  }
}

export const calculateDueDate = (days = 14) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const sanitize = (input) => {
  return input.trim().replace(/[<>]/g, '')
}

// Funções para validação de exemplares
export const isExemplarDisponivel = async (exemplarId) => {
  const { data, error } = await supabase
    .from('livro_exemplar')
    .select('lex_disponivel')
    .eq('lex_cod', exemplarId)
    .single()

  if (error || !data) return false
  return data.lex_disponivel
}

// Funções para obter informações
export const getUtenteInfo = async (utenteId) => {
  const { data, error } = await supabase
    .from('utente')
    .select('*')
    .eq('ut_cod', utenteId)
    .single()

  if (error || !data) return null
  return data
}

export const getLivroInfo = async (livroId) => {
  const { data, error } = await supabase
    .from('livro')
    .select(`
      *,
      autor:autor(au_nome),
      editora:editora(ed_nome),
      genero:genero(ge_genero)
    `)
    .eq('li_cod', livroId)
    .single()

  if (error || !data) return null
  return data
}

// Função para verificar empréstimos em atraso
export const hasOverdueLoans = async (utenteId) => {
  const { data, error } = await supabase
    .from('requisicao')
    .select('re_cod')
    .eq('re_ut_cod', utenteId)
    .is('re_data_devolucao', null)
    .lt('re_data_requisicao', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  if (error) return false
  return data && data.length > 0
}

// Funções para mensagens de feedback
export const showSuccessMessage = (message) => {
  return `<div class="alert alert-success alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>`
}

export const showErrorMessage = (message) => {
  return `<div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>`
}

export const showWarningMessage = (message) => {
  return `<div class="alert alert-warning alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>`
}
