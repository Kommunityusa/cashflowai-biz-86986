import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");
const MAILERLITE_API_URL = "https://api.mailerlite.com/api/v2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates for the 7-email sequence
const emailTemplates = [
  {
    emailNumber: 1,
    dayDelay: 0, // Send immediately
    subject: "Welcome to Cash Flow AI - Your Financial Success Starts Here!",
    getContent: (name: string) => `
      <h2>Welcome to Cash Flow AI, ${name || 'Business Owner'}!</h2>
      
      <p>Thank you for joining our community of smart business owners who are transforming their financial management.</p>
      
      <h3>🎯 Quick Bookkeeping Tip #1: The Golden Hour Rule</h3>
      <p>Dedicate the first hour of each Monday to reviewing last week's transactions. This simple habit can save you 10+ hours during tax season and help you spot cash flow issues early.</p>
      
      <h3>What You Can Do Right Now:</h3>
      <ul>
        <li>✅ Connect your bank account for automatic transaction import</li>
        <li>✅ Set up your expense categories (we've added smart defaults!)</li>
        <li>✅ Enable AI categorization to save hours of manual work</li>
      </ul>
      
      <p><strong>Did you know?</strong> Our Professional plan users save an average of 8 hours per month on bookkeeping tasks with our advanced AI features.</p>
      
      <p><a href="https://cashflowai.biz/auth" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Start Your Free Trial</a></p>
      
      <p>Best regards,<br>The Cash Flow AI Team</p>
    `
  },
  {
    emailNumber: 2,
    dayDelay: 3,
    subject: "Tax Tip: How to Save Thousands with Proper Categorization",
    getContent: (name: string) => `
      <h2>Hi ${name || 'there'},</h2>
      
      <h3>💰 Bookkeeping Tip #2: Master Your Tax Deductions</h3>
      
      <p>Did you know that 93% of small businesses miss out on legitimate tax deductions simply because of poor transaction categorization?</p>
      
      <h4>Top 5 Often-Missed Business Deductions:</h4>
      <ol>
        <li><strong>Home Office Expenses</strong> - Even partial use counts!</li>
        <li><strong>Vehicle Mileage</strong> - Track every business mile at $0.67/mile (2024 rate)</li>
        <li><strong>Professional Development</strong> - Courses, books, conferences</li>
        <li><strong>Software Subscriptions</strong> - All your business tools are deductible</li>
        <li><strong>Internet & Phone Bills</strong> - Percentage used for business</li>
      </ol>
      
      <p><strong>Pro Tip:</strong> Our AI automatically identifies and categorizes these deductions. Professional plan users report finding an average of $3,200 in missed deductions!</p>
      
      <p><a href="https://cashflowai.biz/dashboard" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Upgrade to Professional - Save More on Taxes</a></p>
      
      <p>Happy saving!<br>The Cash Flow AI Team</p>
    `
  },
  {
    emailNumber: 3,
    dayDelay: 7,
    subject: "Your Weekly Cash Flow Health Check (5-Minute Guide)",
    getContent: (name: string) => `
      <h2>Hello ${name || 'there'},</h2>
      
      <h3>📊 Bookkeeping Tip #3: The 5-Minute Friday Review</h3>
      
      <p>Successful businesses review these 5 metrics every Friday:</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Metric</th>
          <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Why It Matters</th>
        </tr>
        <tr>
          <td style="padding: 8px;">Cash Position</td>
          <td style="padding: 8px;">Know your runway</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Weekly Revenue</td>
          <td style="padding: 8px;">Spot trends early</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Expense Ratio</td>
          <td style="padding: 8px;">Control spending</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Outstanding Invoices</td>
          <td style="padding: 8px;">Improve cash flow</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Unusual Transactions</td>
          <td style="padding: 8px;">Catch errors/fraud</td>
        </tr>
      </table>
      
      <p><strong>Business Plan Benefit:</strong> Get automated weekly reports with all these metrics delivered to your inbox, plus predictive cash flow forecasting!</p>
      
      <p><a href="https://cashflowai.biz/reports" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">See Your Financial Dashboard</a></p>
      
      <p>To your success,<br>The Cash Flow AI Team</p>
    `
  },
  {
    emailNumber: 4,
    dayDelay: 10,
    subject: "Warning: These 3 Bookkeeping Mistakes Cost Businesses $10,000+",
    getContent: (name: string) => `
      <h2>Important Alert for ${name || 'Business Owners'},</h2>
      
      <h3>⚠️ Bookkeeping Tip #4: Avoid These Costly Mistakes</h3>
      
      <h4>Mistake #1: Mixing Personal and Business Expenses</h4>
      <p>Cost: IRS penalties + lost deductions = Average $4,500/year</p>
      <p><strong>Solution:</strong> Separate bank accounts + our automatic categorization</p>
      
      <h4>Mistake #2: Not Reconciling Monthly</h4>
      <p>Cost: Missed fraud + errors = Average $3,200/year</p>
      <p><strong>Solution:</strong> Our AI reconciliation catches discrepancies instantly</p>
      
      <h4>Mistake #3: Waiting Until Tax Season</h4>
      <p>Cost: Rush fees + missed deductions = Average $2,800/year</p>
      <p><strong>Solution:</strong> Real-time bookkeeping with Cash Flow AI</p>
      
      <p style="background: #FEF3C7; padding: 16px; border-left: 4px solid #F59E0B;">
        <strong>Limited Time Offer:</strong> Upgrade to Professional or Business plan this week and get your first month 50% OFF! Use code: SAVE50
      </p>
      
      <p><a href="https://cashflowai.biz/pricing" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Claim Your Discount</a></p>
      
      <p>Don't let these mistakes cost you,<br>The Cash Flow AI Team</p>
    `
  },
  {
    emailNumber: 5,
    dayDelay: 14,
    subject: "How Sarah Saved $18,000 in Taxes (Case Study)",
    getContent: (name: string) => `
      <h2>Hi ${name || 'there'},</h2>
      
      <h3>💼 Real Success Story</h3>
      
      <p>Sarah runs a digital marketing agency with $250K annual revenue. Here's how Cash Flow AI transformed her finances:</p>
      
      <h4>Before Cash Flow AI:</h4>
      <ul>
        <li>❌ 15 hours/month on bookkeeping</li>
        <li>❌ $4,500/year for a bookkeeper</li>
        <li>❌ Missed quarterly tax payments (penalties!)</li>
        <li>❌ No idea about cash flow projections</li>
      </ul>
      
      <h4>After 3 Months with Business Plan:</h4>
      <ul>
        <li>✅ 2 hours/month on bookkeeping (87% reduction!)</li>
        <li>✅ Saved $4,500 bookkeeper cost</li>
        <li>✅ Found $18,000 in missed deductions</li>
        <li>✅ Never missed a tax deadline</li>
        <li>✅ 6-month cash flow visibility</li>
      </ul>
      
      <p><strong>Sarah's ROI:</strong> $22,500 saved in first year / $300 annual cost = 7,500% return!</p>
      
      <p style="background: #ECFDF5; padding: 16px; border-left: 4px solid #10B981;">
        "Cash Flow AI paid for itself in the first week. The AI caught duplicate charges I'd been paying for months!" - Sarah M., Agency Owner
      </p>
      
      <p><a href="https://cashflowai.biz/auth" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Start Your Success Story</a></p>
      
      <p>Your success awaits,<br>The Cash Flow AI Team</p>
    `
  },
  {
    emailNumber: 6,
    dayDelay: 21,
    subject: "Free Template: Year-End Tax Checklist (Save Hours!)",
    getContent: (name: string) => `
      <h2>Special Gift for ${name || 'You'}!</h2>
      
      <h3>🎁 Your Year-End Tax Preparation Checklist</h3>
      
      <p>We've created a comprehensive checklist used by CPAs to prepare for tax season:</p>
      
      <h4>✅ Documents to Gather:</h4>
      <ul>
        <li>Bank statements (all accounts)</li>
        <li>Credit card statements</li>
        <li>1099 forms from clients/platforms</li>
        <li>Receipt documentation</li>
        <li>Mileage logs</li>
        <li>Home office measurements</li>
      </ul>
      
      <h4>✅ Deductions to Review:</h4>
      <ul>
        <li>Business insurance premiums</li>
        <li>Professional services (legal, accounting)</li>
        <li>Marketing and advertising</li>
        <li>Office supplies and equipment</li>
        <li>Travel and entertainment (50% meals)</li>
        <li>Retirement contributions</li>
      </ul>
      
      <h4>✅ Year-End Strategies:</h4>
      <ul>
        <li>Accelerate expenses before Dec 31</li>
        <li>Defer income if beneficial</li>
        <li>Max out retirement contributions</li>
        <li>Purchase needed equipment (Section 179)</li>
      </ul>
      
      <p><strong>Make It Automatic:</strong> Business plan users get all this organized automatically with our year-end tax report generator!</p>
      
      <p><a href="https://cashflowai.biz/dashboard" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Automate Your Tax Prep</a></p>
      
      <p>Here to help,<br>The Cash Flow AI Team</p>
    `
  },
  {
    emailNumber: 7,
    dayDelay: 30,
    subject: "Your First Month Summary + Exclusive Offer Inside",
    getContent: (name: string) => `
      <h2>Congratulations ${name || 'on Your First Month'}!</h2>
      
      <p>It's been 30 days since you joined Cash Flow AI. Here's what successful users typically achieve by now:</p>
      
      <h3>🏆 30-Day Milestones:</h3>
      <ul>
        <li>✅ All transactions categorized and organized</li>
        <li>✅ Tax deductions identified</li>
        <li>✅ Cash flow patterns recognized</li>
        <li>✅ First monthly report generated</li>
      </ul>
      
      <h3>📈 What's Next?</h3>
      <p>Month 2 is where the magic happens:</p>
      <ul>
        <li>AI learns your patterns for 95% accurate auto-categorization</li>
        <li>Predictive insights become available</li>
        <li>Year-over-year comparisons start</li>
        <li>Tax savings opportunities multiply</li>
      </ul>
      
      <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: white;">🎉 Exclusive 30-Day Offer</h3>
        <p style="color: white;">As a thank you for joining us, here's a special upgrade offer:</p>
        <p style="color: white; font-size: 20px;"><strong>Get 3 months of any paid plan for the price of 2!</strong></p>
        <p style="color: white;">This offer expires in 48 hours and won't be repeated.</p>
      </div>
      
      <p><a href="https://cashflowai.biz/pricing" style="background: #10B981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0; font-weight: bold;">Claim Your 33% Discount Now</a></p>
      
      <p>Thank you for choosing Cash Flow AI. We're committed to your financial success!</p>
      
      <p>To your prosperity,<br>
      The Cash Flow AI Team</p>
      
      <p style="font-size: 12px; color: #666; margin-top: 32px;">
        P.S. After this email, we'll only send you important updates and our monthly newsletter with tax tips. 
        You can adjust your preferences anytime in your account settings.
      </p>
    `
  }
];

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (!MAILERLITE_API_KEY) {
      throw new Error("MailerLite API key not configured");
    }

    switch (path) {
      case "process-welcome-sequence": {
        // This endpoint processes the welcome email sequence
        // It should be called by a cron job or after signup
        
        console.log("Processing welcome email sequence");

        // Get all subscribers who need emails
        const { data: subscribers, error: fetchError } = await supabase
          .from("email_subscribers")
          .select("*")
          .eq("unsubscribed", false)
          .lt("last_email_sent", 7); // Only those who haven't received all 7 emails

        if (fetchError) {
          console.error("Error fetching subscribers:", fetchError);
          throw fetchError;
        }

        console.log(`Found ${subscribers?.length || 0} subscribers to process`);

        const results = [];
        
        for (const subscriber of subscribers || []) {
          const daysSinceSubscribed = Math.floor(
            (Date.now() - new Date(subscriber.subscribed_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Find which email to send next
          const nextEmailIndex = subscriber.last_email_sent;
          const nextEmail = emailTemplates[nextEmailIndex];

          if (!nextEmail) continue;

          // Check if it's time to send this email
          if (daysSinceSubscribed >= nextEmail.dayDelay) {
            console.log(`Sending email ${nextEmail.emailNumber} to ${subscriber.email}`);

            try {
              // Send email via MailerLite
              const emailResponse = await fetch(`${MAILERLITE_API_URL}/campaigns`, {
                method: "POST",
                headers: {
                  "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  type: "regular",
                  subject: nextEmail.subject,
                  from: "support@cashflowai.biz",
                  from_name: "Cash Flow AI",
                  groups: [],
                  emails: [subscriber.email],
                }),
              });

              if (emailResponse.ok) {
                const campaign = await emailResponse.json();
                
                // Update campaign content
                await fetch(`${MAILERLITE_API_URL}/campaigns/${campaign.id}/content`, {
                  method: "PUT",
                  headers: {
                    "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    html: nextEmail.getContent(subscriber.name || ''),
                    plain: nextEmail.getContent(subscriber.name || '').replace(/<[^>]*>/g, ''),
                  }),
                });

                // Send the campaign
                await fetch(`${MAILERLITE_API_URL}/campaigns/${campaign.id}/actions/send`, {
                  method: "POST",
                  headers: {
                    "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
                  },
                });

                // Update subscriber record
                await supabase
                  .from("email_subscribers")
                  .update({
                    last_email_sent: nextEmail.emailNumber,
                    last_email_sent_at: new Date().toISOString(),
                  })
                  .eq("id", subscriber.id);

                // Log the email send
                await supabase
                  .from("email_logs")
                  .insert({
                    subscriber_id: subscriber.id,
                    email_number: nextEmail.emailNumber,
                    subject: nextEmail.subject,
                    status: "sent",
                  });

                results.push({
                  email: subscriber.email,
                  emailNumber: nextEmail.emailNumber,
                  status: "sent",
                });
              }
            } catch (error: any) {
              console.error(`Error sending email to ${subscriber.email}:`, error);
              
              // Log the error
              await supabase
                .from("email_logs")
                .insert({
                  subscriber_id: subscriber.id,
                  email_number: nextEmail.emailNumber,
                  subject: nextEmail.subject,
                  status: "error",
                  error_message: error?.message || "Unknown error",
                });
            }
          }
        }

        return new Response(JSON.stringify({ processed: results.length, results }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add-to-sequence": {
        // Add a new subscriber to the welcome sequence
        const { email, name, source } = await req.json();
        
        console.log(`Adding ${email} to welcome sequence`);

        try {
          // Check if subscriber already exists
          const { data: existing, error: checkError } = await supabase
            .from("email_subscribers")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (checkError) {
            console.error("Error checking existing subscriber:", checkError);
            throw checkError;
          }

          if (existing) {
            console.log(`Subscriber ${email} already exists`);
            return new Response(
              JSON.stringify({ message: "Subscriber already exists" }), 
              {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          // Add to our database
          const { data: newSubscriber, error: insertError } = await supabase
            .from("email_subscribers")
            .insert({
              email,
              name,
              source: source || "newsletter",
              last_email_sent: 0,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error inserting subscriber:", insertError);
            throw insertError;
          }

          console.log("Subscriber added to database:", newSubscriber.id);

          // Send the first email immediately
          const firstEmail = emailTemplates[0];
          
          try {
            console.log("Attempting to send welcome email via MailerLite");
            
            // First add subscriber to MailerLite
            const subscriberRes = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
              method: "POST",
              headers: {
                "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                name: name || '',
              }),
            });
            
            if (!subscriberRes.ok) {
              const error = await subscriberRes.text();
              console.log("MailerLite subscriber response:", error);
            }

            // Create campaign
            const emailResponse = await fetch(`${MAILERLITE_API_URL}/campaigns`, {
              method: "POST",
              headers: {
                "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "regular",
                subject: firstEmail.subject,
                from: "support@cashflowai.biz",
                from_name: "Cash Flow AI",
                groups: [],
              }),
            });

            if (emailResponse.ok) {
              const campaign = await emailResponse.json();
              console.log("Campaign created:", campaign.id);
              
              // Update content
              const contentRes = await fetch(`${MAILERLITE_API_URL}/campaigns/${campaign.id}/content`, {
                method: "PUT",
                headers: {
                  "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  html: firstEmail.getContent(name || ''),
                  plain: firstEmail.getContent(name || '').replace(/<[^>]*>/g, ''),
                }),
              });

              if (!contentRes.ok) {
                console.error("Failed to set content:", await contentRes.text());
              }

              // Send to specific email
              const sendRes = await fetch(`${MAILERLITE_API_URL}/campaigns/${campaign.id}/actions/send`, {
                method: "POST",
                headers: {
                  "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  emails: [email]
                }),
              });

              if (!sendRes.ok) {
                console.error("Failed to send:", await sendRes.text());
              } else {
                console.log("Welcome email sent successfully");
              }

              // Update subscriber
              await supabase
                .from("email_subscribers")
                .update({
                  last_email_sent: 1,
                  last_email_sent_at: new Date().toISOString(),
                })
                .eq("id", newSubscriber.id);

              // Log the email
              await supabase
                .from("email_logs")
                .insert({
                  subscriber_id: newSubscriber.id,
                  email_number: 1,
                  subject: firstEmail.subject,
                  status: "sent",
                });
            } else {
              const error = await emailResponse.text();
              console.error("Failed to create campaign:", error);
              throw new Error(`MailerLite API error: ${error}`);
            }
          } catch (emailError: any) {
            console.error("Error sending welcome email:", emailError);
            
            // Log the error but don't fail the subscription
            await supabase
              .from("email_logs")
              .insert({
                subscriber_id: newSubscriber.id,
                email_number: 1,
                subject: firstEmail.subject,
                status: "error",
                error_message: emailError?.message || "Unknown error",
              });
          }

          return new Response(
            JSON.stringify({ success: true, message: "Added to welcome sequence" }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } catch (error: any) {
          console.error("Error in add-to-sequence:", error);
          throw error;
        }
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Error in email-sequence function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);