-- Schema do Supabase PostgreSQL
-- Convertido do MySQL original para PostgreSQL
-- Execute este script no SQL Editor do Supabase

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de códigos postais
CREATE TABLE IF NOT EXISTS codigo_postal (
    cod_postal VARCHAR(10) PRIMARY KEY,
    cod_localidade VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de gêneros literários
CREATE TABLE IF NOT EXISTS genero (
    ge_genero VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de autores
CREATE TABLE IF NOT EXISTS autor (
    au_cod SERIAL PRIMARY KEY,
    au_nome VARCHAR(100) NOT NULL,
    au_pais VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de editoras
CREATE TABLE IF NOT EXISTS editora (
    ed_cod SERIAL PRIMARY KEY,
    ed_nome VARCHAR(100) NOT NULL,
    ed_pais VARCHAR(50),
    ed_morada TEXT,
    ed_cod_postal VARCHAR(10) REFERENCES codigo_postal(cod_postal),
    ed_email VARCHAR(100),
    ed_tlm VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de livros
CREATE TABLE IF NOT EXISTS livro (
    li_cod SERIAL PRIMARY KEY,
    li_titulo VARCHAR(200) NOT NULL,
    li_ano INTEGER,
    li_edicao VARCHAR(50),
    li_isbn VARCHAR(20),
    li_editora INTEGER REFERENCES editora(ed_cod),
    li_autor INTEGER REFERENCES autor(au_cod),
    li_genero VARCHAR(50) REFERENCES genero(ge_genero),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de exemplares
CREATE TABLE IF NOT EXISTS livro_exemplar (
    lex_cod SERIAL PRIMARY KEY,
    lex_li_cod INTEGER NOT NULL REFERENCES livro(li_cod) ON DELETE CASCADE,
    lex_estado VARCHAR(20) DEFAULT 'Bom',
    lex_disponivel BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários (utentes)
CREATE TABLE IF NOT EXISTS utente (
    ut_cod SERIAL PRIMARY KEY,
    ut_nome VARCHAR(100) NOT NULL,
    ut_nif VARCHAR(20) UNIQUE,
    ut_email VARCHAR(100) UNIQUE,
    ut_tlm VARCHAR(20),
    ut_morada TEXT,
    ut_cod_postal VARCHAR(10) REFERENCES codigo_postal(cod_postal),
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de requisições (empréstimos)
CREATE TABLE IF NOT EXISTS requisicao (
    re_cod SERIAL PRIMARY KEY,
    re_ut_cod INTEGER NOT NULL REFERENCES utente(ut_cod) ON DELETE CASCADE,
    re_lex_cod INTEGER NOT NULL REFERENCES livro_exemplar(lex_cod) ON DELETE CASCADE,
    re_data_requisicao DATE NOT NULL DEFAULT CURRENT_DATE,
    re_data_devolucao DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_livro_titulo ON livro(li_titulo);
CREATE INDEX IF NOT EXISTS idx_livro_autor ON livro(li_autor);
CREATE INDEX IF NOT EXISTS idx_livro_editora ON livro(li_editora);
CREATE INDEX IF NOT EXISTS idx_livro_genero ON livro(li_genero);
CREATE INDEX IF NOT EXISTS idx_livro_isbn ON livro(li_isbn);

CREATE INDEX IF NOT EXISTS idx_exemplar_livro ON livro_exemplar(lex_li_cod);
CREATE INDEX IF NOT EXISTS idx_exemplar_disponivel ON livro_exemplar(lex_disponivel);

CREATE INDEX IF NOT EXISTS idx_utente_nome ON utente(ut_nome);
CREATE INDEX IF NOT EXISTS idx_utente_email ON utente(ut_email);

CREATE INDEX IF NOT EXISTS idx_requisicao_utente ON requisicao(re_ut_cod);
CREATE INDEX IF NOT EXISTS idx_requisicao_exemplar ON requisicao(re_lex_cod);
CREATE INDEX IF NOT EXISTS idx_requisicao_data_requisicao ON requisicao(re_data_requisicao);
CREATE INDEX IF NOT EXISTS idx_requisicao_data_prevista ON requisicao(re_data_prevista);
CREATE INDEX IF NOT EXISTS idx_requisicao_data_devolucao ON requisicao(re_data_devolucao);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_codigo_postal_updated_at BEFORE UPDATE ON codigo_postal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_genero_updated_at BEFORE UPDATE ON genero FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_editora_updated_at BEFORE UPDATE ON editora FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_autor_updated_at BEFORE UPDATE ON autor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_livro_updated_at BEFORE UPDATE ON livro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_livro_exemplar_updated_at BEFORE UPDATE ON livro_exemplar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_utente_updated_at BEFORE UPDATE ON utente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requisicao_updated_at BEFORE UPDATE ON requisicao FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Configuração básica
-- Para um sistema de biblioteca escolar, podemos permitir leitura pública
-- mas restringir escrita apenas para usuários autenticados

-- Habilitar RLS em todas as tabelas
ALTER TABLE codigo_postal ENABLE ROW LEVEL SECURITY;
ALTER TABLE genero ENABLE ROW LEVEL SECURITY;
ALTER TABLE editora ENABLE ROW LEVEL SECURITY;
ALTER TABLE autor ENABLE ROW LEVEL SECURITY;
ALTER TABLE livro ENABLE ROW LEVEL SECURITY;
ALTER TABLE livro_exemplar ENABLE ROW LEVEL SECURITY;
ALTER TABLE utente ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicao ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública para dados de referência
CREATE POLICY "Permitir leitura pública de códigos postais" ON codigo_postal FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de gêneros" ON genero FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de editoras" ON editora FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de autores" ON autor FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de livros" ON livro FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de exemplares" ON livro_exemplar FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de utentes" ON utente FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de requisições" ON requisicao FOR SELECT USING (true);

-- Políticas de escrita para usuários autenticados
CREATE POLICY "Permitir escrita de códigos postais para usuários autenticados" ON codigo_postal FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir escrita de gêneros para usuários autenticados" ON genero FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir escrita de editoras para usuários autenticados" ON editora FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir escrita de autores para usuários autenticados" ON autor FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir escrita de livros para usuários autenticados" ON livro FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir escrita de exemplares para usuários autenticados" ON livro_exemplar FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir escrita de utentes para usuários autenticados" ON utente FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir escrita de requisições para usuários autenticados" ON requisicao FOR ALL USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE codigo_postal IS 'Códigos postais portugueses';
COMMENT ON TABLE genero IS 'Gêneros literários';
COMMENT ON TABLE editora IS 'Editoras de livros';
COMMENT ON TABLE autor IS 'Autores de livros';
COMMENT ON TABLE livro IS 'Catálogo de livros';
COMMENT ON TABLE livro_exemplar IS 'Exemplares físicos dos livros';
COMMENT ON TABLE utente IS 'Usuários da biblioteca';
COMMENT ON TABLE requisicao IS 'Empréstimos e devoluções';

-- Inserir dados de exemplo (convertidos do MySQL original)
INSERT INTO codigo_postal (cod_postal, cod_localidade) VALUES
('1000-001', 'Lisboa'),
('1000-002', 'Lisboa'),
('2000-001', 'Santarém'),
('3000-001', 'Coimbra'),
('4000-001', 'Porto'),
('5000-001', 'Vila Real'),
('6000-001', 'Castelo Branco'),
('7000-001', 'Évora'),
('8000-001', 'Faro'),
('9000-001', 'Funchal')
ON CONFLICT (cod_postal) DO NOTHING;

INSERT INTO genero (ge_genero) VALUES
('Ficção Científica'),
('Romance'),
('História'),
('Biografia'),
('Poesia'),
('Teatro'),
('Conto'),
('Ensaio'),
('Infantil'),
('Juvenil'),
('Técnico'),
('Religioso')
ON CONFLICT (ge_genero) DO NOTHING;

INSERT INTO editora (ed_nome, ed_pais) VALUES
('Editora Leya', 'Portugal'),
('Porto Editora', 'Portugal'),
('Bertrand Editora', 'Portugal'),
('Gradiva', 'Portugal'),
('Quetzal Editores', 'Portugal'),
('Tinta da China', 'Portugal'),
('Relógio D''Água', 'Portugal'),
('Dom Quixote', 'Portugal'),
('Caminho', 'Portugal'),
('Presença', 'Portugal')
ON CONFLICT DO NOTHING;

INSERT INTO autor (au_nome, au_pais) VALUES
('José Saramago', 'Portugal'),
('Fernando Pessoa', 'Portugal'),
('Eça de Queirós', 'Portugal'),
('Luís de Camões', 'Portugal'),
('Sophia de Mello Breyner', 'Portugal'),
('António Lobo Antunes', 'Portugal'),
('Lídia Jorge', 'Portugal'),
('Gonçalo M. Tavares', 'Portugal'),
('Valter Hugo Mãe', 'Portugal'),
('Dulce Maria Cardoso', 'Portugal'),
('J.K. Rowling', 'Reino Unido'),
('George Orwell', 'Reino Unido'),
('Gabriel García Márquez', 'Colômbia'),
('Mario Vargas Llosa', 'Peru'),
('Isabel Allende', 'Chile')
ON CONFLICT DO NOTHING;

-- Inserir livros de exemplo
INSERT INTO livro (li_titulo, li_ano, li_edicao, li_isbn, li_editora, li_autor, li_genero) VALUES
('Memorial do Convento', 1982, '1ª Edição', '978-972-20-1234-5', 1, 1, 'Romance'),
('Os Lusíadas', 1572, 'Edição Clássica', '978-972-20-2345-6', 2, 4, 'Poesia'),
('O Ano da Morte de Ricardo Reis', 1984, '2ª Edição', '978-972-20-3456-7', 1, 1, 'Romance'),
('Os Maias', 1888, 'Edição Histórica', '978-972-20-4567-8', 3, 3, 'Romance'),
('Harry Potter e a Pedra Filosofal', 1997, '1ª Edição Portuguesa', '978-972-20-5678-9', 4, 11, 'Juvenil'),
('1984', 1949, 'Edição Clássica', '978-972-20-6789-0', 5, 12, 'Ficção Científica'),
('Cem Anos de Solidão', 1967, 'Edição Especial', '978-972-20-7890-1', 6, 13, 'Romance'),
('A Cidade e as Serras', 1901, 'Edição Histórica', '978-972-20-8901-2', 3, 3, 'Romance'),
('O Livro do Desassossego', 1982, '1ª Edição', '978-972-20-9012-3', 7, 2, 'Romance'),
('Contos da Montanha', 1901, 'Edição Clássica', '978-972-20-0123-4', 8, 3, 'Conto')
ON CONFLICT DO NOTHING;

-- Inserir exemplares de exemplo
INSERT INTO livro_exemplar (lex_li_cod, lex_estado, lex_disponivel) VALUES
-- Memorial do Convento (3 exemplares)
(1, 'Bom', true),
(1, 'Bom', true),
(1, 'Bom', false),
-- Os Lusíadas (2 exemplares)
(2, 'Bom', true),
(2, 'Bom', false),
-- O Ano da Morte de Ricardo Reis (2 exemplares)
(3, 'Bom', true),
(3, 'Bom', true),
-- Os Maias (2 exemplares)
(4, 'Bom', true),
(4, 'Bom', false),
-- Harry Potter e a Pedra Filosofal (3 exemplares)
(5, 'Bom', true),
(5, 'Bom', true),
(5, 'Bom', false),
-- 1984 (2 exemplares)
(6, 'Bom', true),
(6, 'Bom', false),
-- Cem Anos de Solidão (2 exemplares)
(7, 'Bom', true),
(7, 'Bom', true),
-- A Cidade e as Serras (1 exemplar)
(8, 'Bom', true),
-- O Livro do Desassossego (2 exemplares)
(9, 'Bom', true),
(9, 'Bom', false),
-- Contos da Montanha (2 exemplares)
(10, 'Bom', true),
(10, 'Bom', true)
ON CONFLICT DO NOTHING;

-- Inserir utentes de exemplo
INSERT INTO utente (ut_nome, ut_nif, ut_email, ut_tlm, ut_morada, ut_cod_postal) VALUES
('Maria Silva', '123456789', 'maria.silva@email.com', '912345678', 'Rua da Liberdade, 123', '1000-001'),
('João Santos', '234567890', 'joao.santos@email.com', '923456789', 'Avenida da República, 456', '1000-002'),
('Ana Costa', '345678901', 'ana.costa@email.com', '934567890', 'Praça do Comércio, 789', '1000-001'),
('Pedro Oliveira', '456789012', 'pedro.oliveira@email.com', '945678901', 'Rua Augusta, 321', '1000-002'),
('Carla Ferreira', '567890123', 'carla.ferreira@email.com', '956789012', 'Largo do Chiado, 654', '1000-001'),
('Miguel Rodrigues', '678901234', 'miguel.rodrigues@email.com', '967890123', 'Rua do Carmo, 987', '1000-002'),
('Sofia Martins', '789012345', 'sofia.martins@email.com', '978901234', 'Avenida da Liberdade, 147', '1000-001'),
('Ricardo Pereira', '890123456', 'ricardo.pereira@email.com', '989012345', 'Rua de São Bento, 258', '1000-002'),
('Teresa Almeida', '901234567', 'teresa.almeida@email.com', '990123456', 'Praça dos Restauradores, 369', '1000-001'),
('Carlos Ribeiro', '012345678', 'carlos.ribeiro@email.com', '901234567', 'Rua das Flores, 741', '1000-002')
ON CONFLICT DO NOTHING;

-- Inserir empréstimos de exemplo
INSERT INTO requisicao (re_ut_cod, re_lex_cod, re_data_requisicao, re_data_devolucao) VALUES
-- Empréstimos devolvidos
(1, 3, '2024-01-15', '2024-01-28'),
(2, 5, '2024-01-20', '2024-02-01'),
(3, 9, '2024-02-01', '2024-02-14'),
(4, 11, '2024-02-10', '2024-02-23'),
(5, 15, '2024-02-15', '2024-02-28'),
-- Empréstimos ativos (sem data de devolução)
(6, 7, '2024-03-01', NULL),
(7, 13, '2024-03-05', NULL),
(8, 17, '2024-03-10', NULL),
-- Empréstimos em atraso
(9, 2, '2024-02-20', NULL),
(10, 6, '2024-02-25', NULL)
ON CONFLICT DO NOTHING;

-- Atualizar exemplares como indisponíveis para os empréstimos ativos
UPDATE livro_exemplar SET lex_disponivel = false WHERE lex_cod IN (7, 13, 17, 2, 6);

-- Verificar dados inseridos
SELECT 'Dados inseridos com sucesso!' as Status;

-- Estatísticas finais
SELECT 
    'Livros' as Tipo,
    COUNT(*) as Total
FROM livro
UNION ALL
SELECT 
    'Exemplares' as Tipo,
    COUNT(*) as Total
FROM livro_exemplar
UNION ALL
SELECT 
    'Utentes' as Tipo,
    COUNT(*) as Total
FROM utente
UNION ALL
SELECT 
    'Empréstimos' as Tipo,
    COUNT(*) as Total
FROM requisicao
UNION ALL
SELECT 
    'Empréstimos Ativos' as Tipo,
    COUNT(*) as Total
FROM requisicao
WHERE re_data_devolucao IS NULL
UNION ALL
SELECT 
    'Empréstimos em Atraso' as Tipo,
    COUNT(*) as Total
FROM requisicao
WHERE re_data_devolucao IS NULL 
AND re_data_prevista < CURRENT_DATE;
