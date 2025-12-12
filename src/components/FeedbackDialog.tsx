import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const feedbackSchema = z.object({
  type: z.enum(["feedback", "issue", "suggestion"]),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
  onClose?: () => void;
}

const FeedbackDialog = ({ trigger, onClose }: FeedbackDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"feedback" | "issue" | "suggestion">("feedback");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = feedbackSchema.safeParse({ type, message });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    const typeLabels = {
      feedback: "Feedback",
      issue: "Issue Report",
      suggestion: "Suggestion",
    };

    // Create mailto link with feedback data
    const subject = `[ScoutFlow ${typeLabels[type]}] from ${user?.email || "User"}`;
    const body = `Type: ${typeLabels[type]}\nUser: ${user?.email || "Anonymous"}\n\n${message}`;
    
    const mailtoLink = `mailto:hello@scoutflow.tech?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;
    
    toast.success("Opening your email client...");
    setIsSubmitting(false);
    setMessage("");
    setType("feedback");
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="w-full justify-start">
            <MessageSquare className="h-5 w-5 mr-3 text-muted-foreground" />
            Send Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts, report issues, or suggest improvements.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>What type of feedback?</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(v) => setType(v as typeof type)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feedback" id="feedback" />
                <Label htmlFor="feedback" className="font-normal cursor-pointer">Feedback</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="issue" id="issue" />
                <Label htmlFor="issue" className="font-normal cursor-pointer">Issue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suggestion" id="suggestion" />
                <Label htmlFor="suggestion" className="font-normal cursor-pointer">Suggestion</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Your message</Label>
            <Textarea
              id="feedback-message"
              placeholder="Tell us what's on your mind..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
