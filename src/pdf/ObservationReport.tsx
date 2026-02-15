import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { calculateAgeString } from '@/utils/dateUtils';

interface Player {
  id?: string;
  name: string;
  position?: string | null;
  team?: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  estimated_value?: string | null;
  estimated_value_numeric?: number | null;
  photo_url?: string | null;
  appearances?: number | null;
  minutesPlayed?: number | null;
  goals?: number | null;
  assists?: number | null;
  foot?: string | null;
  profile_summary?: string | null;
  height?: number | null;
  weight?: number | null;
  recommendation?: string | null;
  contract_expires?: string | null;
  scout_notes?: string | null;
  video_link?: string | null;
  tags?: string[] | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  risks?: string[] | null;
  ceiling_level?: string | null;
  sell_on_potential?: number | null;
  transfer_potential_comment?: string | null;
  shirt_number?: string | null;
  current_salary?: string | null;
  expected_salary?: string | null;
  agency?: string | null;
  agency_link?: string | null;
}

interface Observation {
  date: string;
  location: string | null;
  notes: string | null;
  video_link: string | null;
}

interface Rating {
  parameter: string;
  score: number;
  comment?: string | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#F5F7FB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  playerInfo: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  subtitleLabel: {
    color: '#666',
    marginRight: 4,
  },
  subtitleValue: {
    color: '#222',
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E4F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  smallMuted: {
    fontSize: 9,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    width: '48%',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingLabel: {
    flex: 1,
    marginRight: 6,
  },
  ratingScore: {
    width: 40,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  ratingBarBackground: {
    height: 4,
    backgroundColor: '#E0E4F0',
    borderRadius: 2,
    overflow: 'hidden',
    flex: 1,
    marginLeft: 6,
  },
  ratingBarFillBase: {
    height: 4,
    backgroundColor: '#3B82F6',
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginTop: 4,
    marginRight: 4,
  },
  bulletText: {
    flex: 1,
  },
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('en-GB');
  } catch {
    return value;
  }
};


interface Props {
  player: Player;
  observation: Observation;
  ratings: Rating[];
}

const ObservationReport: React.FC<Props> = ({ player, observation, ratings }) => {
  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : undefined;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.playerInfo}>
            <Text style={styles.name}>{player.name}</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleLabel}>Position:</Text>
              <Text style={styles.subtitleValue}>{player.position || '—'}</Text>
            </View>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleLabel}>Team:</Text>
              <Text style={styles.subtitleValue}>{player.team || '—'}</Text>
            </View>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleLabel}>Age:</Text>
              <Text style={styles.subtitleValue}>
                {player.date_of_birth ? `${calculateAgeString(player.date_of_birth)} years` : '—'}
              </Text>
            </View>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleLabel}>Foot:</Text>
              <Text style={styles.subtitleValue}>{player.foot || '—'}</Text>
            </View>
          </View>

          <View>
            <View style={styles.avatarWrapper}>
              {player.photo_url ? (
                <Image style={styles.avatar} src={player.photo_url} />
              ) : (
                <Text>Photo</Text>
              )}
            </View>
          </View>
        </View>

        {/* Meta row */}
        <View style={[styles.card, { marginBottom: 12 }]}>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.sectionTitle}>Observation</Text>
              <Text style={styles.smallMuted}>Date: {formatDate(observation.date)}</Text>
              {observation.location && (
                <Text style={styles.smallMuted}>Match: {observation.location}</Text>
              )}
              {observation.video_link && (
                <Text style={styles.smallMuted}>Video: {observation.video_link}</Text>
              )}
            </View>
            <View style={styles.half}>
              <Text style={styles.sectionTitle}>Season summary</Text>
              <Text style={styles.smallMuted}>
                Apps: {player.appearances ?? 0} | Goals: {player.goals ?? 0} | Assists: {player.assists ?? 0}
              </Text>
              {avgRating && (
                <Text style={styles.smallMuted}>Average rating: {avgRating} / 10</Text>
              )}
            </View>
          </View>
        </View>

        {/* Profile & notes */}
        {(player.profile_summary || observation.notes) && (
          <View style={styles.row}>
            {player.profile_summary && (
              <View style={[styles.card, styles.half]}>
                <Text style={styles.sectionTitle}>Player profile</Text>
                <Text>{player.profile_summary}</Text>
              </View>
            )}
            {observation.notes && (
              <View style={[styles.card, styles.half]}>
                <Text style={styles.sectionTitle}>Scout report</Text>
                <Text>{observation.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Ratings */}
        {ratings.length > 0 && (
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Performance ratings</Text>
            {ratings.map((r, idx) => {
              const label = r.parameter
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());
              return (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>{label}</Text>
                    <Text style={styles.ratingScore}>{r.score.toFixed(1)}</Text>
                    <View style={styles.ratingBarBackground}>
                      <View
                        style={[
                          styles.ratingBarFillBase,
                          { width: `${Math.max(5, Math.min((r.score / 10) * 100, 100))}%` },
                        ]}
                      />
                    </View>
                  </View>
                  {r.comment && <Text style={styles.smallMuted}>{r.comment}</Text>}
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ObservationReport;
