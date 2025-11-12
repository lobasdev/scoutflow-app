import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { parseEstimatedValue } from "@/utils/valueFormatter";

const playerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  position: z.string().max(50).optional(),
  team: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  date_of_birth: z.string().optional(),
  estimated_value: z.string().max(50).optional(),
  photo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  football_data_id: z.number().optional(),
  foot: z.string().optional(),
  appearances: z.number().int().min(0).optional(),
  goals: z.number().int().min(0).optional(),
  assists: z.number().int().min(0).optional(),
  profile_summary: z.string().max(500).optional(),
  height: z.number().int().min(0).max(300).optional(),
  weight: z.number().int().min(0).max(300).optional(),
  recommendation: z.enum(["Sign", "Observe more", "Not sign", "Invite for trial"]).optional(),
  contract_expires: z.string().optional(),
  scout_notes: z.string().max(2000).optional(),
  video_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

interface PlayerSearchResult {
  id: number;
  name: string;
  position: string;
  team: string;
  nationality: string;
  dateOfBirth: string;
}

const PlayerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    team: "",
    nationality: "",
    date_of_birth: "",
    estimated_value: "",
    photo_url: "",
    football_data_id: undefined as number | undefined,
    foot: "",
    appearances: undefined as number | undefined,
    goals: undefined as number | undefined,
    assists: undefined as number | undefined,
    profile_summary: "",
    height: undefined as number | undefined,
    weight: undefined as number | undefined,
    recommendation: undefined as "Sign" | "Observe more" | "Not sign" | "Invite for trial" | undefined,
    contract_expires: "",
    scout_notes: "",
    video_link: "",
    tags: [] as string[],
  });
  const [valueError, setValueError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (id && id !== "new") {
      fetchPlayer();
    }
  }, [id]);

  // Debounced search function
  const searchPlayers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-players', {
        body: { searchQuery: query }
      });

      if (error) throw error;
      setSearchResults(data.players || []);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Failed to search players');
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPlayers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPlayers]);

  const handlePlayerSelect = (player: PlayerSearchResult) => {
    setFormData({
      ...formData,
      name: player.name,
      position: player.position,
      team: player.team,
      nationality: player.nationality,
      date_of_birth: player.dateOfBirth,
      football_data_id: player.id,
    });
    setShowSearch(false);
    setSearchQuery("");
    toast.success("Player details autofilled from Football-Data.org");
  };

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
        football_data_id: data.football_data_id || undefined,
        foot: data.foot || "",
        appearances: data.appearances || undefined,
        goals: data.goals || undefined,
        assists: data.assists || undefined,
        profile_summary: data.profile_summary || "",
        height: data.height || undefined,
        weight: data.weight || undefined,
        recommendation: data.recommendation as "Sign" | "Observe more" | "Not sign" | "Invite for trial" | undefined,
        contract_expires: data.contract_expires || "",
        scout_notes: data.scout_notes || "",
        video_link: data.video_link || "",
        tags: data.tags || [],
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
        football_data_id: formData.football_data_id || undefined,
        foot: formData.foot || undefined,
        appearances: formData.appearances || undefined,
        goals: formData.goals || undefined,
        assists: formData.assists || undefined,
        profile_summary: formData.profile_summary || undefined,
        height: formData.height || undefined,
        weight: formData.weight || undefined,
        recommendation: formData.recommendation || undefined,
        contract_expires: formData.contract_expires || undefined,
        scout_notes: formData.scout_notes || undefined,
        video_link: formData.video_link || undefined,
        tags: formData.tags || undefined,
      });

      const playerData = {
        name: validated.name,
        position: validated.position || null,
        team: validated.team || null,
        nationality: validated.nationality || null,
        date_of_birth: validated.date_of_birth || null,
        estimated_value: validated.estimated_value || null,
        estimated_value_numeric: validated.estimated_value ? parseEstimatedValue(validated.estimated_value) : null,
        photo_url: validated.photo_url || null,
        football_data_id: validated.football_data_id || null,
        foot: validated.foot || null,
        appearances: validated.appearances || null,
        goals: validated.goals || null,
        assists: validated.assists || null,
        profile_summary: validated.profile_summary || null,
        height: validated.height || null,
        weight: validated.weight || null,
        recommendation: validated.recommendation || null,
        contract_expires: validated.contract_expires || null,
        scout_notes: validated.scout_notes || null,
        video_link: validated.video_link || null,
        tags: validated.tags || [],
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
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="flex-1"
                  />
                  <Popover open={showSearch} onOpenChange={setShowSearch}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <Command>
                        <CommandInput
                          placeholder="Search for player..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          {searching && (
                            <div className="py-6 text-center text-sm">Searching...</div>
                          )}
                          {!searching && searchResults.length === 0 && searchQuery && (
                            <CommandEmpty>No players found.</CommandEmpty>
                          )}
                          {!searching && searchResults.length > 0 && (
                            <CommandGroup heading="Players">
                              {searchResults.map((player) => (
                                <CommandItem
                                  key={player.id}
                                  value={player.name}
                                  onSelect={() => handlePlayerSelect(player)}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{player.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {player.position} • {player.team}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
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
                  <Label htmlFor="foot">Preferred Foot</Label>
                  <Input
                    id="foot"
                    value={formData.foot}
                    onChange={(e) => setFormData({ ...formData, foot: e.target.value })}
                    placeholder="e.g., Right, Left, Both"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_value">Estimated Value</Label>
                <Input
                  id="estimated_value"
                  value={formData.estimated_value}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, estimated_value: value });
                    
                    // Validate in real-time
                    if (value && value.trim() !== "") {
                      const parsed = parseEstimatedValue(value);
                      if (parsed === null) {
                        setValueError("Invalid format. Use: €5M, €500K, or €50000");
                      } else {
                        setValueError(null);
                      }
                    } else {
                      setValueError(null);
                    }
                  }}
                  placeholder="e.g., €5M, €500K, or €50000"
                  className={valueError ? "border-red-500" : ""}
                />
                {valueError && (
                  <p className="text-sm text-red-500">{valueError}</p>
                )}
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

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Player Profile</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="profile_summary">Profile Summary</Label>
                  <Input
                    id="profile_summary"
                    value={formData.profile_summary}
                    onChange={(e) => setFormData({ ...formData, profile_summary: e.target.value })}
                    placeholder="e.g., High potential young wingback"
                    maxLength={500}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      max="300"
                      value={formData.height ?? ""}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="180"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      max="300"
                      value={formData.weight ?? ""}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="75"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommendation">Recommendation</Label>
                  <select
                    id="recommendation"
                    value={formData.recommendation || ""}
                    onChange={(e) => setFormData({ ...formData, recommendation: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select recommendation</option>
                    <option value="Sign">Sign</option>
                    <option value="Observe more">Observe more</option>
                    <option value="Not sign">Not sign</option>
                    <option value="Invite for trial">Invite for trial</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Scout Notes & Media</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="contract_expires">Contract Expires</Label>
                  <Input
                    id="contract_expires"
                    type="date"
                    value={formData.contract_expires}
                    onChange={(e) => setFormData({ ...formData, contract_expires: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_link">Video Link</Label>
                  <Input
                    id="video_link"
                    type="url"
                    value={formData.video_link}
                    onChange={(e) => setFormData({ ...formData, video_link: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scout_notes">Scout Notes</Label>
                  <textarea
                    id="scout_notes"
                    value={formData.scout_notes}
                    onChange={(e) => setFormData({ ...formData, scout_notes: e.target.value })}
                    placeholder="Add your observations, impressions, and notes about this player..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">{formData.scout_notes.length}/2000 characters</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Performance Statistics</h3>
                <p className="text-sm text-muted-foreground">Manually enter player statistics or use the refresh button on the player details page to fetch from API.</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appearances">Appearances</Label>
                    <Input
                      id="appearances"
                      type="number"
                      min="0"
                      value={formData.appearances ?? ""}
                      onChange={(e) => setFormData({ ...formData, appearances: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals">Goals</Label>
                    <Input
                      id="goals"
                      type="number"
                      min="0"
                      value={formData.goals ?? ""}
                      onChange={(e) => setFormData({ ...formData, goals: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assists">Assists</Label>
                    <Input
                      id="assists"
                      type="number"
                      min="0"
                      value={formData.assists ?? ""}
                      onChange={(e) => setFormData({ ...formData, assists: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag (e.g., U23, Left-footed)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                          setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
                          setNewTag("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                        setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
                        setNewTag("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                      onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) })}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
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
