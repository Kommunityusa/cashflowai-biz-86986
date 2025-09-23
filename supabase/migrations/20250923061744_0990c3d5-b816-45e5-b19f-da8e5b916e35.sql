-- Let's look at all accounts with their details to identify true duplicates
SELECT 
  id,
  bank_name,
  account_name,
  account_type,
  account_number_last4,
  plaid_account_id,
  plaid_item_id,
  current_balance,
  created_at
FROM bank_accounts
WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6'
ORDER BY account_name, created_at;

-- If you have accounts with the same account_name and account_number_last4, 
-- those are true duplicates. Let's remove them keeping only the oldest:
WITH duplicates AS (
  SELECT 
    id,
    account_name,
    account_number_last4,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, account_name, account_number_last4
      ORDER BY created_at ASC
    ) as rn
  FROM bank_accounts
  WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6'
)
DELETE FROM bank_accounts
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- Clean up orphaned tokens
DELETE FROM plaid_access_tokens
WHERE item_id NOT IN (
  SELECT DISTINCT plaid_item_id 
  FROM bank_accounts 
  WHERE plaid_item_id IS NOT NULL
);

-- Show final results
SELECT 
  id,
  bank_name,
  account_name,
  account_type,
  account_number_last4,
  plaid_item_id,
  created_at
FROM bank_accounts
WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6'
ORDER BY created_at;