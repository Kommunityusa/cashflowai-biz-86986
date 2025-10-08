-- FIX: Transfers TO external banks (Jonestown) are money going OUT = EXPENSE
-- These "Transfer from Mercury to another bank account" are withdrawals to external accounts

UPDATE transactions
SET type = 'expense'
WHERE description ILIKE '%transfer from mercury to another bank account%'
  AND description ILIKE '%jonestown%'
  AND type = 'income';

-- FIX: STRIPE transfers that are actually payments going OUT
UPDATE transactions
SET type = 'expense'
WHERE description ILIKE '%stripe; transfer%'
  AND type = 'income';

-- FIX: KOMMUNITY payments to South SF Learning Center could be either:
-- If it says "Stripe Cap" it's likely a Stripe Capital repayment (expense)
UPDATE transactions
SET type = 'expense'
WHERE description ILIKE '%kommunity%'
  AND description ILIKE '%stripe cap%'
  AND type = 'income';