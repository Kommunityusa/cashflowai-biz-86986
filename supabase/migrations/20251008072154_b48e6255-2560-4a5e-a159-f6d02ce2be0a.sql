-- Fix the transactions status check constraint to allow 'completed' status
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add updated constraint with all valid statuses
ALTER TABLE transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'completed', 'cleared', 'reconciled', 'archived', 'void'));