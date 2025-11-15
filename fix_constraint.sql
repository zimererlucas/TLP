-- Fix the reserva table constraint issue
-- Run this in Supabase SQL Editor

-- Drop the problematic constraint
ALTER TABLE reserva DROP CONSTRAINT IF EXISTS reserva_res_status_check;

-- Add a new constraint that allows 'aprovada' status
ALTER TABLE reserva ADD CONSTRAINT reserva_res_status_check
CHECK (res_status IN ('pendente', 'aprovada', 'rejeitada'));
