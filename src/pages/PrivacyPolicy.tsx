import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              FOP Lobas Eduard ("we," "our," or "us") operates ScoutFlow, a professional football scouting platform. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-foreground">2.1 Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and email address when you create an account</li>
              <li>Payment information when you subscribe (processed securely by Paddle)</li>
              <li>Profile information you choose to add</li>
              <li>Communication data when you contact us</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">2.2 Usage Data</h3>
            <p>We automatically collect certain information when you use our service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and general location</li>
              <li>Pages visited and features used</li>
              <li>Time and date of visits</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground">2.3 Scouting Data</h3>
            <p>
              Data you enter into ScoutFlow, including player profiles, observations, match reports, 
              and other scouting-related content, is stored securely and remains your property.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, and maintain our service</li>
              <li>Process your subscription and payments</li>
              <li>Send you service-related communications</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Improve and develop new features</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate our service (e.g., Paddle for payments, hosting providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information. 
              However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. 
              You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Cookies</h2>
            <p>
              We use essential cookies to operate our service and may use analytics cookies to understand how you use ScoutFlow. 
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Children's Privacy</h2>
            <p>
              ScoutFlow is not intended for users under the age of 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page 
              and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
            </p>
            <p>
              <strong>FOP Lobas Eduard</strong><br />
              Email: support@scoutflow.tech
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;