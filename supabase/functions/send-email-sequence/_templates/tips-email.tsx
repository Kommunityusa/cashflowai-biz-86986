import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface TipsEmailProps {
  name: string;
}

export const TipsEmail = ({ name }: TipsEmailProps) => (
  <Html>
    <Head />
    <Preview>5 tips to maximize Cash Flow AI for your business</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hi {name}, here are 5 quick tips 💡</Heading>
        
        <Text style={text}>
          You've had Cash Flow AI for a week now. Here are some powerful features that can save you hours:
        </Text>

        <Section style={tipSection}>
          <Text style={tipTitle}>1. AI Auto-Categorization</Text>
          <Text style={tipText}>
            Let AI automatically categorize your transactions using IRS-approved categories. 
            Go to Transactions → Click "AI Categorize" to process all uncategorized items at once.
          </Text>
        </Section>

        <Section style={tipSection}>
          <Text style={tipTitle}>2. Set Up Categorization Rules</Text>
          <Text style={tipText}>
            Create rules once, save time forever. If you always categorize "Amazon Business" as "Office Expense", 
            set up a rule and it'll happen automatically.
          </Text>
        </Section>

        <Section style={tipSection}>
          <Text style={tipTitle}>3. Track Recurring Expenses</Text>
          <Text style={tipText}>
            Identify and monitor subscriptions and recurring payments. These often go unnoticed 
            but can add up to thousands annually.
          </Text>
        </Section>

        <Section style={tipSection}>
          <Text style={tipTitle}>4. Use the Tax Center</Text>
          <Text style={tipText}>
            Mark transactions as tax-deductible as you go. Come tax season, you'll have everything 
            organized and ready. Your future self will thank you!
          </Text>
        </Section>

        <Section style={tipSection}>
          <Text style={tipTitle}>5. Weekly Reports</Text>
          <Text style={tipText}>
            Enable weekly financial summaries in Settings to get a pulse on your cash flow 
            every Monday morning.
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Link href="https://cashflowai.biz" style={button}>
            Open Cash Flow AI
          </Link>
        </Section>

        <Text style={footer}>
          Questions? Just reply to this email - we're here to help!
          <br /><br />
          Best,<br />
          The Cash Flow AI Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default TipsEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  marginBottom: '20px',
};

const tipSection = {
  padding: '0 40px',
  marginBottom: '24px',
};

const tipTitle = {
  color: '#0066FF',
  fontSize: '18px',
  fontWeight: '600',
  marginBottom: '8px',
};

const tipText = {
  color: '#555',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
};

const ctaSection = {
  padding: '0 40px',
  marginTop: '32px',
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#0066FF',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
  marginTop: '32px',
};
