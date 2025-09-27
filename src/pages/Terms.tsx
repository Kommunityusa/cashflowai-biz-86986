import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import { FileText, Shield, AlertTriangle, Scale } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Effective Date: January 1, 2024</p>
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Agreement Between You and Connex II Inc.</h2>
              <p className="text-muted-foreground mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and <strong>Connex II Inc.</strong>, 
                a Delaware corporation ("Company", "we", "us", or "our"), concerning your access to and use of the Cash Flow AI 
                website and application (collectively, the "Service").
              </p>
              <p className="text-muted-foreground">
                By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of these 
                terms, then you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By creating an account, accessing, or using Cash Flow AI, you acknowledge that you have read, understood, and 
                agree to be bound by these Terms of Service and our Privacy Policy. You must be at least 18 years old and have 
                the legal capacity to enter into contracts to use this Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
              <p className="text-muted-foreground mb-3">
                Cash Flow AI provides:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Financial transaction tracking and categorization</li>
                <li>Bank account integration via Plaid</li>
                <li>AI-powered financial insights and recommendations</li>
                <li>Budget planning and forecasting tools</li>
                <li>Financial reporting and analytics</li>
                <li>Secure document storage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                3. Security & Data Protection
              </h2>
              <div className="bg-primary/5 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">3.1 Security Measures</h3>
                  <p className="text-muted-foreground mb-3">
                    We implement industry-standard security measures including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong>Encryption:</strong> AES-256 encryption for sensitive data at rest and TLS 1.3 for data in transit</li>
                    <li><strong>Authentication:</strong> Secure password requirements and session management with automatic timeout</li>
                    <li><strong>Access Control:</strong> Row-level security ensuring users can only access their own data</li>
                    <li><strong>Audit Logging:</strong> Comprehensive tracking of all user actions and system events</li>
                    <li><strong>Rate Limiting:</strong> Protection against brute force attacks</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">3.2 User Responsibilities</h3>
                  <p className="text-muted-foreground">
                    You are responsible for:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>Using strong, unique passwords</li>
                    <li>Promptly notifying us of any unauthorized access</li>
                    <li>Ensuring the accuracy of your financial data</li>
                    <li>Complying with all applicable laws and regulations</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Account Security</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  <strong>4.1 Password Requirements:</strong> Passwords must contain at least 8 characters, including uppercase 
                  and lowercase letters, numbers, and special characters.
                </p>
                <p className="text-muted-foreground">
                  <strong>4.2 Session Management:</strong> Sessions automatically expire after 15 minutes of inactivity for security.
                </p>
                <p className="text-muted-foreground">
                  <strong>4.3 Failed Login Attempts:</strong> Accounts are temporarily locked after 5 failed login attempts 
                  within 15 minutes.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Usage & Privacy</h2>
              <p className="text-muted-foreground mb-3">
                Your use of our Service is also governed by our Privacy Policy. Key points include:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>We never sell your personal or financial data</li>
                <li>Data is encrypted using AES-256 encryption</li>
                <li>Bank credentials are never stored - only secure tokens via Plaid</li>
                <li>AI analysis is performed on anonymized data</li>
                <li>You can request data deletion at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">6.1 Plaid Integration</h3>
                  <p className="text-muted-foreground">
                    Bank connections are facilitated through Plaid, Inc. By connecting your bank account, you agree to 
                    Plaid's Terms of Service and Privacy Policy. We only receive secure access tokens, never your banking credentials.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">6.2 AI Services</h3>
                  <p className="text-muted-foreground">
                    AI-powered features use OpenAI's services. Financial data is processed securely and anonymized before analysis.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to breach or circumvent our security measures</li>
                <li>Share your account with unauthorized users</li>
                <li>Upload malicious code or content</li>
                <li>Misrepresent your identity or business</li>
                <li>Use the Service to launder money or finance illegal activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                8. Disclaimers & Limitations
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-6 space-y-3">
                <p className="text-muted-foreground">
                  <strong>8.1 Financial Advice:</strong> Cash Flow AI provides tools and insights but does not constitute 
                  professional financial, tax, or legal advice. Consult qualified professionals for specific guidance.
                </p>
                <p className="text-muted-foreground">
                  <strong>8.2 Accuracy:</strong> While we strive for accuracy, we cannot guarantee that all financial 
                  calculations and AI insights will be error-free.
                </p>
                <p className="text-muted-foreground">
                  <strong>8.3 Service Availability:</strong> We aim for 99.9% uptime but cannot guarantee uninterrupted service.
                </p>
                <p className="text-muted-foreground">
                  <strong>8.4 Third-Party Services:</strong> We are not responsible for the availability or accuracy of 
                  third-party services like Plaid or banking institutions.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Liability Limitations</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Cash Flow AI shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use or inability to use the Service, 
                including but not limited to financial losses, lost profits, or data loss.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Connex II Inc., Cash Flow AI, its affiliates, and their respective officers, 
                directors, employees, and agents from any claims, damages, losses, or expenses arising from your violation 
                of these Terms or your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
              <p className="text-muted-foreground mb-3">
                We reserve the right to terminate or suspend your account for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Violation of these Terms of Service</li>
                <li>Suspicious or fraudulent activity</li>
                <li>Extended period of inactivity (12+ months)</li>
                <li>Non-payment of subscription fees (if applicable)</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                You may terminate your account at any time through the account settings or by contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Data Retention</h2>
              <p className="text-muted-foreground">
                Upon account termination:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Your data will be retained for 30 days for recovery purposes</li>
                <li>Tax-related records may be retained for 7 years as required by law</li>
                <li>Anonymized analytics data may be retained indefinitely</li>
                <li>You can request immediate deletion of personal data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                13. Governing Law and Dispute Resolution
              </h2>
              <p className="text-muted-foreground mb-3">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, 
                without regard to its conflict of law provisions. Connex II Inc. is organized under Delaware law, and all disputes 
                relating to these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Delaware.
              </p>
              <p className="text-muted-foreground">
                <strong>Arbitration:</strong> Any disputes arising out of or relating to these Terms or the Service shall be resolved 
                through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall 
                be conducted in Delaware, and judgment on the award may be entered in any court having jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. Material changes will be notified via email 
                or through the application at least 30 days before taking effect. Continued use of the Service after 
                changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground font-medium">Connex II Inc.</p>
                <p className="text-muted-foreground">A Delaware Corporation</p>
                <p className="text-muted-foreground">Email: legal@cashflowai.biz</p>
                <p className="text-muted-foreground">Website: https://cashflowai.biz</p>
                <p className="text-muted-foreground mt-2">For support: support@cashflowai.biz</p>
              </div>
            </section>

            <section className="border-t pt-8">
              <p className="text-sm text-muted-foreground">
                By using Cash Flow AI, you acknowledge that you have read, understood, and agree to be bound by these 
                Terms of Service as set forth by Connex II Inc. These Terms constitute the entire agreement between you 
                and Connex II Inc. regarding the use of the Service. Last updated: {new Date().toLocaleDateString()}.
              </p>
            </section>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}