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
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface MonthlyInsightsEmailProps {
  name: string;
}

export const MonthlyInsightsEmail = ({ name }: MonthlyInsightsEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Monthly Bookkeeping Insights Are Here</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>💡 Monthly Bookkeeping Insights</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          You've been with Cash Flow AI for a month now! Here are some key bookkeeping 
          insights and best practices to help you stay on top of your finances.
        </Text>

        <Section style={insightBox}>
          <Heading style={insightTitle}>5 Essential Bookkeeping Habits</Heading>
          
          <Section style={insightItem}>
            <Text style={insightNumber}>📅</Text>
            <div>
              <Text style={insightHeading}>1. Reconcile Weekly</Text>
              <Text style={insightText}>
                Review and reconcile your transactions at least once a week to catch errors early.
              </Text>
            </div>
          </Section>

          <Section style={insightItem}>
            <Text style={insightNumber}>💰</Text>
            <div>
              <Text style={insightHeading}>2. Track Cash Flow Daily</Text>
              <Text style={insightText}>
                Monitor incoming and outgoing cash to avoid surprises and maintain healthy cash flow.
              </Text>
            </div>
          </Section>

          <Section style={insightItem}>
            <Text style={insightNumber}>📊</Text>
            <div>
              <Text style={insightHeading}>3. Separate Business & Personal</Text>
              <Text style={insightText}>
                Keep business and personal expenses separate for cleaner books and easier tax filing.
              </Text>
            </div>
          </Section>

          <Section style={insightItem}>
            <Text style={insightNumber}>🎯</Text>
            <div>
              <Text style={insightHeading}>4. Set Budget Goals</Text>
              <Text style={insightText}>
                Create monthly budgets for different expense categories to control spending.
              </Text>
            </div>
          </Section>

          <Section style={insightItem}>
            <Text style={insightNumber}>📈</Text>
            <div>
              <Text style={insightHeading}>5. Generate Monthly Reports</Text>
              <Text style={insightText}>
                Review profit & loss statements monthly to track business performance trends.
              </Text>
            </div>
          </Section>
        </Section>

        <Section style={proTipBox}>
          <Text style={proTipLabel}>💎 Pro Tip</Text>
          <Text style={proTipText}>
            Did you know? Cash Flow AI's AI categorization learns from your patterns and gets 
            more accurate over time. Keep reviewing and correcting suggestions to train it!
          </Text>
        </Section>

        <Button
          href="https://cashflowai.biz/reports"
          style={button}
        >
          View Your Financial Reports
        </Button>

        <Hr style={hr} />

        <Text style={text}>
          <strong>Want More Insights?</strong><br />
          Check out our{' '}
          <Link href="https://cashflowai.biz/blog" style={link}>
            blog
          </Link>{' '}
          for in-depth bookkeeping guides, tax tips, and financial management strategies.
        </Text>

        <Text style={footer}>
          Cash Flow AI<br />
          Empowering small businesses with intelligent bookkeeping<br />
          <Link href="https://cashflowai.biz" style={link}>cashflowai.biz</Link> | 
          <Link href="mailto:support@cashflowai.biz" style={link}> support@cashflowai.biz</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

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
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
  textAlign: 'center' as const,
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 48px',
};

const insightBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '32px 48px',
  padding: '24px',
};

const insightTitle = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
};

const insightItem = {
  display: 'flex',
  marginBottom: '20px',
  gap: '12px',
};

const insightNumber = {
  fontSize: '24px',
  minWidth: '32px',
};

const insightHeading = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const insightText = {
  color: '#444',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const proTipBox = {
  backgroundColor: '#ede9fe',
  borderLeft: '4px solid #8b5cf6',
  borderRadius: '4px',
  margin: '32px 48px',
  padding: '16px 20px',
};

const proTipLabel = {
  color: '#6d28d9',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const proTipText = {
  color: '#444',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '6px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textDecoration: 'none',
  padding: '12px 20px',
  margin: '32px 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 48px',
};

const link = {
  color: '#8b5cf6',
  textDecoration: 'underline',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  padding: '0 48px',
  marginTop: '32px',
  textAlign: 'center' as const,
};

export default MonthlyInsightsEmail;