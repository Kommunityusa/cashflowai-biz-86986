import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

export function TestTransactionalEmail() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("test@example.com");

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          to: email,
          subject: "Welcome to Cash Flow AI - Account Confirmation",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10B981 0%, #047857 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to Cash Flow AI!</h1>
                </div>
                <div class="content">
                  <h2>Your account has been created successfully</h2>
                  <p>Hi there,</p>
                  <p>Thank you for signing up for Cash Flow AI. Your journey to better financial management starts here!</p>
                  <p>This is a test transactional email sent via MailerSend to confirm your email delivery is working correctly.</p>
                  <a href="https://cashflowai.biz/dashboard" class="button">Go to Dashboard</a>
                  <p>If you have any questions, feel free to reach out to our support team.</p>
                  <div class="footer">
                    <p>© 2024 Cash Flow AI. All rights reserved.</p>
                    <p>This is a transactional email sent via MailerSend</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        }
      });

      if (error) throw error;
      
      toast.success(`Test transactional email sent to ${email}!`);
      console.log("Email response:", data);
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Transactional Email
        </CardTitle>
        <CardDescription>
          Send a test welcome email using MailerSend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Recipient Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button 
          onClick={sendTestEmail} 
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? (
            <>Sending...</>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}