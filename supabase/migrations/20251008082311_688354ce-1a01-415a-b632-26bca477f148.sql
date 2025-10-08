-- REVERT: KOMMUNITY payments from South SF Learning Center are INCOME (customer payments)
UPDATE transactions
SET type = 'income'
WHERE description ILIKE '%kommunity%'
  AND (
    description ILIKE '%south san francisco community learning center%'
    OR description ILIKE '%stripe cap%'
  )
  AND type = 'expense';

-- REVERT: STRIPE transfers are INCOME (payments received)
UPDATE transactions
SET type = 'income'
WHERE description ILIKE '%stripe; transfer%'
  AND type = 'expense';