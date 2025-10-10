-- Delete all bank accounts except those with 'Kommunity Services' in the name
DELETE FROM bank_accounts 
WHERE institution_name != 'Kommunity Services' 
  AND bank_name != 'Kommunity Services'
  AND account_name != 'Kommunity Services';

-- Also clean up corresponding plaid_access_tokens for removed accounts
DELETE FROM plaid_access_tokens
WHERE item_id NOT IN (
  SELECT DISTINCT plaid_item_id 
  FROM bank_accounts 
  WHERE plaid_item_id IS NOT NULL
);