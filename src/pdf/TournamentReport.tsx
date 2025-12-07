import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

interface Tournament {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
}

interface TournamentPlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  shirt_number: string | null;
  rating: number | null;
  observation_count: number | null;
  average_rating: number | null;
  notes: string | null;
}

interface LinkedMatch {
  id: string;
  name: string;
  home_team: string;
  away_team: string;
  date: string;
}

interface TournamentMatch {
  id: string;
  name: string;
  home_team: string | null;
  away_team: string | null;
  match_date: string;
  notes: string | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#F5F7FB',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaPill: {
    backgroundColor: '#E0E4F0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    marginRight: 6,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statBox: {
    alignItems: 'center',
    padding: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4F0',
  },
  matchDate: {
    width: 70,
    fontSize: 9,
    color: '#666',
  },
  matchName: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchTeams: {
    flex: 1,
    fontSize: 9,
    color: '#666',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4F0',
  },
  playerName: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
  },
  playerDetails: {
    width: 100,
    fontSize: 9,
    color: '#666',
  },
  playerTeam: {
    width: 80,
    fontSize: 9,
    color: '#666',
  },
  ratingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
  ratingHigh: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  ratingMedium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  ratingLow: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  obsCount: {
    width: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
  notesText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#444',
  },
  footer: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#6B7280',
  },
  videoLink: {
    color: '#3B82F6',
    textDecoration: 'none',
  },
  emptyText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return value;
  }
};

const formatShortDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short'
    });
  } catch {
    return value;
  }
};

interface Props {
  tournament: Tournament;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  linkedMatches: LinkedMatch[];
}

const TournamentReport: React.FC<Props> = ({ tournament, players, matches, linkedMatches }) => {
  const getRatingStyle = (rating: number | null) => {
    if (!rating) return null;
    if (rating >= 8) return styles.ratingHigh;
    if (rating >= 6) return styles.ratingMedium;
    return styles.ratingLow;
  };

  const totalMatches = matches.length + linkedMatches.length;
  const playersWithRatings = players.filter(p => p.average_rating !== null);
  const avgRating = playersWithRatings.length > 0 
    ? playersWithRatings.reduce((sum, p) => sum + (p.average_rating || 0), 0) / playersWithRatings.length
    : null;

  // Combine and sort all matches by date
  const allMatches = [
    ...linkedMatches.map(m => ({
      id: m.id,
      name: m.name,
      home_team: m.home_team,
      away_team: m.away_team,
      date: m.date,
      type: 'linked' as const,
    })),
    ...matches.map(m => ({
      id: m.id,
      name: m.name,
      home_team: m.home_team,
      away_team: m.away_team,
      date: m.match_date,
      type: 'tournament' as const,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Sort players by average rating (highest first)
  const sortedPlayers = [...players].sort((a, b) => 
    (b.average_rating || 0) - (a.average_rating || 0)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tournament.name}</Text>
          <Text style={styles.subtitle}>Tournament Report</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaPill}>
              {formatDate(tournament.start_date)} — {formatDate(tournament.end_date)}
            </Text>
            {tournament.location && (
              <Text style={styles.metaPill}>{tournament.location}</Text>
            )}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalMatches}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{players.length}</Text>
              <Text style={styles.statLabel}>Players Watched</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {avgRating ? avgRating.toFixed(1) : '—'}
              </Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>
        </View>

        {/* Matches */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Matches ({totalMatches})</Text>
          {allMatches.length === 0 ? (
            <Text style={styles.emptyText}>No matches recorded</Text>
          ) : (
            allMatches.map((match) => (
              <View key={match.id} style={styles.matchRow}>
                <Text style={styles.matchDate}>{formatShortDate(match.date)}</Text>
                <Text style={styles.matchName}>{match.name}</Text>
                {(match.home_team || match.away_team) && (
                  <Text style={styles.matchTeams}>
                    {match.home_team} vs {match.away_team}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Players Watched */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Players Watched ({players.length})</Text>
          {sortedPlayers.length === 0 ? (
            <Text style={styles.emptyText}>No players tracked</Text>
          ) : (
            sortedPlayers.map((player) => (
              <View key={player.id} style={styles.playerRow}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerDetails}>
                  {[player.position, player.shirt_number ? `#${player.shirt_number}` : null]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
                <Text style={styles.playerTeam}>{player.team || ''}</Text>
                <Text style={styles.obsCount}>
                  {player.observation_count || 0} obs
                </Text>
                {player.average_rating && (
                  <Text style={[styles.ratingBadge, getRatingStyle(player.average_rating)]}>
                    {player.average_rating.toFixed(1)}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Notes */}
        {tournament.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tournament Notes</Text>
            <Text style={styles.notesText}>{tournament.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by <Link src="https://scoutflow.tech/" style={styles.videoLink}>Scoutflow</Link>
          </Text>
          <Text>{new Date().toLocaleDateString('en-GB')}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TournamentReport;
