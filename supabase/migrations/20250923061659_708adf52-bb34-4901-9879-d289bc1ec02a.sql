-- First, let's identify duplicates by plaid_item_id
-- We'll keep the oldest record (first created) and delete newer duplicates

WITH duplicates AS (
  SELECT 
    id,
    plaid_item_id,
    bank_name,
    account_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY plaid_item_id, user_id 
      ORDER BY created_at ASC
    ) as rn
  FROM bank_accounts
  WHERE plaid_item_id IS NOT NULL
)
DELETE FROM bank_accounts
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- Also remove any orphaned plaid_access_tokens for deleted accounts
DELETE FROM plaid_access_tokens
WHERE item_id NOT IN (
  SELECT DISTINCT plaid_item_id 
  FROM bank_accounts 
  WHERE plaid_item_id IS NOT NULL
);

-- Show remaining accounts
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