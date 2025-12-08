import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

interface TeamLogoUploadProps {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  teamId?: string;
}

const TeamLogoUpload = ({ logoUrl, onLogoChange, teamId }: TeamLogoUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${teamId || Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("team-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("team-logos")
        .getPublicUrl(filePath);

      onLogoChange(publicUrl);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange(null);
  };

  return (
    <div className="space-y-2">
      <Label>Team Logo</Label>
      
      {logoUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="Team logo"
            className="w-16 h-16 rounded-lg object-cover border"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveLogo}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="logo-upload"
            disabled={uploading}
          />
          <label htmlFor="logo-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              asChild
            >
              <span className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Uploading..." : "Upload Logo"}
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
};

export default TeamLogoUpload;
