/**
 * Configuração do cliente Supabase
 * Substitui a conexão MySQL do PHP original
 */

import { createClient } from '@supabase/supabase-js';

// Tipos para o banco de dados (convertidos do MySQL original)
export interface Utente {
  ut_cod: number;
  ut_nome: string;
  ut_email?: string;
  ut_tlm?: string;
  ut_morada?: string;
  ut_cod_postal?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Autor {
  au_cod: number;
  au_nome: string;
  au_pais?: string;
}

export interface Editora {
  ed_cod: number;
  ed_nome: string;
  ed_pais?: string;
}

export interface Genero {
  ge_genero: string;
}

export interface Livro {
  li_cod: number;
  li_titulo: string;
  li_autor?: number;
  li_editora?: number;
  li_genero?: string;
  li_ano?: number;
  li_isbn?: string;
  li_descricao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LivroExemplar {
  lex_cod: number;
  lex_li_cod: number;
  lex_estado?: string;
  lex_disponivel: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Requisicao {
  re_cod: number;
  re_ut_cod: number;
  re_lex_cod: number;
  re_data_requisicao: string;
  re_data_prevista: string;
  re_data_devolucao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CodigoPostal {
  cod_postal: string;
  cod_localidade: string;
}

// Configuração do cliente Supabase
const supabaseUrl = 'https://xwmtuvdyhmnicutsumke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXR1dmR5aG1uaWN1dHN1bWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzc0NzgsImV4cCI6MjA3NDgxMzQ3OH0.SrrI87xSOpwWJo_4D5-VrqBn8eZ-lOrTxGqLl3eJxCU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
);

// Funções auxiliares convertidas do PHP original
export const formatDate = (date: string | Date | null, format: string = 'dd/MM/yyyy'): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  } catch (error) {
    return 'Data inválida';
  }
};

export const calculateDueDate = (days: number = 14): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitize = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Funções de validação para exemplares
export const isExemplarDisponivel = async (exemplarId: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from('livro_exemplar')
    .select('lex_disponivel')
    .eq('lex_cod', exemplarId)
    .single();

  if (error || !data) return false;
  return data.lex_disponivel;
};

// Funções para obter informações
export const getUtenteInfo = async (utenteId: number): Promise<Utente | null> => {
  const { data, error } = await supabase
    .from('utente')
    .select('*')
    .eq('ut_cod', utenteId)
    .single();

  if (error || !data) return null;
  return data;
};

export const getLivroInfo = async (livroId: number): Promise<any | null> => {
  const { data, error } = await supabase
    .from('livro')
    .select(`
      *,
      autor:autor(au_nome),
      editora:editora(ed_nome),
      genero:genero(ge_genero)
    `)
    .eq('li_cod', livroId)
    .single();

  if (error || !data) return null;
  return data;
};

// Função para verificar empréstimos em atraso
export const hasOverdueLoans = async (utenteId: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from('requisicao')
    .select('re_cod')
    .eq('re_ut_cod', utenteId)
    .is('re_data_devolucao', null)
    .lt('re_data_prevista', new Date().toISOString().split('T')[0]);

  if (error) return false;
  return data && data.length > 0;
};

// Funções para mensagens de feedback
export const showSuccessMessage = (message: string): string => {
  return `<div class="alert alert-success alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>`;
};

export const showErrorMessage = (message: string): string => {
  return `<div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>`;
};

export const showWarningMessage = (message: string): string => {
  return `<div class="alert alert-warning alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>`;
};
