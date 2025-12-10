import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2px solid #1a365d",
    paddingBottom: 15,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#4a5568",
  },
  section: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f7fafc",
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: "#718096",
    width: 100,
  },
  value: {
    fontSize: 10,
    color: "#2d3748",
    flex: 1,
  },
  paragraph: {
    fontSize: 10,
    color: "#2d3748",
    lineHeight: 1.5,
  },
  formationsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  formationBadge: {
    backgroundColor: "#e2e8f0",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 10,
    color: "#2d3748",
  },
  swotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swotCard: {
    width: "48%",
    padding: 10,
    borderRadius: 6,
  },
  swotStrengths: {
    backgroundColor: "#dcfce7",
    borderLeft: "3px solid #22c55e",
  },
  swotWeaknesses: {
    backgroundColor: "#fee2e2",
    borderLeft: "3px solid #ef4444",
  },
  swotOpportunities: {
    backgroundColor: "#dbeafe",
    borderLeft: "3px solid #3b82f6",
  },
  swotThreats: {
    backgroundColor: "#ffedd5",
    borderLeft: "3px solid #f97316",
  },
  swotTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
  },
  swotItem: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
  },
  keyPlayersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  playerBadge: {
    backgroundColor: "#1a365d",
    color: "#ffffff",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 9,
  },
  keyFindingsBox: {
    backgroundColor: "#fef3c7",
    borderLeft: "4px solid #f59e0b",
    padding: 12,
    marginBottom: 15,
  },
  recommendationBox: {
    backgroundColor: "#e0f2fe",
    borderLeft: "4px solid #0284c7",
    padding: 12,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a365d",
  },
  statLabel: {
    fontSize: 8,
    color: "#718096",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#a0aec0",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 10,
  },
});

interface Team {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  league?: string | null;
  stadium?: string | null;
  founded_year?: number | null;
  manager?: string | null;
  website?: string | null;
  season?: string | null;
  wins?: number | null;
  draws?: number | null;
  losses?: number | null;
  goals_for?: number | null;
  goals_against?: number | null;
  clean_sheets?: number | null;
  formations?: string[] | null;
  game_model?: string | null;
  coaching_style?: string | null;
  pressing_style?: string | null;
  build_up_play?: string | null;
  defensive_approach?: string | null;
  set_piece_quality?: string | null;
  tactical_shape?: string | null;
  attacking_patterns?: string | null;
  defensive_patterns?: string | null;
  transition_play?: string | null;
  key_players?: string[] | null;
  squad_overview?: string | null;
  squad_age_profile?: string | null;
  squad_depth_rating?: number | null;
  key_findings?: string | null;
  opposition_report?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  opportunities?: string[] | null;
  threats?: string[] | null;
  scout_notes?: string | null;
  recommendation?: string | null;
}

interface TeamReportProps {
  team: Team;
}

