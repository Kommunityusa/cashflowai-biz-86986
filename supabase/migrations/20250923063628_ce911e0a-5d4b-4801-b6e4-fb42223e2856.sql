-- ========================================
-- CLEAN UP AND IMPROVE DATABASE STRUCTURE
-- ========================================

-- 1. Fix the transactions table status constraint issue
-- First, let's check if there's a constraint and drop it if it exists
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add a proper status enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'reconciled');
    END IF;
END $$;

-- Update the status column to use text temporarily
ALTER TABLE transactions 
ALTER COLUMN status TYPE text USING COALESCE(status, 'completed');

-- Update any invalid status values to 'completed'
UPDATE transactions 
SET status = 'completed' 
WHERE status NOT IN ('pending', 'completed', 'failed', 'cancelled', 'reconciled') 
   OR status IS NULL;

-- 2. Add missing columns for better bookkeeping
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS reconciled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reference_number text,
ADD COLUMN IF NOT EXISTS business_purpose text,
ADD COLUMN IF NOT EXISTS mileage numeric,
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_frequency text,
ADD COLUMN IF NOT EXISTS attachment_urls text[];

-- 3. Create budgets table for financial planning
CREATE TABLE IF NOT EXISTS budgets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
    amount numeric NOT NULL CHECK (amount >= 0),
    period text NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    start_date date NOT NULL,
    end_date date,
    is_active boolean DEFAULT true,
    alert_threshold numeric DEFAULT 80 CHECK (alert_threshold > 0 AND alert_threshold <= 100),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budgets
CREATE POLICY "Users can view their own budgets" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Create financial_reports table for storing generated reports
CREATE TABLE IF NOT EXISTS financial_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    report_type text NOT NULL CHECK (report_type IN ('profit_loss', 'balance_sheet', 'cash_flow', 'tax_summary', 'expense_report')),
    period_start date NOT NULL,
    period_end date NOT NULL,
    data jsonb NOT NULL,
    generated_at timestamp with time zone NOT NULL DEFAULT now(),
    file_url text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on financial_reports
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for financial_reports
CREATE POLICY "Users can view their own reports" ON financial_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" ON financial_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON financial_reports
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create recurring_transactions table for subscription management
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    category_id uuid REFERENCES categories(id),
    description text NOT NULL,
    vendor_name text,
    amount numeric NOT NULL,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    start_date date NOT NULL,
    end_date date,
    last_processed date,
    next_due_date date NOT NULL,
    is_active boolean DEFAULT true,
    auto_create boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on recurring_transactions
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recurring_transactions
CREATE POLICY "Users can view their own recurring transactions" ON recurring_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring transactions" ON recurring_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring transactions" ON recurring_transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring transactions" ON recurring_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create vendors table for better vendor management
CREATE TABLE IF NOT EXISTS vendors (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    category_id uuid REFERENCES categories(id),
    tax_id text,
    address text,
    contact_email text,
    contact_phone text,
    website text,
    notes text,
    is_1099_required boolean DEFAULT false,
    total_paid_ytd numeric DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Enable RLS on vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendors
CREATE POLICY "Users can view their own vendors" ON vendors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vendors" ON vendors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors" ON vendors
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors" ON vendors
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Add vendor_id to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL;

-- 8. Create tax_settings table for tax configuration
CREATE TABLE IF NOT EXISTS tax_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    tax_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    business_structure text CHECK (business_structure IN ('sole_proprietorship', 'llc', 'corporation', 's_corp', 'partnership')),
    ein text,
    state_tax_id text,
    quarterly_estimates boolean DEFAULT false,
    tax_rate numeric CHECK (tax_rate >= 0 AND tax_rate <= 100),
    state text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tax_settings
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tax_settings
CREATE POLICY "Users can view their own tax settings" ON tax_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tax settings" ON tax_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax settings" ON tax_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. Create invoice tables for accounts receivable
CREATE TABLE IF NOT EXISTS invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    invoice_number text NOT NULL,
    client_name text NOT NULL,
    client_email text,
    client_address text,
    issue_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
    subtotal numeric NOT NULL DEFAULT 0,
    tax_amount numeric DEFAULT 0,
    discount_amount numeric DEFAULT 0,
    total_amount numeric NOT NULL DEFAULT 0,
    notes text,
    terms text,
    paid_at timestamp with time zone,
    sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, invoice_number)
);

-- Enable RLS on invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity numeric NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL,
    total numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoice_items
CREATE POLICY "Users can view their own invoice items" ON invoice_items
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM invoices 
        WHERE invoices.id = invoice_items.invoice_id 
        AND invoices.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own invoice items" ON invoice_items
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM invoices 
        WHERE invoices.id = invoice_items.invoice_id 
        AND invoices.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own invoice items" ON invoice_items
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM invoices 
        WHERE invoices.id = invoice_items.invoice_id 
        AND invoices.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own invoice items" ON invoice_items
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM invoices 
        WHERE invoices.id = invoice_items.invoice_id 
        AND invoices.user_id = auth.uid()
    ));

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_vendor ON transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_budgets_user_active ON budgets(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(user_id, next_due_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');

-- 12. Create updated_at triggers for new tables
CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at 
    BEFORE UPDATE ON recurring_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at 
    BEFORE UPDATE ON vendors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_settings_updated_at 
    BEFORE UPDATE ON tax_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Add missing indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

-- 14. Create a view for transaction summaries
CREATE OR REPLACE VIEW transaction_summaries AS
SELECT 
    t.user_id,
    DATE_TRUNC('month', t.transaction_date) as month,
    t.type,
    c.name as category_name,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount,
    AVG(t.amount) as average_amount
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
GROUP BY t.user_id, DATE_TRUNC('month', t.transaction_date), t.type, c.name;

-- Grant access to the view
GRANT SELECT ON transaction_summaries TO authenticated;

-- 15. Add AI-related columns for better insights
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS ai_confidence_score numeric CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
ADD COLUMN IF NOT EXISTS ai_suggested_category_id uuid REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS ai_processed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false;

-- 16. Create a table for storing AI insights and predictions
CREATE TABLE IF NOT EXISTS ai_insights (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    insight_type text NOT NULL CHECK (insight_type IN ('spending_pattern', 'saving_opportunity', 'tax_deduction', 'cash_flow_prediction', 'anomaly_detection', 'budget_alert')),
    title text NOT NULL,
    description text NOT NULL,
    data jsonb,
    priority text CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    is_read boolean DEFAULT false,
    is_actionable boolean DEFAULT true,
    action_taken boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone
);

-- Enable RLS on ai_insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_insights
CREATE POLICY "Users can view their own insights" ON ai_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" ON ai_insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" ON ai_insights
    FOR DELETE USING (auth.uid() = user_id);

-- Clean up and organize
COMMENT ON TABLE transactions IS 'Core transaction data from Plaid and manual entries';
COMMENT ON TABLE bank_accounts IS 'Connected bank accounts via Plaid';
COMMENT ON TABLE categories IS 'Transaction categories for bookkeeping';
COMMENT ON TABLE budgets IS 'User-defined budgets for financial planning';
COMMENT ON TABLE financial_reports IS 'Generated financial reports and statements';
COMMENT ON TABLE recurring_transactions IS 'Recurring income and expenses';
COMMENT ON TABLE vendors IS 'Vendor management for 1099 and expense tracking';
COMMENT ON TABLE invoices IS 'Accounts receivable - invoices sent to clients';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations';