import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Welcome email request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: WelcomeEmailRequest = await req.json();
    
    console.log(`Sending welcome email to: ${email}`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">ScoutFlow</h1>
              <p style="color: #71717a; margin-top: 8px;">Professional Football Scouting</p>
            </div>
            
            <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Welcome, ${firstName}! 👋</h2>
            
            <p style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
              Thank you for joining ScoutFlow! We're excited to have you on board. Your professional scouting journey starts now.
            </p>
            
            <p style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 16px;">
              <strong>Here's what you can do with ScoutFlow:</strong>
            </p>
            
            <ul style="color: #52525b; font-size: 16px; line-height: 28px; padding-left: 20px;">
              <li>Track and evaluate players with detailed observations</li>
              <li>Organize players into shortlists for easy comparison</li>
              <li>Manage tournaments and match scouting</li>
              <li>Analyze teams and opposition</li>
              <li>Generate professional PDF reports</li>
            </ul>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://scoutflow.tech" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Start Scouting
              </a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 20px; margin-top: 32px;">
              If you have any questions, feel free to reach out. We're here to help!
            </p>
            
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} ScoutFlow. All rights reserved.<br>
              <a href="https://scoutflow.tech" style="color: #7c3aed;">scoutflow.tech</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ScoutFlow <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to ScoutFlow! 🎯",
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Welcome email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);