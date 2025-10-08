-- Deactivate old bank accounts that don't have valid access tokens
UPDATE bank_accounts 
SET is_active = false
WHERE user_id IN (SELECT DISTINCT user_id FROM bank_accounts)
AND plaid_item_id NOT IN (SELECT item_id FROM plaid_access_tokens WHERE access_token IS NOT NULL);