import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Send, Loader2 } from 'lucide-react';

export function EmailSequenceTester() {
  const [loading, setLoading] = useState(false);
  const [emailType, setEmailType] = useState<'welcome' | 'followup' | 'monthly'>('welcome');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const { toast } = useToast();

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientEmail || !recipientName) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-sequence', {
        body: {
          type: emailType,
          to: recipientEmail,
          name: recipientName,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${emailType} email sent to ${recipientEmail}`,
      });

      setRecipientEmail('');
      setRecipientName('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">Email Sequence Tester</h3>
      </div>

      <form onSubmit={handleSendEmail} className="space-y-4">
        <div className="space-y-2">
          <Label>Email Type</Label>
          <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="welcome">Welcome Email (Immediate)</SelectItem>
              <SelectItem value="followup">Follow-up Email (2 weeks)</SelectItem>
              <SelectItem value="monthly">Monthly Insights (1 month)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {emailType === 'welcome' && 'Sent when a user first signs up'}
            {emailType === 'followup' && 'Sent 2 weeks after signup with tips'}
            {emailType === 'monthly' && 'Sent 1 month after signup with bookkeeping insights'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Recipient Name</Label>
          <Input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Recipient Email</Label>
          <Input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Email Sequence Overview:</h4>
        <ul className="space-y-2 text-sm">
          <li>📧 <strong>Welcome:</strong> Immediate - Getting started guide</li>
          <li>📧 <strong>Follow-up:</strong> 2 weeks - Tips & best practices</li>
          <li>📧 <strong>Monthly:</strong> 1 month - Bookkeeping insights & habits</li>
        </ul>
      </div>
    </Card>
  );
}