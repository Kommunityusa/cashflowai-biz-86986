-- Delete all transactions to re-import with correct types
DELETE FROM transactions
WHERE user_id IN (SELECT id FROM auth.users);