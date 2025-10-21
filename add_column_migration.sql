-- Migration to add missing re_data_prevista column to requisicao table
-- Execute this in Supabase SQL Editor

ALTER TABLE requisicao ADD COLUMN IF NOT EXISTS re_data_prevista DATE;

-- Update existing records with a default date (current date + 14 days)
UPDATE requisicao
SET re_data_prevista = (re_data_requisicao + INTERVAL '14 days')::date
WHERE re_data_prevista IS NULL AND re_data_devolucao IS NULL;
