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

interface FollowUpEmailProps {
  name: string;
}

export const FollowUpEmail = ({ name }: FollowUpEmailProps) => (
  <Html>
    <Head />
    <Preview>How are things going with Cash Flow AI?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>How's Your Experience So Far? 📊</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          It's been two weeks since you joined Cash Flow AI! We wanted to check in and see 
          how you're finding the platform.
        </Text>

        <Section style={tipsBox}>
          <Text style={tipsTitle}>
            <strong>Quick Tips to Maximize Cash Flow AI:</strong>
          </Text>
          
          <Section style={tipItem}>
            <Text style={tipNumber}>1️⃣</Text>
            <Text style={tipText}>
              <strong>Enable Auto-Sync:</strong> Connect all your business bank accounts for 
              real-time financial visibility.
            </Text>
          </Section>

          <Section style={tipItem}>
            <Text style={tipNumber}>2️⃣</Text>
            <Text style={tipText}>
              <strong>Set Up Categories:</strong> Customize expense categories to match your 
              business needs for better reporting.
            </Text>
          </Section>

          <Section style={tipItem}>
            <Text style={tipNumber}>3️⃣</Text>
            <Text style={tipText}>
              <strong>Use AI Categorization:</strong> Let our AI automatically categorize 
              transactions and save hours of manual work.
            </Text>
          </Section>
        </Section>

        <Button
          href="https://cashflowai.biz/dashboard"
          style={button}
        >
          Continue to Dashboard
        </Button>

        <Hr style={hr} />

        <Text style={text}>
          <strong>Need Assistance?</strong><br />
          Our team is here to help! Reply to this email or visit our{' '}
          <Link href="https://cashflowai.biz/blog" style={link}>
            knowledge base
          </Link>{' '}
          for detailed guides.
        </Text>

        <Text style={footer}>
          Cash Flow AI<br />
          Making bookkeeping effortless for small businesses<br />
          <Link href="https://cashflowai.biz" style={link}>cashflowai.biz</Link>
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

const tipsBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '32px 48px',
  padding: '24px',
};

const tipsTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  lineHeight: '26px',
  margin: '0 0 16px 0',
};

const tipItem = {
  display: 'flex',
  marginBottom: '16px',
};

const tipNumber = {
  fontSize: '24px',
  marginRight: '12px',
  minWidth: '32px',
};

const tipText = {
  color: '#444',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '4px 0',
};

const button = {
  backgroundColor: '#10b981',
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
  color: '#10b981',
  textDecoration: 'underline',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  marginTop: '32px',
  textAlign: 'center' as const,
};

export default FollowUpEmail;