import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const RefundPolicy = () => {
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

        <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Overview</h2>
            <p>
              FOP Lobas Eduard ("we," "our," or "us") operates ScoutFlow. This Refund Policy outlines the terms and conditions 
              for refunds on subscription purchases made through our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Free Trial</h2>
            <p>
              ScoutFlow offers a 7-day free trial for new subscribers. During the trial period, you have full access to all 
              features of the platform. You will not be charged until the trial period ends.
            </p>
            <p>
              If you cancel your subscription before the trial period ends, you will not be charged. We encourage you to 
              thoroughly evaluate ScoutFlow during your trial to ensure it meets your needs.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Subscription Refunds</h2>
            <p>
              After the free trial period, subscription fees are generally non-refundable. However, we understand that 
              exceptional circumstances may arise. We handle refund requests on a case-by-case basis.
            </p>
            <p>You may be eligible for a refund if:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You were charged after canceling during the trial period due to a technical error</li>
              <li>You experienced significant service disruptions that we were unable to resolve</li>
              <li>You were charged incorrectly or multiple times for the same billing period</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. How to Request a Refund</h2>
            <p>
              To request a refund, please contact us at <strong>hello@scoutflow.tech</strong> within 14 days of the charge 
              in question. Include the following information in your request:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your account email address</li>
              <li>Date of the charge</li>
              <li>Reason for the refund request</li>
              <li>Any relevant documentation or screenshots</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Refund Processing</h2>
            <p>
              If your refund request is approved, the refund will be processed through our payment provider, Paddle. 
              Refunds typically take 5-10 business days to appear on your statement, depending on your financial institution.
            </p>
            <p>
              Refunds will be issued to the original payment method used for the purchase.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Cancellation</h2>
            <p>
              You may cancel your subscription at any time through your account settings or by contacting us. Upon cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your subscription will remain active until the end of the current billing period</li>
              <li>You will not be charged for subsequent billing periods</li>
              <li>No partial refunds will be issued for unused time in the current billing period</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon 
              posting to this page. Your continued use of ScoutFlow after changes are posted constitutes acceptance of the modified policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
            <p>
              If you have questions about this Refund Policy or need assistance with a refund request, please contact us at:
            </p>
            <p>
              <strong>FOP Lobas Eduard</strong><br />
              Email: hello@scoutflow.tech
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;