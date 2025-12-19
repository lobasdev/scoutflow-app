import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: December 2024</p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and Conditions govern your use of ScoutFlow ("the Service"), a professional football 
              scouting platform operated by FOP Lobas Eduard ("we," "our," or "us"). By accessing and using ScoutFlow, 
              you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account or using ScoutFlow, you acknowledge that you have read, understood, and agree 
              to be bound by these Terms and Conditions, as well as our Privacy Policy and Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              ScoutFlow is a professional football scouting platform that provides tools for tracking players, 
              recording observations, analyzing teams, and generating reports. The Service is provided on a 
              subscription basis after an initial 7-day free trial period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To use ScoutFlow, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Subscription and Billing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              ScoutFlow offers a subscription-based service:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>New users receive a 7-day free trial</li>
              <li>After the trial, your subscription will automatically renew unless cancelled</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Refunds are handled according to our Refund Policy</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Use the Service for any unlawful purpose</li>
              <li>Share your account credentials with third parties</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Upload content that infringes on intellectual property rights</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Interfere with or disrupt the Service or servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Your Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of all content you create or upload to ScoutFlow, including player profiles, 
              observations, and reports. By using the Service, you grant us a limited license to store and 
              process your content solely to provide the Service to you. We will not share, sell, or use your 
              scouting data for any purpose other than providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Data Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We take your privacy seriously. Your data is encrypted and stored securely. We do not sell your 
              personal information to third parties. For more details on how we handle your data, please review 
              our{" "}
              <button 
                onClick={() => navigate("/privacy-policy")}
                className="text-primary hover:underline"
              >
                Privacy Policy
              </button>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to provide reliable service but cannot guarantee 100% uptime. We may temporarily suspend 
              the Service for maintenance, updates, or unforeseen circumstances. We will make reasonable efforts 
              to notify users of planned downtime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, FOP Lobas Eduard and ScoutFlow shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including but not limited to 
              loss of profits, data, or business opportunities arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms. Upon 
              termination, you will lose access to your account and data. We may retain certain data as 
              required by law or for legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify you of significant changes via email 
              or through the Service. Your continued use of the Service after changes constitute acceptance of 
              the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes 
              arising from these Terms or your use of the Service shall be resolved through appropriate legal channels.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-foreground">FOP Lobas Eduard</strong><br />
              Email: support@scoutflow.tech
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ScoutFlow. All rights reserved.
            </p>
            <a 
              href="https://scoutflow.tech" 
              className="text-sm text-primary hover:underline"
            >
              scoutflow.tech
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;