import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  FileDown,
  MapPin,
  Trophy,
  Calendar,
  User,
  Building,
  ExternalLink,
  Video,
  FileText,
  Target,
  Shield,
  Zap,
  AlertTriangle,
  Globe,
  ClipboardList,
} from "lucide-react";
import TeamFormationsChart from "@/components/teams/TeamFormationsChart";
import TeamSeasonStatsChart from "@/components/teams/TeamSeasonStatsChart";
import TeamTacticalVisual from "@/components/teams/TeamTacticalVisual";
import TeamKeyFindings from "@/components/teams/TeamKeyFindings";
import LinkedPlayersSection from "@/components/teams/LinkedPlayersSection";
import { generateTeamReportPDF } from "@/utils/pdfService";

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team deleted");
      navigate("/teams");
    },
    onError: () => {
      toast.error("Failed to delete team");
    },
  });

  const handleExportPDF = async () => {
    if (!team) return;
    try {
      await generateTeamReportPDF(team);
      toast.success("PDF generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Team Details" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Team Not Found" />
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Team not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title={team.name}
        subtitle={team.league || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/teams/${id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {team.name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {team.logo_url && (
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{team.name}</h2>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {team.league && (
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {team.league}
                    </div>
                  )}
                  {(team.city || team.country) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {[team.city, team.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {team.stadium && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {team.stadium}
                    </div>
                  )}
                  {team.founded_year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Founded {team.founded_year}
                    </div>
                  )}
                  {team.manager && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {team.manager}
                    </div>
                  )}
                  {team.website && (
                    <a
                      href={team.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Findings - Priority section for sharing */}
        {team.key_findings && (
          <TeamKeyFindings findings={team.key_findings} />
        )}

        {/* Season Statistics */}
        <TeamSeasonStatsChart
          wins={team.wins || 0}
          draws={team.draws || 0}
          losses={team.losses || 0}
          goalsFor={team.goals_for || 0}
          goalsAgainst={team.goals_against || 0}
          cleanSheets={team.clean_sheets || 0}
          season={team.season || undefined}
        />

        {/* Formations */}
        {team.formations && team.formations.length > 0 && (
          <TeamFormationsChart formations={team.formations} />
        )}

        {/* Tactical Visualization */}
        <TeamTacticalVisual
          tacticalShape={team.tactical_shape}
          pressingStyle={team.pressing_style}
          buildUpPlay={team.build_up_play}
          defensiveApproach={team.defensive_approach}
          attackingPatterns={team.attacking_patterns}
          defensivePatterns={team.defensive_patterns}
          transitionPlay={team.transition_play}
        />

        {/* Tactical Analysis Text */}
        {(team.game_model || team.coaching_style || team.set_piece_quality) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Tactical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.game_model && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Game Model</p>
                  <p className="text-sm">{team.game_model}</p>
                </div>
              )}
              {team.coaching_style && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Coaching Style</p>
                  <p className="text-sm">{team.coaching_style}</p>
                </div>
              )}
              {team.set_piece_quality && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Set Piece Quality</p>
                  <p className="text-sm">{team.set_piece_quality}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Squad Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Squad Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.key_players && team.key_players.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Key Players</p>
                <div className="flex flex-wrap gap-1">
                  {team.key_players.map((player, idx) => (
                    <Badge key={idx} variant="secondary">{player}</Badge>
                  ))}
                </div>
              </div>
            )}
            {team.squad_overview && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Squad Overview</p>
                <p className="text-sm">{team.squad_overview}</p>
              </div>
            )}
            {team.squad_age_profile && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age Profile</p>
                <p className="text-sm">{team.squad_age_profile}</p>
              </div>
            )}
            {team.squad_depth_rating && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Squad Depth</p>
                <Badge variant="outline">{team.squad_depth_rating}/10</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Linked Players */}
        <LinkedPlayersSection teamId={id!} />

        {/* SWOT Analysis Cards */}
        {(team.strengths?.length > 0 || team.weaknesses?.length > 0 || 
          team.opportunities?.length > 0 || team.threats?.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {team.strengths && team.strengths.length > 0 && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                    <Zap className="h-4 w-4" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-1">
                    {team.strengths.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {team.weaknesses && team.weaknesses.length > 0 && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-1">
                    {team.weaknesses.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {team.opportunities && team.opportunities.length > 0 && (
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                    <Target className="h-4 w-4" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-1">
                    {team.opportunities.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {team.threats && team.threats.length > 0 && (
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    Threats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-1">
                    {team.threats.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Opposition Report */}
        {team.opposition_report && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Opposition Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{team.opposition_report}</p>
            </CardContent>
          </Card>
        )}

        {/* Links */}
        {((team.video_links && team.video_links.length > 0) || 
          (team.report_links && team.report_links.length > 0)) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Links & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {team.video_links?.map((link, idx) => (
                <a
                  key={`video-${idx}`}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Video className="h-4 w-4" />
                  Video {idx + 1}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
              {team.report_links?.map((link, idx) => (
                <a
                  key={`report-${idx}`}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Report {idx + 1}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Scout Notes */}
        {team.scout_notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scout Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{team.scout_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Recommendation */}
        {team.recommendation && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{team.recommendation}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamDetails;
