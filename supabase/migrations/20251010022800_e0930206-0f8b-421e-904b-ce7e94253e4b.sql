-- Add unique constraint to prevent duplicate Plaid transactions
CREATE UNIQUE INDEX IF NOT EXISTS unique_plaid_transaction_id 
ON transactions(plaid_transaction_id) 
WHERE plaid_transaction_id IS NOT NULL;