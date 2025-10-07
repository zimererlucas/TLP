-- Arquivo SQL seguro - verifica se dados já existem antes de inserir
-- Execute este arquivo após importar o dump principal

-- Inserir códigos postais de exemplo (apenas se não existirem)
INSERT IGNORE INTO codigo_postal (cod_postal, cod_localidade) VALUES
('1000-001', 'Lisboa'),
('1000-002', 'Lisboa'),
('2000-001', 'Santarém'),
('3000-001', 'Coimbra'),
('4000-001', 'Porto'),
('5000-001', 'Vila Real'),
('6000-001', 'Castelo Branco'),
('7000-001', 'Évora'),
('8000-001', 'Faro'),
('9000-001', 'Funchal');

-- Inserir gêneros literários (apenas se não existirem)
INSERT IGNORE INTO genero (ge_genero) VALUES
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
('Religioso');

-- Inserir editoras (apenas se não existirem)
INSERT IGNORE INTO editora (ed_nome, ed_pais) VALUES
('Editora Leya', 'Portugal'),
('Porto Editora', 'Portugal'),
('Bertrand Editora', 'Portugal'),
('Gradiva', 'Portugal'),
('Quetzal Editores', 'Portugal'),
('Tinta da China', 'Portugal'),
('Relógio D''Água', 'Portugal'),
('Dom Quixote', 'Portugal'),
('Caminho', 'Portugal'),
('Presença', 'Portugal');

-- Inserir autores (apenas se não existirem)
INSERT IGNORE INTO autor (au_nome, au_pais) VALUES
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
('Isabel Allende', 'Chile');

-- Verificar se o campo re_data_prevista existe, se não, adicionar
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'requisicao' 
     AND COLUMN_NAME = 're_data_prevista') = 0,
    'ALTER TABLE requisicao ADD COLUMN re_data_prevista DATE NULL AFTER re_data_requisicao',
    'SELECT "Campo re_data_prevista já existe" as message'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Inserir livros (apenas se não existirem)
INSERT IGNORE INTO livro (li_titulo, li_autor, li_editora, li_genero, li_ano, li_isbn) VALUES
('Memorial do Convento', 1, 1, 'Romance', 1982, '978-972-20-1234-5'),
('Os Lusíadas', 4, 2, 'Poesia', 1572, '978-972-20-2345-6'),
('O Ano da Morte de Ricardo Reis', 1, 1, 'Romance', 1984, '978-972-20-3456-7'),
('Os Maias', 3, 3, 'Romance', 1888, '978-972-20-4567-8'),
('Harry Potter e a Pedra Filosofal', 11, 4, 'Juvenil', 1997, '978-972-20-5678-9'),
('1984', 12, 5, 'Ficção Científica', 1949, '978-972-20-6789-0'),
('Cem Anos de Solidão', 13, 6, 'Romance', 1967, '978-972-20-7890-1'),
('A Cidade e as Serras', 3, 3, 'Romance', 1901, '978-972-20-8901-2'),
('O Livro do Desassossego', 2, 7, 'Romance', 1982, '978-972-20-9012-3'),
('Contos da Montanha', 3, 8, 'Conto', 1901, '978-972-20-0123-4');

-- Inserir exemplares dos livros (apenas se não existirem)
INSERT IGNORE INTO livro_exemplar (lex_li_cod, lex_estado, lex_disponivel) VALUES
-- Memorial do Convento (3 exemplares)
(1, 'Bom', 1),
(1, 'Bom', 1),
(1, 'Bom', 0),

-- Os Lusíadas (2 exemplares)
(2, 'Bom', 1),
(2, 'Bom', 0),

-- O Ano da Morte de Ricardo Reis (2 exemplares)
(3, 'Bom', 1),
(3, 'Bom', 1),

-- Os Maias (2 exemplares)
(4, 'Bom', 1),
(4, 'Bom', 0),

-- Harry Potter e a Pedra Filosofal (3 exemplares)
(5, 'Bom', 1),
(5, 'Bom', 1),
(5, 'Bom', 0),

-- 1984 (2 exemplares)
(6, 'Bom', 1),
(6, 'Bom', 0),

-- Cem Anos de Solidão (2 exemplares)
(7, 'Bom', 1),
(7, 'Bom', 1),

-- A Cidade e as Serras (1 exemplar)
(8, 'Bom', 1),

-- O Livro do Desassossego (2 exemplares)
(9, 'Bom', 1),
(9, 'Bom', 0),

-- Contos da Montanha (2 exemplares)
(10, 'Bom', 1),
(10, 'Bom', 1);

-- Inserir utentes (apenas se não existirem)
INSERT IGNORE INTO utente (ut_nome, ut_email, ut_tlm, ut_morada, ut_cod_postal) VALUES
('Maria Silva', 'maria.silva@email.com', '912345678', 'Rua da Liberdade, 123', '1000-001'),
('João Santos', 'joao.santos@email.com', '923456789', 'Avenida da República, 456', '1000-002'),
('Ana Costa', 'ana.costa@email.com', '934567890', 'Praça do Comércio, 789', '1000-001'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '945678901', 'Rua Augusta, 321', '1000-002'),
('Carla Ferreira', 'carla.ferreira@email.com', '956789012', 'Largo do Chiado, 654', '1000-001'),
('Miguel Rodrigues', 'miguel.rodrigues@email.com', '967890123', 'Rua do Carmo, 987', '1000-002'),
('Sofia Martins', 'sofia.martins@email.com', '978901234', 'Avenida da Liberdade, 147', '1000-001'),
('Ricardo Pereira', 'ricardo.pereira@email.com', '989012345', 'Rua de São Bento, 258', '1000-002'),
('Teresa Almeida', 'teresa.almeida@email.com', '990123456', 'Praça dos Restauradores, 369', '1000-001'),
('Carlos Ribeiro', 'carlos.ribeiro@email.com', '901234567', 'Rua das Flores, 741', '1000-002');

-- Inserir empréstimos de exemplo (apenas se não existirem)
INSERT IGNORE INTO requisicao (re_ut_cod, re_lex_cod, re_data_requisicao, re_data_prevista, re_data_devolucao) VALUES
-- Empréstimos devolvidos
(1, 3, '2024-01-15', '2024-01-29', '2024-01-28'),
(2, 5, '2024-01-20', '2024-02-03', '2024-02-01'),
(3, 9, '2024-02-01', '2024-02-15', '2024-02-14'),
(4, 11, '2024-02-10', '2024-02-24', '2024-02-23'),
(5, 15, '2024-02-15', '2024-03-01', '2024-02-28'),

-- Empréstimos ativos (sem data de devolução)
(6, 7, '2024-03-01', '2024-03-15', NULL),
(7, 13, '2024-03-05', '2024-03-19', NULL),
(8, 17, '2024-03-10', '2024-03-24', NULL),

-- Empréstimos em atraso
(9, 2, '2024-02-20', '2024-03-06', NULL),
(10, 6, '2024-02-25', '2024-03-11', NULL);

-- Atualizar exemplares como indisponíveis para os empréstimos ativos
UPDATE livro_exemplar SET lex_disponivel = 0 WHERE lex_cod IN (7, 13, 17, 2, 6);

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
AND re_data_prevista < CURDATE();

