-- Delete the duplicate Kommunity Marketplace account (keeping the oldest one)
DELETE FROM bank_accounts
WHERE id = '66ce84ed-db16-4cec-b86a-116a69392c1d'
AND user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6';

-- Verify the deletion
SELECT id, bank_name, account_name, account_type, account_number_last4, created_at
FROM bank_accounts
WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6'
ORDER BY account_name, created_at;