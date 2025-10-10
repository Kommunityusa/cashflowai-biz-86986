-- Remove all transactions imported from Plaid
DELETE FROM transactions
WHERE plaid_transaction_id IS NOT NULL;

-- Remove all Plaid access tokens
DELETE FROM plaid_access_tokens;

-- Remove Plaid-connected bank accounts
DELETE FROM bank_accounts
WHERE plaid_item_id IS NOT NULL OR plaid_account_id IS NOT NULL;