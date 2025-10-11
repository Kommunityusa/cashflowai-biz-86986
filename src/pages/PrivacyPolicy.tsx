import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText, Server, Key } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy - How We Protect Your Financial Data"
        description="Cash Flow AI's privacy policy explains how we collect, use, and protect your financial data. GDPR compliant, SOC 2 certified, with AES-256 encryption."
        keywords={['privacy policy', 'data protection', 'GDPR compliance', 'financial data security']}
      />
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy - Data Protection & Security Standards</h1>
            <p className="text-muted-foreground">Effective Date: January 1, 2024</p>
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
              <p className="text-muted-foreground mb-4">
                Cash Flow AI is a product of <strong>Connex II Inc.</strong>, a Delaware corporation organized and existing under the laws of the State of Delaware, United States of America.
              </p>
              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-muted-foreground font-medium">Connex II Inc.</p>
                <p className="text-muted-foreground">A Delaware Corporation</p>
                <p className="text-muted-foreground">50 S 16th St, Floor 1700</p>
                <p className="text-muted-foreground">Philadelphia, PA 19102</p>
                <p className="text-muted-foreground">Phone: (215) 821-6061</p>
                <p className="text-muted-foreground">Email: privacy@cashflowai.biz</p>
                <p className="text-muted-foreground">Website: https://cashflowai.biz</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Our Commitment to Privacy
              </h2>
              <p className="text-muted-foreground mb-4">
                Connex II Inc., operating Cash Flow AI, takes your privacy and data security seriously. This Privacy Policy explains how we collect, 
                use, protect, and share your information when you use our financial management platform. We comply with all applicable United States federal and Delaware state privacy laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Account Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Email address and authentication credentials</li>
                    <li>Business name and contact information</li>
                    <li>Tax identification numbers (encrypted)</li>
                    <li>Phone numbers (encrypted)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Financial Data</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Bank account information via Plaid (securely tokenized)</li>
                    <li>Transaction history and categorization</li>
                    <li>Financial reports and analytics</li>
                    <li>Budget and forecast data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Login times and IP addresses</li>
                    <li>Feature usage and interactions</li>
                    <li>Device and browser information</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                Data Security Measures
              </h2>
              <div className="bg-primary/5 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Encryption Standards</h3>
                  <p className="text-muted-foreground">
                    • <strong>AES-256 Encryption:</strong> All sensitive data including tax IDs, SSNs, and financial documents 
                    are encrypted using industry-standard AES-256 encryption both at rest and in transit.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    • <strong>TLS/SSL:</strong> All data transmission between your browser and our servers is protected 
                    using TLS 1.3 encryption protocols.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Authentication & Access Control</h3>
                  <p className="text-muted-foreground">
                    • <strong>Secure Authentication:</strong> Password requirements include minimum 8 characters, uppercase, 
                    lowercase, numbers, and special characters.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    • <strong>Session Management:</strong> Automatic logout after 15 minutes of inactivity with 2-minute warning.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    • <strong>Rate Limiting:</strong> Protection against brute force attacks with maximum 5 login attempts 
                    per 15 minutes.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Row-Level Security (RLS)</h3>
                  <p className="text-muted-foreground">
                    • Each user can only access their own data through database-level security policies.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    • Multi-tenant isolation ensures complete data separation between accounts.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Audit Logging</h3>
                  <p className="text-muted-foreground">
                    • Comprehensive tracking of all user actions and system events.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    • Login attempts (successful and failed) are logged with IP addresses.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    • All data access and modifications are recorded for security monitoring.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Key className="h-6 w-6 text-primary" />
                Third-Party Integrations
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Plaid</h3>
                  <p className="text-muted-foreground">
                    We use Plaid to securely connect to your bank accounts. Plaid is a trusted financial services provider 
                    that uses bank-level encryption. We never store your banking credentials - only secure access tokens.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Google OAuth</h3>
                  <p className="text-muted-foreground">
                    We use Google OAuth for authentication services. When you sign in with Google, we only access your basic profile information 
                    (name, email, profile picture) with your explicit consent. We do not access or store any other Google account data. 
                    Your use of Google sign-in is subject to Google's Privacy Policy and Terms of Service.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">OpenAI</h3>
                  <p className="text-muted-foreground">
                    AI-powered insights are generated using OpenAI's API. Financial data sent for analysis is anonymized 
                    and processed securely without storing personal identifiers. No personal information is retained by OpenAI.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Stripe</h3>
                  <p className="text-muted-foreground">
                    Payment processing is handled by Stripe, Inc., a PCI-DSS compliant payment processor. We never store credit card 
                    information directly. All payment data is encrypted and processed securely through Stripe's infrastructure.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Supabase</h3>
                  <p className="text-muted-foreground">
                    Our infrastructure is powered by Supabase, which provides enterprise-grade security, automatic backups, 
                    and SOC 2 Type II compliance.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Retention & Deletion</h2>
              <p className="text-muted-foreground mb-3">
                • We retain your data only as long as necessary to provide our services or as required by law.
              </p>
              <p className="text-muted-foreground mb-3">
                • Transaction data is retained for 7 years for tax compliance purposes.
              </p>
              <p className="text-muted-foreground mb-3">
                • You can request data deletion at any time, and we will process your request within 30 days.
              </p>
              <p className="text-muted-foreground">
                • Audit logs are retained for 90 days for security monitoring purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="text-muted-foreground mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request data deletion</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Disable AI-powered features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Breach Response</h2>
              <p className="text-muted-foreground">
                In the unlikely event of a data breach, we will:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Notify affected users within 72 hours</li>
                <li>Provide details about what data was compromised</li>
                <li>Take immediate steps to secure the breach</li>
                <li>Offer credit monitoring services if sensitive financial data is affected</li>
                <li>Cooperate with regulatory authorities as required</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">California Privacy Rights (CCPA)</h2>
              <p className="text-muted-foreground mb-3">
                California residents have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Right to know what personal information is collected</li>
                <li>Right to know whether personal information is sold or disclosed</li>
                <li>Right to opt-out of the sale of personal information</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                <strong>We do not sell your personal information to third parties.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
              <p className="text-muted-foreground">
                Cash Flow AI operates from the United States. If you access our services from outside the United States, 
                your information will be transferred to and processed in the United States in accordance with this Privacy Policy 
                and applicable United States laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal 
                information from children under 18. If we become aware that we have collected personal information from 
                a child under 18, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="text-muted-foreground mb-3">
                For privacy-related questions, concerns, or to exercise your privacy rights, please contact our Data Protection Officer:
              </p>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground font-medium">Connex II Inc.</p>
                <p className="text-muted-foreground">Attn: Data Protection Officer</p>
                <p className="text-muted-foreground">50 S 16th St, Floor 1700</p>
                <p className="text-muted-foreground">Philadelphia, PA 19102</p>
                <p className="text-muted-foreground">Phone: (215) 821-6061</p>
                <p className="text-muted-foreground">Email: privacy@cashflowai.biz</p>
                <p className="text-muted-foreground">Website: https://cashflowai.biz</p>
                <p className="text-muted-foreground mt-2">For general inquiries: support@cashflowai.biz</p>
              </div>
            </section>

            <section className="border-t pt-8">
              <p className="text-sm text-muted-foreground">
                This Privacy Policy was last updated on {new Date().toLocaleDateString()}. We may update this policy 
                from time to time, and will notify you of any material changes via email or through the application.
              </p>
            </section>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}