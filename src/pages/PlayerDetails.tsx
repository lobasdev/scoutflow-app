import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Edit, FileText, Download, Trash2, RefreshCw, Video, FileCheck2, FootprintsIcon, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { generatePlayerProfilePDF } from "@/utils/pdfGenerator";
import SkillsRadarChart from "@/components/SkillsRadarChart";
import { Badge } from "@/components/ui/badge";
import { formatEstimatedValue } from "@/utils/valueFormatter";
import { getSkillsForPosition } from "@/constants/skills";

interface Player {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  estimated_value: string | null;
  estimated_value_numeric: number | null;
  photo_url: string | null;
  football_data_id: number | null;
  appearances: number | null;
  minutes_played: number | null;
  goals: number | null;
  assists: number | null;
  foot: string | null;
  stats_last_updated: string | null;
  profile_summary: string | null;
  height: number | null;
  weight: number | null;
  recommendation: string | null;
  contract_expires: string | null;
  scout_notes: string | null;
  video_link: string | null;
  tags: string[] | null;
}

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

interface Rating {
  parameter: string;
  score: number;
}

interface Observation {
  id: string;
  date: string;
  location: string | null;
  notes: string | null;
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

const PlayerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlayerDetails();
    }
  }, [id]);

  const fetchPlayerDetails = async () => {
    try {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .single();

      if (playerError) throw playerError;
      setPlayer(playerData);

      const { data: observationsData, error: observationsError } = await supabase
        .from("observations")
        .select("*")
        .eq("player_id", id)
        .order("date", { ascending: false });

      if (observationsError) throw observationsError;
      setObservations(observationsData || []);

      // Fetch all ratings for this player's observations
      const observationIds = observationsData?.map(obs => obs.id) || [];
      if (observationIds.length > 0) {
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("ratings")
          .select("parameter, score")
          .in("observation_id", observationIds);

        if (ratingsError) throw ratingsError;
        setRatings(ratingsData || []);
      }

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("player_attachments")
        .select("*")
        .eq("player_id", id)
        .order("created_at", { ascending: false });

      if (attachmentsError) throw attachmentsError;
      setAttachments(attachmentsData || []);
    } catch (error: any) {
      toast.error("Failed to fetch player details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRatings = () => {
    if (ratings.length === 0) return [];

    // Get skills for this player's position
    const skills = getSkillsForPosition(player?.position || null);
    const skillKeys = skills.map(s => s.key);

    const parameterScores: { [key: string]: number[] } = {};
    
    ratings.forEach(rating => {
      // Only include ratings that match the player's skillset
      if (skillKeys.includes(rating.parameter)) {
        if (!parameterScores[rating.parameter]) {
          parameterScores[rating.parameter] = [];
        }
        parameterScores[rating.parameter].push(rating.score);
      }
    });

    return Object.entries(parameterScores).map(([parameter, scores]) => ({
      parameter,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }));
  };

  const handleGeneratePlayerReport = async () => {
    if (!player) return;
    
    setGenerating(true);
    try {
  // Prepare player data for PDF with stats
  const playerWithStats = {
    ...player,
    appearances: player.appearances || 0,
    minutesPlayed: player.minutes_played || 0,
    goals: player.goals || 0,
    assists: player.assists || 0,
    foot: player.foot || 'N/A',
    profile_summary: player.profile_summary || undefined,
    height: player.height || undefined,
    weight: player.weight || undefined,
    recommendation: player.recommendation || undefined,
    date_of_birth: player.date_of_birth,
    estimated_value: player.estimated_value,
  };

  const averageRatings = calculateAverageRatings();
  await generatePlayerProfilePDF(playerWithStats, averageRatings);
      toast.success("Player report generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate player report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('player-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download attachment");
    }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('player-attachments')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('player_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      toast.success("Attachment deleted");
    } catch (error) {
      toast.error("Failed to delete attachment");
    }
  };

  const handleDeletePlayer = async () => {
    try {
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Player deleted successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to delete player");
    }
  };

  const handleRefreshStats = async () => {
    if (!player?.football_data_id) {
      toast.error("This player is not linked to Football-Data.org");
      return;
    }

    setRefreshing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refresh-player-stats`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            playerId: player.id,
            footballDataId: player.football_data_id
          })
        }
      );

      const data = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        toast.error(data.error || "Rate limit exceeded. Please try again in a minute.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh stats");
      }

      // Update local player state
      setPlayer({
        ...player,
        appearances: data.stats.appearances,
        minutes_played: data.stats.minutesPlayed,
        goals: data.stats.goals,
        assists: data.stats.assists,
        height: data.stats.height || player.height,
        weight: data.stats.weight || player.weight,
        stats_last_updated: data.stats.lastUpdated,
      });

      toast.success("Player stats refreshed successfully!");
    } catch (error: any) {
      console.error('Refresh error:', error);
      toast.error(error.message || "Failed to refresh player stats");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold ml-2">{player.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/player/${id}/edit`)}>
              <Edit className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {player.photo_url && (
              <div className="flex justify-center mb-4">
                <img src={player.photo_url} alt={player.name} className="w-32 h-32 rounded-full object-cover border-4 border-primary" />
              </div>
            )}
            
            {player.profile_summary && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <p className="text-sm italic">{player.profile_summary}</p>
              </div>
            )}

            {player.recommendation && (
              <div className="flex justify-center items-center gap-2">
                <div 
                  className="h-4 w-4 rounded-full"
                  style={{
                    backgroundColor: 
                      player.recommendation === "Sign" ? "#10b981" :
                      player.recommendation === "Observe more" ? "#f59e0b" :
                      player.recommendation === "Not sign" ? "#ef4444" :
                      player.recommendation === "Invite for trial" ? "#3b82f6" :
                      "#8b5cf6"
                  }}
                />
                <Badge 
                  variant={
                    player.recommendation === "Sign" ? "default" : 
                    player.recommendation === "Invite for trial" ? "secondary" : 
                    "outline"
                  }
                  className="text-sm px-4 py-1"
                  style={{
                    borderColor: 
                      player.recommendation === "Sign" ? "#10b981" :
                      player.recommendation === "Observe more" ? "#f59e0b" :
                      player.recommendation === "Not sign" ? "#ef4444" :
                      player.recommendation === "Invite for trial" ? "#3b82f6" :
                      "#8b5cf6",
                    color: 
                      player.recommendation === "Sign" ? "#10b981" :
                      player.recommendation === "Observe more" ? "#f59e0b" :
                      player.recommendation === "Not sign" ? "#ef4444" :
                      player.recommendation === "Invite for trial" ? "#3b82f6" :
                      "#8b5cf6"
                  }}
                >
                  {player.recommendation}
                </Badge>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {player.date_of_birth && (
                <>
                  <p><span className="font-semibold">Age:</span> {calculateAge(player.date_of_birth)}</p>
                  <p><span className="font-semibold">Date of Birth:</span> {new Date(player.date_of_birth).toLocaleDateString()}</p>
                </>
              )}
              {player.position && <p><span className="font-semibold">Position:</span> {player.position}</p>}
              {player.team && <p><span className="font-semibold">Team:</span> {player.team}</p>}
              {player.nationality && <p><span className="font-semibold">Nationality:</span> {player.nationality}</p>}
              {player.foot && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Preferred Foot:</span>
                  <div className="flex items-center gap-1">
                    <FootprintsIcon className="h-4 w-4 text-primary" />
                    <span>{player.foot}</span>
                  </div>
                </div>
              )}
              {(player.height || player.weight) && (
                <>
                  {player.height && <p><span className="font-semibold">Height:</span> {player.height} cm</p>}
                  {player.weight && <p><span className="font-semibold">Weight:</span> {player.weight} kg</p>}
                </>
              )}
              {player.contract_expires && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Contract Expires:</span>
                  <Badge variant="outline" className="font-medium">
                    {new Date(player.contract_expires).toLocaleDateString()}
                  </Badge>
                </div>
              )}
              {player.estimated_value_numeric && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Estimated Value:</span>
                  <Badge variant="secondary" className="font-bold">
                    {formatEstimatedValue(player.estimated_value_numeric)}
                  </Badge>
                </div>
              )}
            </div>

            {player.video_link && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Video Link:</span>
                </div>
                <a 
                  href={player.video_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {player.video_link}
                </a>
              </div>
            )}

            {player.scout_notes && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Scout Notes:</span>
                </div>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{player.scout_notes}</p>
              </div>
            )}

            {/* Tags */}
            {player.tags && player.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {player.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Attachments ({attachments.length})</h3>
                </div>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div 
                      key={attachment.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.file_size ? `${(attachment.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • 
                          {new Date(attachment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(attachment)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {player.football_data_id && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Performance Statistics</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshStats}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{player.appearances || 0}</p>
                  <p className="text-sm text-muted-foreground">Appearances</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{player.goals || 0}</p>
                  <p className="text-sm text-muted-foreground">Goals</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{player.assists || 0}</p>
                  <p className="text-sm text-muted-foreground">Assists</p>
                </div>
              </div>
              {player.stats_last_updated && (
                <div className="flex items-center justify-end gap-2">
                  <Badge variant="outline" className="text-xs">
                    Last updated: {new Date(player.stats_last_updated).toLocaleString()}
                  </Badge>
                </div>
              )}
              {!player.stats_last_updated && (
                <p className="text-xs text-muted-foreground text-center">
                  Click refresh to fetch latest stats from Football-Data.org
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {calculateAverageRatings().length > 0 && (
          <div className="mb-6">
            <SkillsRadarChart data={calculateAverageRatings()} />
          </div>
        )}

        <Button onClick={handleGeneratePlayerReport} className="w-full mb-6" size="lg" disabled={generating}>
          <Download className="h-5 w-5 mr-2" />
          {generating ? "Generating Report..." : "Generate Player Report"}
        </Button>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Observations</h2>
          <Button onClick={() => navigate(`/player/${id}/observation/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            New Observation
          </Button>
        </div>

        {observations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No observations yet. Start tracking this player's performance!</p>
              <Button onClick={() => navigate(`/player/${id}/observation/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Observation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {observations.map((observation) => (
              <Card key={observation.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/player/${id}/observation/${observation.id}`)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{new Date(observation.date).toLocaleDateString()}</CardTitle>
                      {observation.location && <p className="text-sm text-muted-foreground mt-1">{observation.location}</p>}
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                {observation.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{observation.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {player?.name} and all associated observations and ratings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlayer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlayerDetails;
