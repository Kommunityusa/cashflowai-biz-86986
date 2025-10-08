-- Add cursor column to plaid_access_tokens table for incremental transaction syncing
ALTER TABLE plaid_access_tokens 
ADD COLUMN IF NOT EXISTS cursor TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_plaid_access_tokens_item_id ON plaid_access_tokens(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_access_tokens_user_id ON plaid_access_tokens(user_id);