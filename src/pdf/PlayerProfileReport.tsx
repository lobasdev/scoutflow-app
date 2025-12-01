import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';

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

interface AverageRating {
  parameter: string;
  averageScore: number;
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
    marginBottom: 18,
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
  subtitle: {
    fontSize: 11,
    color: '#444',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  metaPill: {
    backgroundColor: '#E0E4F0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    marginRight: 4,
    marginBottom: 4,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 24,
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
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  column: {
    width: '48%',
  },
  fullWidth: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bulletDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginTop: 3,
    marginRight: 3,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  ratingLabel: {
    flex: 1,
    marginRight: 6,
    fontSize: 9,
  },
  ratingScore: {
    width: 32,
    textAlign: 'right',
    fontSize: 9,
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

const calculateAge = (dateOfBirth?: string | null): string => {
  if (!dateOfBirth) return '—';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age}`;
};

interface Props {
  player: Player;
  averageRatings: AverageRating[];
}

const PlayerProfileReport: React.FC<Props> = ({ player, averageRatings }) => {
  const primaryPosition = player.position || '—';
  const ageLabel = player.date_of_birth ? `${calculateAge(player.date_of_birth)} yrs` : '—';

  // Format estimated value as currency
  const formatCurrency = (value?: string | null, numeric?: number | null): string => {
    if (!value && !numeric) return '—';
    const num = numeric || parseInt(value?.replace(/\D/g, '') || '0');
    return `€${num.toLocaleString('en-US').replace(/,/g, ' ')}`;
  };

  const topSkills = averageRatings
    .slice()
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 8);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.playerInfo}>
            <Text style={styles.name}>{player.name}</Text>
            <Text style={styles.subtitle}>{primaryPosition}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaPill}>Age: {ageLabel}</Text>
              <Text style={styles.metaPill}>Nationality: {player.nationality || '—'}</Text>
              {player.foot && <Text style={styles.metaPill}>Foot: {player.foot}</Text>}
              {player.team && <Text style={styles.metaPill}>Club: {player.team}</Text>}
            </View>

            {player.recommendation && (
              <Text style={[styles.paragraph, { marginTop: 6, fontWeight: 'bold', color: '#3B82F6' }]}>
                Recommendation: {player.recommendation}
              </Text>
            )}

            {player.agency && (
              <Text style={[styles.paragraph, { marginTop: 4, fontSize: 9 }]}>
                Agency: {player.agency}{player.agency_link ? ` (${player.agency_link})` : ''}
              </Text>
            )}

            {player.profile_summary && (
              <Text style={[styles.paragraph, { marginTop: 6 }]}>{player.profile_summary}</Text>
            )}
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

        {/* TOP GRID */}
        <View style={styles.gridRow}>
          {/* Left column: value & contract */}
          <View style={styles.column}>
            {(player.estimated_value || player.estimated_value_numeric) && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Estimated value</Text>
                <Text style={styles.cardValue}>
                  {formatCurrency(player.estimated_value, player.estimated_value_numeric)}
                </Text>
              </View>
            )}

            {player.contract_expires && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Contract expires</Text>
                <Text style={styles.cardValue}>{formatDate(player.contract_expires)}</Text>
              </View>
            )}

            {(player.current_salary || player.expected_salary) && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Salary</Text>
                {player.current_salary && (
                  <Text style={styles.paragraph}>Current: {player.current_salary}</Text>
                )}
                {player.expected_salary && (
                  <Text style={styles.paragraph}>Expected: {player.expected_salary}</Text>
                )}
              </View>
            )}
          </View>

          {/* Right column: stats & external ratings */}
          <View style={styles.column}>
            {(player.appearances || player.goals || player.assists) && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Season stats</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={styles.statCard}>
                    <Text style={styles.cardLabel}>Games</Text>
                    <Text style={styles.cardValue}>{player.appearances ?? 0}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.cardLabel}>Goals</Text>
                    <Text style={styles.cardValue}>{player.goals ?? 0}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.cardLabel}>Assists</Text>
                    <Text style={styles.cardValue}>{player.assists ?? 0}</Text>
                  </View>
                </View>
              </View>
            )}

            {topSkills.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Key attributes</Text>
                {topSkills.map((skill, idx) => {
                  const label = skill.parameter
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase());
                  return (
                    <View key={idx} style={styles.ratingRow}>
                      <Text style={styles.ratingLabel}>{label}</Text>
                      <Text style={styles.ratingScore}>{skill.averageScore.toFixed(1)}</Text>
                      <View style={styles.ratingBarBackground}>
                        <View
                          style={[
                            styles.ratingBarFillBase,
                            { width: `${Math.max(5, Math.min((skill.averageScore / 10) * 100, 100))}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* PROFILE + SCOUT NOTES */}
        <View style={styles.gridRow}>
          {player.strengths && player.strengths.length > 0 && (
            <View style={styles.column}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Strengths</Text>
                {player.strengths.slice(0, 6).map((s, idx) => (
                  <View key={idx} style={styles.bullet}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{s}</Text>
                  </View>
                ))}
              </View>

              {player.risks && player.risks.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Risks</Text>
                  {player.risks.slice(0, 4).map((s, idx) => (
                    <View key={idx} style={styles.bullet}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.column}>
            {player.weaknesses && player.weaknesses.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Development areas</Text>
                {player.weaknesses.slice(0, 6).map((s, idx) => (
                  <View key={idx} style={styles.bullet}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {player.scout_notes && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Scout report</Text>
                <Text style={styles.paragraph}>{player.scout_notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* TRANSFER POTENTIAL / TAGS */}
        {(player.transfer_potential_comment || (player.tags && player.tags.length > 0)) && (
          <View style={styles.card}>
            {player.transfer_potential_comment && (
              <>
                <Text style={styles.sectionTitle}>Transfer potential</Text>
                <Text style={[styles.paragraph, { marginBottom: 6 }]}>
                  {player.transfer_potential_comment}
                </Text>
              </>
            )}

            {player.tags && player.tags.length > 0 && (
              <View style={styles.metaRow}>
                {player.tags.slice(0, 10).map((tag, idx) => (
                  <Text key={idx} style={styles.metaPill}>
                    {tag}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>
            Generated by <Link src="https://scoutflow.tech/" style={{ color: '#3B82F6', textDecoration: 'none' }}>Scoutflow</Link>
          </Text>
          <Text>{new Date().toLocaleDateString('en-GB')}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PlayerProfileReport;
