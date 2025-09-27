-- Remove the database trigger webhooks since we'll use the UI-based ones
DROP TRIGGER IF EXISTS transactions_webhook_insert ON public.transactions;
DROP TRIGGER IF EXISTS transactions_webhook_update ON public.transactions;
DROP TRIGGER IF EXISTS transactions_webhook_delete ON public.transactions;
DROP FUNCTION IF EXISTS webhook_transactions();

DROP TRIGGER IF EXISTS bank_accounts_webhook_insert ON public.bank_accounts;
DROP TRIGGER IF EXISTS bank_accounts_webhook_update ON public.bank_accounts;
DROP TRIGGER IF EXISTS bank_accounts_webhook_delete ON public.bank_accounts;
DROP FUNCTION IF EXISTS webhook_bank_accounts();

DROP TRIGGER IF EXISTS budgets_webhook_insert ON public.budgets;
DROP TRIGGER IF EXISTS budgets_webhook_update ON public.budgets;
DROP TRIGGER IF EXISTS budgets_webhook_delete ON public.budgets;
DROP FUNCTION IF EXISTS webhook_budgets();

DROP TRIGGER IF EXISTS invoices_webhook_insert ON public.invoices;
DROP TRIGGER IF EXISTS invoices_webhook_update ON public.invoices;
DROP TRIGGER IF EXISTS invoices_webhook_delete ON public.invoices;
DROP FUNCTION IF EXISTS webhook_invoices();

DROP TRIGGER IF EXISTS recurring_transactions_webhook_insert ON public.recurring_transactions;
DROP TRIGGER IF EXISTS recurring_transactions_webhook_update ON public.recurring_transactions;
DROP TRIGGER IF EXISTS recurring_transactions_webhook_delete ON public.recurring_transactions;
DROP FUNCTION IF EXISTS webhook_recurring_transactions();