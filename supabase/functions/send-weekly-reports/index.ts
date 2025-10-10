import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  user_id: string;
  email: string;
  full_name: string | null;
  weekly_reports: boolean;
  last_weekly_report_sent: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mailersendApiKey = Deno.env.get('MAILERSEND_API_KEY');
    
    if (!mailersendApiKey) {
      throw new Error('MAILERSEND_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who have weekly_reports enabled and haven't received one in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: usersToEmail, error: usersError } = await supabase
      .from('user_preferences')
      .select(`
        user_id,
        weekly_reports,
        last_weekly_report_sent
      `)
      .eq('weekly_reports', true)
      .or(`last_weekly_report_sent.is.null,last_weekly_report_sent.lt.${oneWeekAgo.toISOString()}`);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Found ${usersToEmail?.length || 0} users to send weekly reports to`);

    if (!usersToEmail || usersToEmail.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to send reports to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const emailResults = [];

    for (const userPref of usersToEmail) {
      try {
        // Get user profile and email from auth
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userPref.user_id);
        
        if (userError || !user) {
          console.error(`Error fetching user ${userPref.user_id}:`, userError);
          continue;
        }

        // Get user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', userPref.user_id)
          .single();

        // Get transaction summary for the week
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('user_id', userPref.user_id)
          .gte('transaction_date', oneWeekAgo.toISOString().split('T')[0]);

        const totalIncome = transactions
          ?.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const totalExpenses = transactions
          ?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const netCashFlow = totalIncome - totalExpenses;

        // Send email via MailerSend
        const emailResponse = await fetch('https://api.mailersend.com/v1/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mailersendApiKey}`,
          },
          body: JSON.stringify({
            from: {
              email: 'noreply@cashflowai.app',
              name: 'Cash Flow AI'
            },
            to: [{
              email: user.email,
              name: profile?.full_name || user.email
            }],
            subject: 'Your Weekly Financial Report',
            html: `
              <h1>Weekly Financial Summary</h1>
              <p>Hello ${profile?.full_name || 'there'},</p>
              <p>Here's your financial summary for the past week:</p>
              <ul>
                <li><strong>Total Income:</strong> $${totalIncome.toFixed(2)}</li>
                <li><strong>Total Expenses:</strong> $${totalExpenses.toFixed(2)}</li>
                <li><strong>Net Cash Flow:</strong> $${netCashFlow.toFixed(2)}</li>
                <li><strong>Transactions:</strong> ${transactions?.length || 0}</li>
              </ul>
              <p>Keep up the great work managing your finances!</p>
              <p>Best regards,<br>The Cash Flow AI Team</p>
            `,
            text: `Weekly Financial Summary\n\nHello ${profile?.full_name || 'there'},\n\nHere's your financial summary for the past week:\n\n- Total Income: $${totalIncome.toFixed(2)}\n- Total Expenses: $${totalExpenses.toFixed(2)}\n- Net Cash Flow: $${netCashFlow.toFixed(2)}\n- Transactions: ${transactions?.length || 0}\n\nKeep up the great work managing your finances!\n\nBest regards,\nThe Cash Flow AI Team`
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send email to ${user.email}:`, errorText);
          emailResults.push({ user_id: userPref.user_id, success: false, error: errorText });
          continue;
        }

        // Update last_weekly_report_sent
        await supabase
          .from('user_preferences')
          .update({ last_weekly_report_sent: new Date().toISOString() })
          .eq('user_id', userPref.user_id);

        emailResults.push({ user_id: userPref.user_id, success: true });
        console.log(`Successfully sent weekly report to ${user.email}`);

      } catch (error: any) {
        console.error(`Error processing user ${userPref.user_id}:`, error);
        emailResults.push({ user_id: userPref.user_id, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Weekly reports sent',
        total_users: usersToEmail.length,
        results: emailResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in send-weekly-reports function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
