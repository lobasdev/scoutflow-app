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
  age: z.number().min(10).max(50).optional(),
  position: z.string().max(50).optional(),
  team: z.string().max(100).optional(),
});

const PlayerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    position: "",
    team: "",
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
        age: data.age?.toString() || "",
        position: data.position || "",
        team: data.team || "",
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
        age: formData.age ? parseInt(formData.age) : undefined,
        position: formData.position || undefined,
        team: formData.team || undefined,
      });

      const playerData = {
        name: validated.name,
        age: validated.age || null,
        position: validated.position || null,
        team: validated.team || null,
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
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

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
