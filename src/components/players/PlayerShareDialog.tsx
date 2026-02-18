import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, Mail, MessageCircle, Link2, Loader2, Check } from "lucide-react";

interface PlayerShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
}

const PlayerShareDialog = ({ open, onOpenChange, playerId, playerName }: PlayerShareDialogProps) => {
  const { user } = useAuth();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareLink = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("player_shares")
        .insert({ player_id: playerId, scout_id: user.id })
        .select("share_token")
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shared/${data.share_token}`;
      setShareUrl(url);
    } catch (error: any) {
      toast.error("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!shareUrl) return;
    const text = `Check out this player profile: ${playerName}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    if (!shareUrl) return;
    const subject = `Player Profile: ${playerName}`;
    const body = `Hi,\n\nI'd like to share this player profile with you:\n\n${playerName}\n${shareUrl}\n\nBest regards`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setShareUrl(null); setCopied(false); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Player Profile</DialogTitle>
          <DialogDescription>
            Generate a public read-only link for {playerName}
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              This will create a public link that anyone can use to view this player's full profile (read-only).
            </p>
            <Button onClick={generateShareLink} disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Link2 className="h-4 w-4 mr-2" /> Generate Share Link</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleWhatsApp} className="gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp
              </Button>
              <Button variant="outline" onClick={handleEmail} className="gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Email
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlayerShareDialog;
