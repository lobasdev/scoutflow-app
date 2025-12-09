import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import PageHeader from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_POSITIONS } from "@/constants/skills";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
import { mapFootballDataPosition } from "@/utils/positionMapper";

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
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  ceiling_level: z.string().optional(),
  sell_on_potential: z.number().int().min(0).max(10).optional(),
  transfer_potential_comment: z.string().max(500).optional(),
  shirt_number: z.string().max(10).optional(),
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
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch available teams for linking
  const { data: availableTeams = [] } = useQuery({
    queryKey: ["teams-for-player"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    position: "",
    team: "",
    team_id: undefined as string | undefined,
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
    strengths: [] as string[],
    weaknesses: [] as string[],
    risks: [] as string[],
    ceiling_level: "",
    sell_on_potential: undefined as number | undefined,
    transfer_potential_comment: "",
    shirt_number: "",
    current_salary: "",
    expected_salary: "",
    agency: "",
    agency_link: "",
  });
  const [valueError, setValueError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id && id !== "new") {
      fetchPlayer();
    }
  }, [id]);

  // Debounced search function
  const searchPlayers = useCallback(async (query: string) => {
    if (query.length < 3) {
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
      position: mapFootballDataPosition(player.position),
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
        team_id: data.team_id || undefined,
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
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        risks: data.risks || [],
        ceiling_level: data.ceiling_level || "",
        sell_on_potential: data.sell_on_potential || undefined,
        transfer_potential_comment: data.transfer_potential_comment || "",
        shirt_number: data.shirt_number || "",
        current_salary: data.current_salary || "",
        expected_salary: data.expected_salary || "",
        agency: data.agency || "",
        agency_link: data.agency_link || "",
      });
      setPhotoPreview(data.photo_url || "");
    } catch (error: any) {
      toast.error("Failed to fetch player");
      navigate("/");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 20MB)`);
        return false;
      }
      return true;
    });
    setAttachmentFiles(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhoto = async (playerId: string): Promise<string | null> => {
    if (!photoFile) return formData.photo_url || null;

    const fileExt = photoFile.name.split('.').pop();
    const filePath = `${playerId}/photo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('player-photos')
      .upload(filePath, photoFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('player-photos')
      .getPublicUrl(filePath);

    // Add timestamp to force cache refresh
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const uploadAttachments = async (playerId: string) => {
    if (attachmentFiles.length === 0) return;

    for (const file of attachmentFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${playerId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('player-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save attachment record
      const { error: dbError } = await supabase
        .from('player_attachments')
        .insert({
          player_id: playerId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        });

      if (dbError) throw dbError;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);

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
        strengths: formData.strengths || undefined,
        weaknesses: formData.weaknesses || undefined,
        risks: formData.risks || undefined,
        ceiling_level: formData.ceiling_level || undefined,
        sell_on_potential: formData.sell_on_potential || undefined,
        transfer_potential_comment: formData.transfer_potential_comment || undefined,
        shirt_number: formData.shirt_number || undefined,
      });

      const playerData = {
        name: validated.name,
        position: validated.position || null,
        team: validated.team || null,
        team_id: formData.team_id || null,
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
        strengths: validated.strengths || [],
        weaknesses: validated.weaknesses || [],
        risks: validated.risks || [],
        ceiling_level: validated.ceiling_level || null,
        sell_on_potential: validated.sell_on_potential || null,
        transfer_potential_comment: validated.transfer_potential_comment || null,
        shirt_number: validated.shirt_number || null,
        current_salary: formData.current_salary || null,
        expected_salary: formData.expected_salary || null,
        agency: formData.agency || null,
        agency_link: formData.agency_link || null,
      };

      let playerId = id && id !== "new" ? id : null;

      if (id && id !== "new") {
        // Update existing player
        const photoUrl = await uploadPhoto(id);
        const updateData = photoUrl ? { ...playerData, photo_url: photoUrl } : playerData;
        
        const { error } = await supabase
          .from("players")
          .update(updateData)
          .eq("id", id);

        if (error) throw error;
        
        await uploadAttachments(id);
        toast.success("Player updated successfully");
      } else {
        // Create new player
        const { data: newPlayer, error } = await supabase
          .from("players")
          .insert([{ ...playerData, scout_id: user?.id }])
          .select()
          .single();

        if (error) throw error;
        playerId = newPlayer.id;
        
        // Upload photo and attachments
        const photoUrl = await uploadPhoto(playerId);
        if (photoUrl) {
          await supabase
            .from("players")
            .update({ photo_url: photoUrl })
            .eq("id", playerId);
        }
        
        await uploadAttachments(playerId);
        toast.success("Player added successfully");
      }

      // Invalidate queries to refresh player lists
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["player-shortlists"] });
      queryClient.invalidateQueries({ queryKey: ["shortlist-counts"] });
      
      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save player");
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={id === "new" ? "Add Player" : "Edit Player"} />

      <main className="container mx-auto px-4 py-6 pb-32">
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
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <div className="space-y-2">
                    <Input
                      id="team"
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      placeholder="Team name (text)"
                    />
                    {availableTeams.length > 0 && (
                      <Select
                        value={formData.team_id || ""}
                        onValueChange={(value) => {
                          const selectedTeam = availableTeams.find(t => t.id === value);
                          setFormData({ 
                            ...formData, 
                            team_id: value || undefined,
                            team: selectedTeam?.name || formData.team 
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Or link to existing team..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="">No linked team</SelectItem>
                          {availableTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_salary">Current Salary</Label>
                  <Input
                    id="current_salary"
                    value={formData.current_salary}
                    onChange={(e) => setFormData({ ...formData, current_salary: e.target.value })}
                    placeholder="e.g., €50K/week"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_salary">Expected Salary</Label>
                  <Input
                    id="expected_salary"
                    value={formData.expected_salary}
                    onChange={(e) => setFormData({ ...formData, expected_salary: e.target.value })}
                    placeholder="e.g., €75K/week"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency">Agency</Label>
                  <Input
                    id="agency"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    placeholder="e.g., CAA Sports"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agency_link">Agency Link</Label>
                  <Input
                    id="agency_link"
                    value={formData.agency_link}
                    onChange={(e) => setFormData({ ...formData, agency_link: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Player Photo</Label>
                {photoPreview && (
                  <div className="flex justify-center mb-2">
                    <img 
                      src={photoPreview} 
                      alt="Photo preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                    />
                  </div>
                )}
                <Input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Max size: 5MB. Formats: JPG, PNG, WEBP</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Player Attachments</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,video/mp4,video/quicktime"
                  onChange={handleAttachmentChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">Max size per file: 20MB. Multiple files allowed.</p>
                
                {attachmentFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachmentFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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

              {/* Strengths, Weaknesses, Risks */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Player Analysis</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="shirt_number">Shirt Number</Label>
                  <Input
                    id="shirt_number"
                    value={formData.shirt_number}
                    onChange={(e) => setFormData({ ...formData, shirt_number: e.target.value })}
                    placeholder="#6"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">Optional number used in match reports</p>
                </div>

                <div className="space-y-2">
                  <Label>Strengths (Pros)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a strength..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !formData.strengths.includes(value)) {
                            setFormData({ ...formData, strengths: [...formData.strengths, value] });
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.strengths.map((strength, index) => (
                      <Badge 
                        key={index} 
                        className="cursor-pointer bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                        onClick={() => setFormData({ ...formData, strengths: formData.strengths.filter((_, i) => i !== index) })}
                      >
                        {strength} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Weaknesses (Cons)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a weakness..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !formData.weaknesses.includes(value)) {
                            setFormData({ ...formData, weaknesses: [...formData.weaknesses, value] });
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.weaknesses.map((weakness, index) => (
                      <Badge 
                        key={index} 
                        className="cursor-pointer bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                        onClick={() => setFormData({ ...formData, weaknesses: formData.weaknesses.filter((_, i) => i !== index) })}
                      >
                        {weakness} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Risks / Red Flags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a risk or red flag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !formData.risks.includes(value)) {
                            setFormData({ ...formData, risks: [...formData.risks, value] });
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.risks.map((risk, index) => (
                      <Badge 
                        key={index} 
                        className="cursor-pointer bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                        onClick={() => setFormData({ ...formData, risks: formData.risks.filter((_, i) => i !== index) })}
                      >
                        {risk} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transfer Potential */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Transfer Potential</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="ceiling_level">Ceiling Level</Label>
                  <select
                    id="ceiling_level"
                    value={formData.ceiling_level}
                    onChange={(e) => setFormData({ ...formData, ceiling_level: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select ceiling level</option>
                    <option value="International">International</option>
                    <option value="Top 5 League">Top 5 League</option>
                    <option value="Other Top Division">Other Top Division</option>
                    <option value="Second Division">Second Division</option>
                    <option value="Lower Leagues">Lower Leagues</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sell_on_potential">Sell-on Potential: {formData.sell_on_potential ?? 0}/10</Label>
                  <Slider
                    id="sell_on_potential"
                    min={0}
                    max={10}
                    step={1}
                    value={[formData.sell_on_potential ?? 0]}
                    onValueChange={(value) => setFormData({ ...formData, sell_on_potential: value[0] })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer_potential_comment">Transfer Potential Comment</Label>
                  <Textarea
                    id="transfer_potential_comment"
                    value={formData.transfer_potential_comment}
                    onChange={(e) => setFormData({ ...formData, transfer_potential_comment: e.target.value })}
                    placeholder="Additional notes about transfer potential..."
                    maxLength={500}
                  />
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

              <Button type="submit" className="w-full" disabled={loading || uploading}>
                {uploading ? "Uploading files..." : loading ? "Saving..." : id === "new" ? "Add Player" : "Update Player"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlayerForm;
