-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create trigger function for transactions
CREATE OR REPLACE FUNCTION webhook_transactions()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  operation text;
BEGIN
  -- Determine the operation type
  IF TG_OP = 'DELETE' THEN
    operation := 'DELETE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'transactions',
      'record', NULL,
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    operation := 'UPDATE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'transactions',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'INSERT' THEN
    operation := 'INSERT';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'transactions',
      'record', row_to_json(NEW),
      'old_record', NULL,
      'schema', 'public'
    );
  END IF;

  -- Send webhook
  PERFORM net.http_post(
    'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/webhook-handler',
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    payload
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for transactions table
DROP TRIGGER IF EXISTS transactions_webhook_insert ON public.transactions;
CREATE TRIGGER transactions_webhook_insert
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION webhook_transactions();

DROP TRIGGER IF EXISTS transactions_webhook_update ON public.transactions;
CREATE TRIGGER transactions_webhook_update
  AFTER UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION webhook_transactions();

DROP TRIGGER IF EXISTS transactions_webhook_delete ON public.transactions;
CREATE TRIGGER transactions_webhook_delete
  AFTER DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION webhook_transactions();

-- Create trigger function for bank_accounts
CREATE OR REPLACE FUNCTION webhook_bank_accounts()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  operation text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    operation := 'DELETE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'bank_accounts',
      'record', NULL,
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    operation := 'UPDATE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'bank_accounts',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'INSERT' THEN
    operation := 'INSERT';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'bank_accounts',
      'record', row_to_json(NEW),
      'old_record', NULL,
      'schema', 'public'
    );
  END IF;

  PERFORM net.http_post(
    'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/webhook-handler',
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    payload
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for bank_accounts table
DROP TRIGGER IF EXISTS bank_accounts_webhook_insert ON public.bank_accounts;
CREATE TRIGGER bank_accounts_webhook_insert
  AFTER INSERT ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION webhook_bank_accounts();

DROP TRIGGER IF EXISTS bank_accounts_webhook_update ON public.bank_accounts;
CREATE TRIGGER bank_accounts_webhook_update
  AFTER UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION webhook_bank_accounts();

DROP TRIGGER IF EXISTS bank_accounts_webhook_delete ON public.bank_accounts;
CREATE TRIGGER bank_accounts_webhook_delete
  AFTER DELETE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION webhook_bank_accounts();

-- Create trigger function for budgets
CREATE OR REPLACE FUNCTION webhook_budgets()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  operation text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    operation := 'DELETE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'budgets',
      'record', NULL,
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    operation := 'UPDATE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'budgets',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'INSERT' THEN
    operation := 'INSERT';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'budgets',
      'record', row_to_json(NEW),
      'old_record', NULL,
      'schema', 'public'
    );
  END IF;

  PERFORM net.http_post(
    'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/webhook-handler',
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    payload
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for budgets table
DROP TRIGGER IF EXISTS budgets_webhook_insert ON public.budgets;
CREATE TRIGGER budgets_webhook_insert
  AFTER INSERT ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION webhook_budgets();

DROP TRIGGER IF EXISTS budgets_webhook_update ON public.budgets;
CREATE TRIGGER budgets_webhook_update
  AFTER UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION webhook_budgets();

DROP TRIGGER IF EXISTS budgets_webhook_delete ON public.budgets;
CREATE TRIGGER budgets_webhook_delete
  AFTER DELETE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION webhook_budgets();

-- Create trigger function for invoices
CREATE OR REPLACE FUNCTION webhook_invoices()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  operation text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    operation := 'DELETE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'invoices',
      'record', NULL,
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    operation := 'UPDATE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'invoices',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'INSERT' THEN
    operation := 'INSERT';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'invoices',
      'record', row_to_json(NEW),
      'old_record', NULL,
      'schema', 'public'
    );
  END IF;

  PERFORM net.http_post(
    'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/webhook-handler',
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    payload
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for invoices table
DROP TRIGGER IF EXISTS invoices_webhook_insert ON public.invoices;
CREATE TRIGGER invoices_webhook_insert
  AFTER INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION webhook_invoices();

DROP TRIGGER IF EXISTS invoices_webhook_update ON public.invoices;
CREATE TRIGGER invoices_webhook_update
  AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION webhook_invoices();

DROP TRIGGER IF EXISTS invoices_webhook_delete ON public.invoices;
CREATE TRIGGER invoices_webhook_delete
  AFTER DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION webhook_invoices();

-- Create trigger function for recurring_transactions
CREATE OR REPLACE FUNCTION webhook_recurring_transactions()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  operation text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    operation := 'DELETE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'recurring_transactions',
      'record', NULL,
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    operation := 'UPDATE';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'recurring_transactions',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'schema', 'public'
    );
  ELSIF TG_OP = 'INSERT' THEN
    operation := 'INSERT';
    payload := jsonb_build_object(
      'type', operation,
      'table', 'recurring_transactions',
      'record', row_to_json(NEW),
      'old_record', NULL,
      'schema', 'public'
    );
  END IF;

  PERFORM net.http_post(
    'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/webhook-handler',
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    payload
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for recurring_transactions table
DROP TRIGGER IF EXISTS recurring_transactions_webhook_insert ON public.recurring_transactions;
CREATE TRIGGER recurring_transactions_webhook_insert
  AFTER INSERT ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION webhook_recurring_transactions();

DROP TRIGGER IF EXISTS recurring_transactions_webhook_update ON public.recurring_transactions;
CREATE TRIGGER recurring_transactions_webhook_update
  AFTER UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION webhook_recurring_transactions();

DROP TRIGGER IF EXISTS recurring_transactions_webhook_delete ON public.recurring_transactions;
CREATE TRIGGER recurring_transactions_webhook_delete
  AFTER DELETE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION webhook_recurring_transactions();