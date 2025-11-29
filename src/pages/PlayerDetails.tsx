import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Edit, FileText, Download, Trash2, RefreshCw, Video, FileCheck2, FootprintsIcon, Paperclip, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { generatePlayerProfilePDF } from "@/utils/pdfService";
import SkillsRadarChart from "@/components/SkillsRadarChart";
import { Badge } from "@/components/ui/badge";
import { formatEstimatedValue, formatSalary } from "@/utils/valueFormatter";
import { getSkillsForPosition } from "@/constants/skills";
import { Checkbox } from "@/components/ui/checkbox";

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
  strengths: string[] | null;
  weaknesses: string[] | null;
  risks: string[] | null;
  ceiling_level: string | null;
  sell_on_potential: number | null;
  transfer_potential_comment: string | null;
  shirt_number: string | null;
  current_salary?: string | null;
  expected_salary?: string | null;
  agency?: string | null;
  agency_link?: string | null;
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

interface Shortlist {
  id: string;
  name: string;
}

const PlayerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [player, setPlayer] = useState<Player | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [playerShortlists, setPlayerShortlists] = useState<Set<string>>(new Set());
  const [shortlistDialogOpen, setShortlistDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlayerDetails();
      fetchShortlists();
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

      // Fetch player's current shortlists
      const { data: playerShortlistsData, error: playerShortlistsError } = await supabase
        .from("player_shortlists")
        .select("shortlist_id")
        .eq("player_id", id);

      if (playerShortlistsError) throw playerShortlistsError;
      setPlayerShortlists(new Set(playerShortlistsData?.map(ps => ps.shortlist_id) || []));
    } catch (error: any) {
      toast.error("Failed to fetch player details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlists = async () => {
    try {
      const { data, error } = await supabase
        .from("shortlists")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setShortlists(data || []);
    } catch (error: any) {
      console.error("Failed to fetch shortlists:", error);
    }
  };

  const handleToggleShortlist = async (shortlistId: string, isInShortlist: boolean) => {
    if (!id) return;

    try {
      if (isInShortlist) {
        // Remove from shortlist
        const { error } = await supabase
          .from("player_shortlists")
          .delete()
          .eq("shortlist_id", shortlistId)
          .eq("player_id", id);

        if (error) throw error;

        setPlayerShortlists(prev => {
          const newSet = new Set(prev);
          newSet.delete(shortlistId);
          return newSet;
        });
      } else {
        // Add to shortlist
        const { error } = await supabase
          .from("player_shortlists")
          .insert({
            shortlist_id: shortlistId,
            player_id: id
          });

        if (error) throw error;

        setPlayerShortlists(prev => new Set([...prev, shortlistId]));
      }
    } catch (error: any) {
      toast.error("Failed to update shortlist");
    }
  };

  const handleSaveShortlists = () => {
    setShortlistDialogOpen(false);
    toast.success("Shortlists updated successfully");
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
      console.log('Starting PDF generation for player:', player.name);
      
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
      console.log('Calculated average ratings:', averageRatings.length);
      
      // Capture radar chart as base64
      let radarChartBase64: string | undefined;
      try {
        const radarChartElement = document.querySelector('.recharts-wrapper') as HTMLElement;
        if (radarChartElement) {
          console.log('Capturing radar chart...');
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Set canvas size based on chart element
            const rect = radarChartElement.getBoundingClientRect();
            canvas.width = rect.width * 2; // 2x for better quality
            canvas.height = rect.height * 2;
            ctx.scale(2, 2);
            
            // Get SVG element
            const svgElement = radarChartElement.querySelector('svg');
            if (svgElement) {
              const svgString = new XMLSerializer().serializeToString(svgElement);
              const img = new Image();
              const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);
              
              await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                  ctx.drawImage(img, 0, 0);
                  radarChartBase64 = canvas.toDataURL('image/png');
                  URL.revokeObjectURL(url);
                  console.log('Radar chart captured successfully');
                  resolve();
                };
                img.onerror = () => {
                  URL.revokeObjectURL(url);
                  console.warn('Failed to capture radar chart');
                  reject();
                };
                img.src = url;
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not capture radar chart:', error);
        // Continue without radar chart
      }
      
      await generatePlayerProfilePDF(playerWithStats, averageRatings, radarChartBase64);
      console.log('PDF generation completed successfully');
      toast.success("Player report generated successfully!");
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error(`Failed to generate player report: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Invalidate queries before navigating
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["player-shortlists"] });
      queryClient.invalidateQueries({ queryKey: ["shortlist-counts"] });
      
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
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold ml-2">{player.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShortlistDialogOpen(true)}>
              <ListPlus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/player/${id}/edit`)}>
              <Edit className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-32">
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

            <div className="flex flex-wrap justify-center items-center gap-3">
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
              
              {player.video_link && (
                <a 
                  href={player.video_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <Video className="h-4 w-4" />
                  Video Report
                </a>
              )}
            </div>
            
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
              {player.shirt_number && <p><span className="font-semibold">Shirt Number:</span> {player.shirt_number}</p>}
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
              {(player as any).current_salary && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Current Salary:</span>
                  <Badge variant="secondary" className="font-medium">
                    {formatSalary((player as any).current_salary)}
                  </Badge>
                </div>
              )}
              {(player as any).expected_salary && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Expected Salary:</span>
                  <Badge variant="secondary" className="font-medium">
                    {formatSalary((player as any).expected_salary)}
                  </Badge>
                </div>
              )}
              {(player as any).agency && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Agency:</span>
                  {(player as any).agency_link ? (
                    <a 
                      href={(player as any).agency_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {(player as any).agency}
                    </a>
                  ) : (
                    <span>{(player as any).agency}</span>
                  )}
                </div>
              )}
            </div>

            {player.scout_notes && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Scout Notes:</span>
                </div>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{player.scout_notes}</p>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            {((player.strengths && player.strengths.length > 0) || (player.weaknesses && player.weaknesses.length > 0)) && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Player Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {player.strengths && player.strengths.length > 0 && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold mb-3 text-green-700 dark:text-green-300 flex items-center gap-2">
                        <span className="text-lg">✓</span> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {player.strengths.map((strength, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {player.weaknesses && player.weaknesses.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold mb-3 text-red-700 dark:text-red-300 flex items-center gap-2">
                        <span className="text-lg">✗</span> Weaknesses
                      </h4>
                      <ul className="space-y-2">
                        {player.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risks & Red Flags */}
            {player.risks && player.risks.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3 text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                    <span className="text-lg">⚠</span> Risks / Red Flags
                  </h4>
                  <ul className="space-y-2">
                    {player.risks.map((risk, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Transfer Potential */}
            {(player.ceiling_level || player.sell_on_potential !== null || player.transfer_potential_comment) && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Transfer Potential</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  {player.ceiling_level && (
                    <div>
                      <span className="text-sm font-semibold">Ceiling Level:</span>
                      <Badge variant="secondary" className="ml-2">{player.ceiling_level}</Badge>
                    </div>
                  )}
                  {player.sell_on_potential !== null && (
                    <div>
                      <span className="text-sm font-semibold">Sell-on Potential:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(player.sell_on_potential / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold min-w-[3ch]">{player.sell_on_potential}/10</span>
                      </div>
                    </div>
                  )}
                  {player.transfer_potential_comment && (
                    <div>
                      <span className="text-sm font-semibold">Comment:</span>
                      <p className="text-sm mt-1 text-muted-foreground">{player.transfer_potential_comment}</p>
                    </div>
                  )}
                </div>
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

        {(player.football_data_id ||
          player.appearances !== null ||
          player.goals !== null ||
          player.assists !== null) && (
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
                  <p className="text-2xl font-bold">{player.appearances ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Appearances</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{player.goals ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Goals</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{player.assists ?? 0}</p>
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
                    {observation.location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-semibold">Match Name:</span> {observation.location}
                      </p>
                    )}
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

      {/* Add to Shortlist Dialog */}
      <Dialog open={shortlistDialogOpen} onOpenChange={setShortlistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Shortlists</DialogTitle>
            <DialogDescription>
              Select which shortlists to add {player?.name} to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {shortlists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have any shortlists yet
                </p>
                <Button onClick={() => navigate("/shortlists")}>
                  Create Shortlist
                </Button>
              </div>
            ) : (
              shortlists.map((shortlist) => {
                const isInShortlist = playerShortlists.has(shortlist.id);
                return (
                  <div key={shortlist.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={shortlist.id}
                      checked={isInShortlist}
                      onCheckedChange={() => handleToggleShortlist(shortlist.id, isInShortlist)}
                    />
                    <label
                      htmlFor={shortlist.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {shortlist.name}
                    </label>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveShortlists}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
