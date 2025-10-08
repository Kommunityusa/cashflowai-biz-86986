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

interface WelcomeEmailProps {
  name: string;
  email: string;
}

export const WelcomeEmail = ({ name, email }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Cash Flow AI - Let's Get Started!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Cash Flow AI! 🎉</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          Thank you for joining Cash Flow AI! We're excited to help you streamline your bookkeeping 
          and take control of your business finances.
        </Text>

        <Section style={highlightBox}>
          <Text style={highlightText}>
            <strong>What's Next?</strong>
          </Text>
          <Text style={text}>
            ✓ Connect your bank accounts for automatic transaction syncing<br />
            ✓ Set up custom categories for your business<br />
            ✓ Enable AI-powered transaction categorization<br />
            ✓ Generate your first financial report
          </Text>
        </Section>

        <Button
          href="https://cashflowai.biz/dashboard"
          style={button}
        >
          Get Started Now
        </Button>

        <Hr style={hr} />

        <Text style={text}>
          <strong>Need Help?</strong><br />
          Our support team is here for you. Check out our{' '}
          <Link href="https://cashflowai.biz/blog" style={link}>
            blog
          </Link>{' '}
          for bookkeeping tips and best practices.
        </Text>

        <Text style={footer}>
          Cash Flow AI - AI-Powered Bookkeeping Made Simple<br />
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

const highlightBox = {
  backgroundColor: '#f0f7ff',
  borderRadius: '8px',
  margin: '32px 48px',
  padding: '24px',
};

const highlightText = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
};

const button = {
  backgroundColor: '#3b82f6',
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
  color: '#3b82f6',
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

export default WelcomeEmail;