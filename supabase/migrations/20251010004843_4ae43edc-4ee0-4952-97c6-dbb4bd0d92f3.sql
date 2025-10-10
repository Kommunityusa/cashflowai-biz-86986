-- Delete all transactions
DELETE FROM transactions
WHERE user_id IN (SELECT id FROM auth.users);