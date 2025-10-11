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

interface SuccessStoriesEmailProps {
  name: string;
}

export const SuccessStoriesEmail = ({ name }: SuccessStoriesEmailProps) => (
  <Html>
    <Head />
    <Preview>See how small businesses are saving time with Cash Flow AI</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Real results from businesses like yours</Heading>
        
        <Text style={text}>
          Hi {name},
        </Text>

        <Text style={text}>
          Wondering what's possible with Cash Flow AI? Here are three businesses that transformed their bookkeeping:
        </Text>

        <Section style={storySection}>
          <Text style={storyTitle}>🎨 Kommunity - Creative Agency</Text>
          <Text style={quote}>
            "We went from spending 6 hours a month on bookkeeping to just 30 minutes. 
            The AI categorization is scary accurate."
          </Text>
          <Text style={result}>
            <strong>Result:</strong> Saved 5.5 hours/month, discovered $847 in uncategorized deductions
          </Text>
        </Section>

        <Section style={storySection}>
          <Text style={storyTitle}>🏗️ Hermanos Diaz - Construction</Text>
          <Text style={quote}>
            "Tax season used to be a nightmare. Now everything is organized and categorized. 
            Our CPA was impressed."
          </Text>
          <Text style={result}>
            <strong>Result:</strong> Cut tax prep time by 70%, identified $3,200 in missed deductions
          </Text>
        </Section>

        <Section style={storySection}>
          <Text style={storyTitle}>🚀 Founders Alley - Startup Incubator</Text>
          <Text style={quote}>
            "Managing finances for 12 startups was chaos. Cash Flow AI gives us real-time 
            visibility across all our portfolio companies."
          </Text>
          <Text style={result}>
            <strong>Result:</strong> Reduced errors by 90%, freed up 15 hours/week for strategic work
          </Text>
        </Section>

        <Section style={highlightSection}>
          <Text style={highlightText}>
            💡 Common thread: All three started seeing results within the first two weeks.
          </Text>
        </Section>

        <Text style={text}>
          Ready to see similar results? The features they use most:
        </Text>

        <Section style={featureList}>
          <Text style={featureItem}>✓ AI transaction categorization</Text>
          <Text style={featureItem}>✓ Automated recurring expense tracking</Text>
          <Text style={featureItem}>✓ Real-time cash flow insights</Text>
          <Text style={featureItem}>✓ One-click financial reports</Text>
        </Section>

        <Section style={ctaSection}>
          <Link href="https://cashflowai.biz" style={button}>
            Try These Features Now
          </Link>
        </Section>

        <Text style={footer}>
          Have questions? We're here to help you succeed.
          <br /><br />
          Best,<br />
          The Cash Flow AI Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SuccessStoriesEmail;

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

const storySection = {
  padding: '0 40px',
  marginBottom: '32px',
  borderLeft: '4px solid #0066FF',
  paddingLeft: '36px',
};

const storyTitle = {
  color: '#0066FF',
  fontSize: '18px',
  fontWeight: '600',
  marginBottom: '12px',
};

const quote = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  fontStyle: 'italic',
  marginBottom: '12px',
};

const result = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  backgroundColor: '#f0f7ff',
  padding: '12px',
  borderRadius: '4px',
  margin: '0',
};

const highlightSection = {
  backgroundColor: '#fff9e6',
  padding: '20px 40px',
  margin: '32px 40px',
  borderRadius: '8px',
  borderLeft: '4px solid #FFB800',
};

const highlightText = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const featureList = {
  padding: '0 40px',
  marginBottom: '24px',
};

const featureItem = {
  color: '#555',
  fontSize: '15px',
  lineHeight: '32px',
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
