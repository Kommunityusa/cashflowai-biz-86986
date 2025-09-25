-- Create a function to fix transaction types based on common patterns
CREATE OR REPLACE FUNCTION fix_transaction_types()
RETURNS void AS $$
BEGIN
  -- Fix transactions that should be expenses (money going out)
  UPDATE transactions
  SET type = 'expense'
  WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6'
  AND (
    -- Venmo transactions (money sent)
    LOWER(description) LIKE '%venmo%' 
    -- Fundraise/donations (money given)
    OR LOWER(description) LIKE '%fundraise%'
    OR LOWER(description) LIKE '%donation%'
    -- Transfers out
    OR LOWER(description) LIKE '%transfer from mercury to another%'
    -- Payments and purchases
    OR LOWER(description) LIKE '%payment%'
    OR LOWER(description) LIKE '%purchase%'
    -- Bills and subscriptions
    OR LOWER(description) LIKE '%bill%'
    OR LOWER(description) LIKE '%subscription%'
    -- Specific vendors that are always expenses
    OR LOWER(vendor_name) LIKE '%linkedin%'
    OR LOWER(vendor_name) LIKE '%google%'
    OR LOWER(vendor_name) LIKE '%namecheap%'
    OR LOWER(vendor_name) LIKE '%passwp%'
    OR LOWER(description) LIKE '%capital one%'
    OR LOWER(description) LIKE '%ptc ez pass%'
    OR LOWER(description) LIKE '%ads%'
  );

  -- Fix transactions that should be income (money coming in)
  UPDATE transactions
  SET type = 'income'
  WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6'
  AND (
    -- Deposits
    LOWER(description) LIKE '%deposit%'
    -- Received payments
    OR LOWER(description) LIKE '%paypal%inst xfer%connex%'
    -- Transfers between Mercury accounts (internal transfers are usually income to the receiving account)
    OR LOWER(description) LIKE '%transfer between your mercury%'
    -- Community payments received
    OR LOWER(description) LIKE '%kommunity%'
  );

  -- Additional rule: For Plaid transactions, negative amounts are expenses, positive are income
  -- This is the standard Plaid convention
  UPDATE transactions
  SET type = CASE 
    WHEN amount < 0 THEN 'expense'
    WHEN amount > 0 THEN 'income'
    ELSE type
  END
  WHERE user_id = 'c6211466-5651-4efa-a1c3-21d93d675ab6'
  AND plaid_transaction_id IS NOT NULL;

END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix all existing transactions
SELECT fix_transaction_types();

-- Drop the function after use
DROP FUNCTION fix_transaction_types();