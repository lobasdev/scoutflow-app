import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    // Create mailto link with form data
    const mailtoLink = `mailto:hello@scoutflow.tech?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
    
    toast.success("Opening your email client...");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">ScoutFlow</h1>
              <p className="text-sm text-muted-foreground">Contact Us</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          <Card className="border-border/50">
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Get in Touch</CardTitle>
              <CardDescription className="text-base">
                Have a question, feedback, or need support? We'd love to hear from you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What's this about?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Or email us directly at
                </p>
                <a 
                  href="mailto:hello@scoutflow.tech" 
                  className="text-primary hover:underline font-medium"
                >
                  hello@scoutflow.tech
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ScoutFlow. All rights reserved.
            </div>
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

export default Contact;
