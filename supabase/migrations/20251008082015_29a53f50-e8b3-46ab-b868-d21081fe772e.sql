-- Add a column to mark internal transfers (between connected accounts)
-- These should be excluded from profit/loss calculations

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_internal_transfer boolean DEFAULT false;

-- Mark transfers between Mercury accounts as internal transfers
UPDATE transactions
SET is_internal_transfer = true
WHERE description ILIKE '%transfer between your mercury accounts%';