-- Add cursor column to plaid_access_tokens table for transaction sync
ALTER TABLE plaid_access_tokens 
ADD COLUMN IF NOT EXISTS cursor TEXT;

-- Add index for better performance when looking up by item_id
CREATE INDEX IF NOT EXISTS idx_plaid_access_tokens_item_id 
ON plaid_access_tokens(item_id);

-- Add index for bank_accounts to improve sync queries
CREATE INDEX IF NOT EXISTS idx_bank_accounts_plaid_item_id 
ON bank_accounts(plaid_item_id) 
WHERE is_active = true;