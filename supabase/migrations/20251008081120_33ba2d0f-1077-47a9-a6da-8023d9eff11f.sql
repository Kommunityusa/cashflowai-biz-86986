-- Fix misclassified transactions for amaury@kommunity.app account
-- This corrects transactions where the type doesn't match the actual flow of money

-- Fix transactions that should be EXPENSE (instant transfers, autopay, transfers between accounts)
-- These are money going OUT of the account
UPDATE transactions
SET type = 'expense'
WHERE user_id = 'e6d535a3-20c7-465d-8401-d9939440ea76'
  AND type = 'income'
  AND (
    LOWER(description) LIKE '%inst%xfer%'
    OR LOWER(description) LIKE '%autopay%'
    OR LOWER(description) LIKE '%transfer%between%'
  );

-- Fix transactions that should be INCOME (check deposits, cashback)
-- These are money coming INTO the account
UPDATE transactions
SET type = 'income'
WHERE user_id = 'e6d535a3-20c7-465d-8401-d9939440ea76'
  AND type = 'expense'
  AND (
    LOWER(description) LIKE '%check%deposit%'
    OR LOWER(description) LIKE '%cashback%deposit%'
  );