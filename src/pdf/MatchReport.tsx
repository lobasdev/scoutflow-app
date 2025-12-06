import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

interface MatchPlayer {
  id: string;
  name: string;
  position: string | null;
  shirt_number: string | null;
  is_starter: boolean;
  rating: number | null;
  observation_id: string | null;
}

interface Match {
  id: string;
  name: string;
  date: string;
  location: string | null;
  home_team: string;
  away_team: string;
  notes: string | null;
  weather: string | null;
  kickoff_time: string | null;
  match_video_link: string | null;
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
  matchTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 12,
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
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  teamHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4F0',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderLeftWidth: 2,
    borderLeftColor: '#3B82F6',
    paddingLeft: 6,
    marginBottom: 2,
  },
  subPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderLeftWidth: 2,
    borderLeftColor: '#9CA3AF',
    paddingLeft: 6,
    marginBottom: 2,
  },
  shirtNumber: {
    width: 20,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  position: {
    width: 28,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  playerName: {
    flex: 1,
    fontSize: 9,
  },
  ratingBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
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
  subsLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 10,
    lineHeight: 1.4,
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
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return value;
  }
};

interface Props {
  match: Match;
  homePlayers: MatchPlayer[];
  awayPlayers: MatchPlayer[];
}

const MatchReport: React.FC<Props> = ({ match, homePlayers, awayPlayers }) => {
  const renderPlayerRow = (player: MatchPlayer, isStarter: boolean) => {
    const getRatingStyle = (rating: number | null) => {
      if (!rating) return null;
      if (rating >= 8) return styles.ratingHigh;
      if (rating >= 6) return styles.ratingMedium;
      return styles.ratingLow;
    };

    return (
      <View key={player.id} style={isStarter ? styles.playerRow : styles.subPlayerRow}>
        <Text style={styles.shirtNumber}>{player.shirt_number || '-'}</Text>
        <Text style={styles.position}>{player.position || ''}</Text>
        <Text style={styles.playerName}>{player.name}</Text>
        {player.rating && (
          <Text style={[styles.ratingBadge, getRatingStyle(player.rating)]}>
            {player.rating.toFixed(1)}
          </Text>
        )}
      </View>
    );
  };

  const renderTeamColumn = (teamName: string, players: MatchPlayer[]) => {
    const starters = players.filter(p => p.is_starter);
    const subs = players.filter(p => !p.is_starter);

    return (
      <View style={styles.column}>
        <Text style={styles.teamHeader}>{teamName}</Text>
        {starters.map(player => renderPlayerRow(player, true))}
        {subs.length > 0 && (
          <>
            <Text style={styles.subsLabel}>Substitutes</Text>
            {subs.map(player => renderPlayerRow(player, false))}
          </>
        )}
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.matchTitle}>{match.name}</Text>
          <View style={styles.teamsRow}>
            <Text style={styles.teamName}>{match.home_team}</Text>
            <Text style={styles.vsText}>vs</Text>
            <Text style={styles.teamName}>{match.away_team}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaPill}>{formatDate(match.date)}</Text>
            {match.kickoff_time && (
              <Text style={styles.metaPill}>{match.kickoff_time}</Text>
            )}
            {match.location && (
              <Text style={styles.metaPill}>{match.location}</Text>
            )}
            {match.weather && (
              <Text style={styles.metaPill}>{match.weather}</Text>
            )}
          </View>
          {match.match_video_link && (
            <Link src={match.match_video_link} style={styles.videoLink}>
              Watch match video
            </Link>
          )}
        </View>

        {/* Match Sheet */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Match Sheet</Text>
          <View style={styles.gridRow}>
            {renderTeamColumn(match.home_team, homePlayers)}
            {renderTeamColumn(match.away_team, awayPlayers)}
          </View>
        </View>

        {/* Notes */}
        {match.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Match Notes</Text>
            <Text style={styles.notesText}>{match.notes}</Text>
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

export default MatchReport;
