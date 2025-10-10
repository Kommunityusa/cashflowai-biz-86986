-- Remove duplicates based on date, amount, type, and similar vendor names
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        user_id, 
        transaction_date, 
        amount, 
        type,
        COALESCE(vendor_name, description)
      ORDER BY created_at DESC
    ) as row_num
  FROM transactions
)
DELETE FROM transactions
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE row_num > 1
);