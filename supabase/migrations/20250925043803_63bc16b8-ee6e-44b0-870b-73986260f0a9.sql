-- Fix ALL transaction types based on correct money flow logic
-- Money going OUT = expense, Money coming IN = income

-- First, for all Plaid transactions, use the amount sign to determine type correctly
UPDATE transactions
SET type = CASE 
  WHEN amount > 0 AND plaid_transaction_id IS NOT NULL THEN 
    -- For Plaid transactions, we need to check the original description patterns
    CASE
      -- These are INCOME patterns (money coming IN)
      WHEN LOWER(description) LIKE '%deposit%' THEN 'income'
      WHEN LOWER(description) LIKE '%paypal%inst xfer%connex%' THEN 'income'
      WHEN LOWER(description) LIKE '%kommunity%' THEN 'income'
      WHEN LOWER(description) LIKE '%transfer between your mercury%' THEN 'income'
      -- These are EXPENSE patterns (money going OUT)
      WHEN LOWER(description) LIKE '%payment%' THEN 'expense'
      WHEN LOWER(description) LIKE '%transfer from mercury to another%' THEN 'expense'
      WHEN LOWER(vendor_name) LIKE '%linkedin%' THEN 'expense'
      WHEN LOWER(vendor_name) LIKE '%google%' THEN 'expense'
      WHEN LOWER(vendor_name) LIKE '%namecheap%' THEN 'expense'
      WHEN LOWER(vendor_name) LIKE '%passwp%' THEN 'expense'
      WHEN LOWER(description) LIKE '%capital one%' THEN 'expense'
      WHEN LOWER(description) LIKE '%ptc ez pass%' THEN 'expense'
      WHEN LOWER(description) LIKE '%ads%' THEN 'expense'
      WHEN LOWER(description) LIKE '%venmo%' THEN 'expense'
      WHEN LOWER(description) LIKE '%fundraise%' THEN 'expense'
      -- Default: if amount is positive and none of the above, likely an expense
      ELSE 'expense'
    END
  ELSE type -- Keep existing type for non-Plaid transactions
END
WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6';

-- Reset AI confidence for all transactions so they get re-categorized properly
UPDATE transactions
SET ai_confidence_score = NULL,
    needs_review = true
WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6';