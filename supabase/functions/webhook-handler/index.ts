import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  schema: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('x-supabase-signature');
    
    const payload: WebhookPayload = await req.json();
    console.log('Webhook received:', { 
      type: payload.type, 
      table: payload.table,
      recordId: payload.record?.id 
    });

    // Handle different table events
    switch (payload.table) {
      case 'transactions':
        await handleTransactionEvent(supabase, payload);
        break;
      
      case 'bank_accounts':
        await handleBankAccountEvent(supabase, payload);
        break;
      
      case 'budgets':
        await handleBudgetEvent(supabase, payload);
        break;
      
      case 'invoices':
        await handleInvoiceEvent(supabase, payload);
        break;
      
      case 'recurring_transactions':
        await handleRecurringTransactionEvent(supabase, payload);
        break;
      
      default:
        console.log(`No handler for table: ${payload.table}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function handleTransactionEvent(supabase: any, payload: WebhookPayload) {
  const { type, record, old_record } = payload;
  
  if (type === 'INSERT') {
    console.log('New transaction created:', record.id);
    
    // Auto-categorize if not already categorized
    if (!record.category_id && !record.ai_processed_at) {
      console.log('Triggering AI categorization for transaction:', record.id);
      
      // Call AI categorization function
      const { error } = await supabase.functions.invoke('ai-categorize-transactions', {
        body: { transactionIds: [record.id] }
      });
      
      if (error) {
        console.error('Failed to trigger AI categorization:', error);
      }
    }
    
    // Check budget limits if categorized
    if (record.category_id && record.user_id) {
      await checkBudgetLimits(supabase, record.user_id, record.category_id, record.amount);
    }
  } else if (type === 'UPDATE') {
    // Check if category changed
    if (old_record?.category_id !== record.category_id && record.category_id) {
      await checkBudgetLimits(supabase, record.user_id, record.category_id, record.amount);
    }
  }
}

async function handleBankAccountEvent(supabase: any, payload: WebhookPayload) {
  const { type, record } = payload;
  
  if (type === 'INSERT' && record.plaid_access_token) {
    console.log('New bank account connected:', record.id);
    
    // Trigger initial sync
    const { error } = await supabase.functions.invoke('plaid-sync', {
      body: { bankAccountId: record.id }
    });
    
    if (error) {
      console.error('Failed to trigger initial sync:', error);
    }
    
    // Generate welcome insights
    await generateWelcomeInsights(supabase, record.user_id);
  }
}

async function handleBudgetEvent(supabase: any, payload: WebhookPayload) {
  const { type, record } = payload;
  
  if (type === 'INSERT' || type === 'UPDATE') {
    console.log('Budget updated:', record.id);
    
    // Recalculate current spending for this budget
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', record.user_id)
      .eq('category_id', record.category_id)
      .eq('type', 'expense')
      .gte('transaction_date', record.start_date)
      .lte('transaction_date', record.end_date || new Date().toISOString());
    
    const totalSpent = transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const percentUsed = (totalSpent / Number(record.amount)) * 100;
    
    if (percentUsed >= Number(record.alert_threshold)) {
      await createBudgetAlert(supabase, record, totalSpent, percentUsed);
    }
  }
}

async function handleInvoiceEvent(supabase: any, payload: WebhookPayload) {
  const { type, record, old_record } = payload;
  
  if (type === 'UPDATE') {
    // Check if invoice was just marked as sent
    if (!old_record?.sent_at && record.sent_at) {
      console.log('Invoice sent:', record.id);
      // Could trigger email notification to client
    }
    
    // Check if invoice was just marked as paid
    if (!old_record?.paid_at && record.paid_at) {
      console.log('Invoice paid:', record.id);
      
      // Create income transaction
      await supabase.from('transactions').insert({
        user_id: record.user_id,
        amount: record.total_amount,
        type: 'income',
        description: `Payment received for Invoice #${record.invoice_number}`,
        transaction_date: record.paid_at,
        vendor_name: record.client_name,
        status: 'completed'
      });
      
      // Create AI insight
      await supabase.from('ai_insights').insert({
        user_id: record.user_id,
        title: 'Invoice Paid',
        description: `Invoice #${record.invoice_number} has been paid by ${record.client_name}. Amount: $${record.total_amount}`,
        insight_type: 'payment_received',
        is_actionable: false,
        priority: 'low'
      });
    }
  }
}

async function handleRecurringTransactionEvent(supabase: any, payload: WebhookPayload) {
  const { type, record } = payload;
  
  if (type === 'INSERT' && record.auto_create) {
    console.log('New recurring transaction created with auto-create:', record.id);
    
    // Schedule the first transaction if due
    const today = new Date();
    const nextDue = new Date(record.next_due_date);
    
    if (nextDue <= today) {
      await createTransactionFromRecurring(supabase, record);
    }
  }
}

async function checkBudgetLimits(supabase: any, userId: string, categoryId: string, amount: number) {
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('is_active', true);
  
  for (const budget of budgets || []) {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('type', 'expense')
      .gte('transaction_date', budget.start_date)
      .lte('transaction_date', budget.end_date || new Date().toISOString());
    
    const totalSpent = transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const percentUsed = (totalSpent / Number(budget.amount)) * 100;
    
    if (percentUsed >= Number(budget.alert_threshold)) {
      await createBudgetAlert(supabase, budget, totalSpent, percentUsed);
    }
  }
}

async function createBudgetAlert(supabase: any, budget: any, totalSpent: number, percentUsed: number) {
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', budget.category_id)
    .single();
  
  const title = percentUsed >= 100 ? 'Budget Exceeded' : 'Budget Alert';
  const priority = percentUsed >= 100 ? 'high' : 'medium';
  
  await supabase.from('ai_insights').insert({
    user_id: budget.user_id,
    title,
    description: `You've spent $${totalSpent.toFixed(2)} (${percentUsed.toFixed(0)}%) of your $${budget.amount} budget for ${category?.name || 'this category'}`,
    insight_type: 'budget_alert',
    is_actionable: true,
    priority,
    data: {
      budget_id: budget.id,
      category_id: budget.category_id,
      total_spent: totalSpent,
      budget_amount: budget.amount,
      percent_used: percentUsed
    },
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
  });
}

async function generateWelcomeInsights(supabase: any, userId: string) {
  await supabase.from('ai_insights').insert({
    user_id: userId,
    title: 'Welcome to CashFlowAI!',
    description: 'Your bank account has been successfully connected. We\'ll start analyzing your transactions to provide personalized insights.',
    insight_type: 'onboarding',
    is_actionable: false,
    priority: 'low'
  });
}

async function createTransactionFromRecurring(supabase: any, recurring: any) {
  const { error } = await supabase.from('transactions').insert({
    user_id: recurring.user_id,
    amount: recurring.amount,
    type: recurring.type,
    description: recurring.description,
    vendor_name: recurring.vendor_name,
    category_id: recurring.category_id,
    transaction_date: recurring.next_due_date,
    is_recurring: true,
    recurring_frequency: recurring.frequency,
    status: 'completed'
  });
  
  if (!error) {
    // Update next due date based on frequency
    const nextDate = calculateNextDueDate(recurring.next_due_date, recurring.frequency);
    
    await supabase
      .from('recurring_transactions')
      .update({ 
        last_processed: recurring.next_due_date,
        next_due_date: nextDate 
      })
      .eq('id', recurring.id);
  }
}

function calculateNextDueDate(currentDate: string, frequency: string): string {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'bi-weekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0];
}