import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const playerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  position: z.string().max(50).optional(),
  team: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  date_of_birth: z.string().optional(),
  estimated_value: z.string().max(50).optional(),
  photo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const PlayerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    team: "",
    nationality: "",
    date_of_birth: "",
    estimated_value: "",
    photo_url: "",
  });

  useEffect(() => {
    if (id && id !== "new") {
      fetchPlayer();
    }
  }, [id]);

  const fetchPlayer = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFormData({
        name: data.name,
        position: data.position || "",
        team: data.team || "",
        nationality: data.nationality || "",
        date_of_birth: data.date_of_birth || "",
        estimated_value: data.estimated_value || "",
        photo_url: data.photo_url || "",
      });
    } catch (error: any) {
      toast.error("Failed to fetch player");
      navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = playerSchema.parse({
        name: formData.name,
        position: formData.position || undefined,
        team: formData.team || undefined,
        nationality: formData.nationality || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        estimated_value: formData.estimated_value || undefined,
        photo_url: formData.photo_url || undefined,
      });

      const playerData = {
        name: validated.name,
        position: validated.position || null,
        team: validated.team || null,
        nationality: validated.nationality || null,
        date_of_birth: validated.date_of_birth || null,
        estimated_value: validated.estimated_value || null,
        photo_url: validated.photo_url || null,
      };

      if (id && id !== "new") {
        const { error } = await supabase
          .from("players")
          .update(playerData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Player updated successfully");
      } else {
        const { error } = await supabase
          .from("players")
          .insert([{ ...playerData, scout_id: user?.id }]);

        if (error) throw error;
        toast.success("Player added successfully");
      }

      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save player");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">{id === "new" ? "Add Player" : "Edit Player"}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g., Forward, Midfielder"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Input
                    id="team"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="e.g., Brazilian"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_value">Estimated Value</Label>
                  <Input
                    id="estimated_value"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    placeholder="e.g., €5M"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input
                  id="photo_url"
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : id === "new" ? "Add Player" : "Update Player"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlayerForm;
