-- Delete all transactions created before today, keeping only the most recent Mercury import
DELETE FROM transactions
WHERE user_id IN (SELECT id FROM auth.users)
  AND DATE(created_at) < '2025-10-10';