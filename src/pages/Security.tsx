import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Key, Database, Cloud, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Security() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Bank-Level Security & Data Protection for Philadelphia Businesses"
        description="Learn how Cash Flow AI protects your financial data with AES-256 encryption, SOC 2 compliance, and enterprise-grade security measures trusted by Philadelphia businesses."
        keywords={['bookkeeping security', 'financial data protection', 'Philadelphia secure accounting', 'encrypted bookkeeping software', 'SOC 2 compliance']}
      />
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">Enterprise-Grade Security</Badge>
            <h1 className="text-5xl font-bold text-foreground mb-4">Bank-Level Security for Philadelphia Business Financial Data</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your financial data deserves bank-level protection. Learn how we safeguard your information 
              with multiple layers of security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Lock className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">AES-256 Encryption</h3>
                  <p className="text-muted-foreground">
                    Military-grade encryption for all sensitive data including tax IDs, SSNs, and financial documents. 
                    Data is encrypted both at rest and in transit.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Row-Level Security</h3>
                  <p className="text-muted-foreground">
                    Database-level isolation ensures complete data separation. Each user can only access their own 
                    data through enforced security policies.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Key className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
                  <p className="text-muted-foreground">
                    Strong password requirements, automatic session timeout after 15 minutes of inactivity, and 
                    rate limiting to prevent brute force attacks.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Database className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Audit Logging</h3>
                  <p className="text-muted-foreground">
                    Comprehensive tracking of all user actions, login attempts, and data modifications for 
                    security monitoring and compliance.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Cloud className="h-7 w-7 text-primary" />
              Infrastructure Security
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Supabase Platform</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">SOC 2 Type II Compliance</p>
                      <p className="text-sm text-muted-foreground">Audited security controls and processes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Automatic Backups</p>
                      <p className="text-sm text-muted-foreground">Daily backups with point-in-time recovery</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">DDoS Protection</p>
                      <p className="text-sm text-muted-foreground">Enterprise-grade protection against attacks</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Network Security</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">TLS 1.3 Encryption</p>
                      <p className="text-sm text-muted-foreground">Latest encryption for data in transit</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Web Application Firewall</p>
                      <p className="text-sm text-muted-foreground">Protection against common web vulnerabilities</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">API Rate Limiting</p>
                      <p className="text-sm text-muted-foreground">Prevents abuse and ensures service availability</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Third-Party Security
            </h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-6">
                <h3 className="font-semibold mb-2">Plaid (Banking Integration)</h3>
                <p className="text-muted-foreground mb-2">
                  Bank-level security with tokenized access. We never store your banking credentials.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">SOC 2 Certified</Badge>
                  <Badge variant="outline">ISO 27001</Badge>
                  <Badge variant="outline">Bank-Grade Encryption</Badge>
                </div>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="font-semibold mb-2">OpenAI (AI Insights)</h3>
                <p className="text-muted-foreground mb-2">
                  Financial data is anonymized before processing. No personal identifiers are sent.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">Data Anonymization</Badge>
                  <Badge variant="outline">No Data Retention</Badge>
                  <Badge variant="outline">Encrypted API Calls</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-12 bg-primary/5">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-yellow-500" />
              Security Best Practices
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">For Your Account</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Use a unique, strong password (8+ characters)</li>
                  <li>• Enable two-factor authentication when available</li>
                  <li>• Log out when using shared computers</li>
                  <li>• Monitor your account for suspicious activity</li>
                  <li>• Keep your email address secure</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">What We Do</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Regular security audits and penetration testing</li>
                  <li>• Continuous monitoring for threats</li>
                  <li>• Immediate notification of any breaches</li>
                  <li>• Regular updates to security measures</li>
                  <li>• Employee security training</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Security Certifications & Compliance</h2>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="px-4 py-2" variant="secondary">
                <Shield className="h-4 w-4 mr-2" />
                SOC 2 Type II
              </Badge>
              <Badge className="px-4 py-2" variant="secondary">
                <Lock className="h-4 w-4 mr-2" />
                GDPR Compliant
              </Badge>
              <Badge className="px-4 py-2" variant="secondary">
                <Key className="h-4 w-4 mr-2" />
                PCI DSS Ready
              </Badge>
              <Badge className="px-4 py-2" variant="secondary">
                <Database className="h-4 w-4 mr-2" />
                ISO 27001
              </Badge>
            </div>

            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <h3 className="font-semibold mb-2">Questions About Security?</h3>
              <p className="text-muted-foreground mb-4">
                Our security team is here to help answer any questions about how we protect your data.
              </p>
              <p className="text-muted-foreground">
                Contact us at <strong>security@cashflowai.com</strong>
              </p>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}