const TeamReport = ({ team }: TeamReportProps) => {
  const location = [team.city, team.country].filter(Boolean).join(", ");
  const hasSWOT = (team.strengths?.length || 0) > 0 || 
                  (team.weaknesses?.length || 0) > 0 || 
                  (team.opportunities?.length || 0) > 0 || 
                  (team.threats?.length || 0) > 0;

  const totalMatches = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);
  const hasSeasonStats = totalMatches > 0 || (team.goals_for || 0) > 0;
  const winRate = totalMatches > 0 ? Math.round(((team.wins || 0) / totalMatches) * 100) : 0;
  const goalDifference = (team.goals_for || 0) - (team.goals_against || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.teamName}>{team.name}</Text>
          {team.league && <Text style={styles.subtitle}>{team.league}</Text>}
          {location && <Text style={styles.subtitle}>{location}</Text>}
        </View>

        {/* Key Findings - Priority Section */}
        {team.key_findings && (
          <View style={styles.keyFindingsBox}>
            <Text style={[styles.sectionTitle, { marginBottom: 6, color: "#92400e" }]}>Key Findings</Text>
            <Text style={styles.paragraph}>{team.key_findings}</Text>
          </View>
        )}

        {/* Season Statistics */}
        {hasSeasonStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Season Statistics {team.season ? `(${team.season})` : ''}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{team.wins || 0}</Text>
                <Text style={styles.statLabel}>WINS</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{team.draws || 0}</Text>
                <Text style={styles.statLabel}>DRAWS</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{team.losses || 0}</Text>
                <Text style={styles.statLabel}>LOSSES</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{winRate}%</Text>
                <Text style={styles.statLabel}>WIN RATE</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{team.goals_for || 0}</Text>
                <Text style={styles.statLabel}>GOALS FOR</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{team.goals_against || 0}</Text>
                <Text style={styles.statLabel}>GOALS AGAINST</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: goalDifference >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {goalDifference >= 0 ? '+' : ''}{goalDifference}
                </Text>
                <Text style={styles.statLabel}>GOAL DIFF</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{team.clean_sheets || 0}</Text>
                <Text style={styles.statLabel}>CLEAN SHEETS</Text>
              </View>
            </View>
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Information</Text>
          {team.stadium && (
            <View style={styles.row}>
              <Text style={styles.label}>Stadium:</Text>
              <Text style={styles.value}>{team.stadium}</Text>
            </View>
          )}
          {team.founded_year && (
            <View style={styles.row}>
              <Text style={styles.label}>Founded:</Text>
              <Text style={styles.value}>{team.founded_year}</Text>
            </View>
          )}
          {team.manager && (
            <View style={styles.row}>
              <Text style={styles.label}>Manager:</Text>
              <Text style={styles.value}>{team.manager}</Text>
            </View>
          )}
          {team.website && (
            <View style={styles.row}>
              <Text style={styles.label}>Website:</Text>
              <Text style={styles.value}>{team.website}</Text>
            </View>
          )}
        </View>

        {/* Formations */}
        {team.formations && team.formations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Formations</Text>
            <View style={styles.formationsRow}>
              {team.formations.map((formation, idx) => (
                <Text key={idx} style={styles.formationBadge}>{formation}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Tactical Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tactical Analysis</Text>
          {team.tactical_shape && (
            <View style={styles.row}>
              <Text style={styles.label}>Tactical Shape:</Text>
              <Text style={styles.value}>{team.tactical_shape}</Text>
            </View>
          )}
          {team.game_model && (
            <View style={styles.row}>
              <Text style={styles.label}>Game Model:</Text>
              <Text style={styles.value}>{team.game_model}</Text>
            </View>
          )}
          {team.coaching_style && (
            <View style={styles.row}>
              <Text style={styles.label}>Coaching Style:</Text>
              <Text style={styles.value}>{team.coaching_style}</Text>
            </View>
          )}
          {team.pressing_style && (
            <View style={styles.row}>
              <Text style={styles.label}>Pressing:</Text>
              <Text style={styles.value}>{team.pressing_style}</Text>
            </View>
          )}
          {team.build_up_play && (
            <View style={styles.row}>
              <Text style={styles.label}>Build-up:</Text>
              <Text style={styles.value}>{team.build_up_play}</Text>
            </View>
          )}
          {team.defensive_approach && (
            <View style={styles.row}>
              <Text style={styles.label}>Defense:</Text>
              <Text style={styles.value}>{team.defensive_approach}</Text>
            </View>
          )}
          {team.attacking_patterns && (
            <View style={styles.row}>
              <Text style={styles.label}>Attack Patterns:</Text>
              <Text style={styles.value}>{team.attacking_patterns}</Text>
            </View>
          )}
          {team.defensive_patterns && (
            <View style={styles.row}>
              <Text style={styles.label}>Defense Patterns:</Text>
              <Text style={styles.value}>{team.defensive_patterns}</Text>
            </View>
          )}
          {team.transition_play && (
            <View style={styles.row}>
              <Text style={styles.label}>Transitions:</Text>
              <Text style={styles.value}>{team.transition_play}</Text>
            </View>
          )}
          {team.set_piece_quality && (
            <View style={styles.row}>
              <Text style={styles.label}>Set Pieces:</Text>
              <Text style={styles.value}>{team.set_piece_quality}</Text>
            </View>
          )}
        </View>

        {/* Squad Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Squad Analysis</Text>
          {team.key_players && team.key_players.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ ...styles.label, marginBottom: 4 }}>Key Players:</Text>
              <View style={styles.keyPlayersGrid}>
                {team.key_players.map((player, idx) => (
                  <Text key={idx} style={styles.playerBadge}>{player}</Text>
                ))}
              </View>
            </View>
          )}
          {team.squad_overview && (
            <View style={styles.row}>
              <Text style={styles.label}>Overview:</Text>
              <Text style={styles.value}>{team.squad_overview}</Text>
            </View>
          )}
          {team.squad_age_profile && (
            <View style={styles.row}>
              <Text style={styles.label}>Age Profile:</Text>
              <Text style={styles.value}>{team.squad_age_profile}</Text>
            </View>
          )}
          {team.squad_depth_rating && (
            <View style={styles.row}>
              <Text style={styles.label}>Depth Rating:</Text>
              <Text style={styles.value}>{team.squad_depth_rating}/10</Text>
            </View>
          )}
        </View>

        {/* Team Assessment */}
        {hasSWOT && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Assessment</Text>
            <View style={styles.swotGrid}>
              {team.strengths && team.strengths.length > 0 && (
                <View style={[styles.swotCard, styles.swotStrengths]}>
                  <Text style={[styles.swotTitle, { color: "#166534" }]}>Strengths</Text>
                  {team.strengths.map((item, idx) => (
                    <Text key={idx} style={styles.swotItem}>- {item}</Text>
                  ))}
                </View>
              )}
              {team.weaknesses && team.weaknesses.length > 0 && (
                <View style={[styles.swotCard, styles.swotWeaknesses]}>
                  <Text style={[styles.swotTitle, { color: "#991b1b" }]}>Weaknesses</Text>
                  {team.weaknesses.map((item, idx) => (
                    <Text key={idx} style={styles.swotItem}>- {item}</Text>
                  ))}
                </View>
              )}
              {team.opportunities && team.opportunities.length > 0 && (
                <View style={[styles.swotCard, styles.swotOpportunities]}>
                  <Text style={[styles.swotTitle, { color: "#1e40af" }]}>Opportunities</Text>
                  {team.opportunities.map((item, idx) => (
                    <Text key={idx} style={styles.swotItem}>- {item}</Text>
                  ))}
                </View>
              )}
              {team.threats && team.threats.length > 0 && (
                <View style={[styles.swotCard, styles.swotThreats]}>
                  <Text style={[styles.swotTitle, { color: "#c2410c" }]}>Threats</Text>
                  {team.threats.map((item, idx) => (
                    <Text key={idx} style={styles.swotItem}>- {item}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Opposition Report */}
        {team.opposition_report && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opposition Report</Text>
            <Text style={styles.paragraph}>{team.opposition_report}</Text>
          </View>
        )}

        {/* Scout Notes */}
        {team.scout_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scout Notes</Text>
            <Text style={styles.paragraph}>{team.scout_notes}</Text>
          </View>
        )}

        {/* Recommendation */}
        {team.recommendation && (
          <View style={styles.recommendationBox}>
            <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Recommendation</Text>
            <Text style={styles.paragraph}>{team.recommendation}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          ScoutFlow Team Report - scoutflow.tech - Generated on {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
};

export default TeamReport;
