import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { calculateAgeString } from "@/utils/dateUtils";

export interface DossierPlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  profile_summary?: string | null;
  recommendation: string | null;
  foot: string | null;
  height: number | null;
  weight: number | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  risks?: string[] | null;
  video_link?: string | null;
  agency?: string | null;
  agency_link?: string | null;
  attachments?: Array<{ file_name: string; url?: string | null }>;
  averageRatings: Array<{ parameter: string; averageScore: number }>;
}

const styles = StyleSheet.create({
  page: { padding: 34, fontFamily: "Helvetica", fontSize: 10, color: "#172033", backgroundColor: "#F5F7FB" },
  cover: { flex: 1, justifyContent: "center", paddingHorizontal: 42 },
  brand: { fontSize: 13, color: "#2563EB", marginBottom: 18 },
  title: { fontSize: 32, fontWeight: 700, marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#667085", marginBottom: 28 },
  indexRow: { flexDirection: "row", justifyContent: "space-between", borderBottom: "1 solid #D9DEE8", paddingVertical: 7 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 700, marginBottom: 5 },
  muted: { color: "#667085" },
  photo: { width: 96, height: 96, objectFit: "cover", borderRadius: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  chip: { backgroundColor: "#E5EAF2", borderRadius: 4, paddingVertical: 3, paddingHorizontal: 7, marginRight: 5, marginBottom: 5 },
  grid: { flexDirection: "row", gap: 10 },
  column: { width: "50%" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 6, padding: 11, marginBottom: 10 },
  heading: { fontSize: 11, fontWeight: 700, marginBottom: 7 },
  paragraph: { lineHeight: 1.45 },
  bullet: { flexDirection: "row", marginBottom: 4 },
  dot: { color: "#2563EB", width: 10 },
  bulletText: { flex: 1 },
  rating: { marginBottom: 6 },
  ratingTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  track: { height: 5, backgroundColor: "#E5EAF2", borderRadius: 3 },
  bar: { height: 5, backgroundColor: "#2563EB", borderRadius: 3 },
  link: { color: "#2563EB", textDecoration: "none", marginBottom: 5 },
  footer: { position: "absolute", left: 34, right: 34, bottom: 20, flexDirection: "row", justifyContent: "space-between", color: "#667085", fontSize: 8 },
});

const readable = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function BulletList({ items }: { items?: string[] | null }) {
  if (!items?.length) return <Text style={styles.muted}>Not recorded</Text>;
  return <>{items.slice(0, 7).map((item) => <View key={item} style={styles.bullet}><Text style={styles.dot}>•</Text><Text style={styles.bulletText}>{item}</Text></View>)}</>;
}

export default function PlayerDossierReport({ players, title }: { players: DossierPlayer[]; title: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.brand}>SCOUTFLOW</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{players.length} player{players.length === 1 ? "" : "s"} • {new Date().toLocaleDateString("en-GB")}</Text>
          {players.map((player, index) => <View key={player.id} style={styles.indexRow}><Text>{index + 1}. {player.name}</Text><Text style={styles.muted}>{player.position || "—"} • {player.team || "Unattached"}</Text></View>)}
        </View>
      </Page>
      {players.map((player) => (
        <Page key={player.id} size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.name}>{player.name}</Text>
              <Text style={styles.muted}>{player.position || "Position not set"} • {player.team || "Club not set"}</Text>
              <View style={styles.chips}>
                {player.date_of_birth && <Text style={styles.chip}>Age {calculateAgeString(player.date_of_birth)}</Text>}
                {player.nationality && <Text style={styles.chip}>{player.nationality}</Text>}
                {player.foot && <Text style={styles.chip}>{player.foot} foot</Text>}
                {player.height && <Text style={styles.chip}>{player.height} cm</Text>}
                {player.recommendation && <Text style={styles.chip}>{player.recommendation}</Text>}
              </View>
            </View>
            {player.photo_url && <Image src={player.photo_url} style={styles.photo} />}
          </View>
          <View style={styles.card}><Text style={styles.heading}>Profile summary</Text><Text style={styles.paragraph}>{player.profile_summary || "No profile summary recorded."}</Text></View>
          <View style={styles.grid}>
            <View style={styles.column}>
              <View style={styles.card}><Text style={styles.heading}>Strengths</Text><BulletList items={player.strengths} /></View>
              <View style={styles.card}><Text style={styles.heading}>Development areas</Text><BulletList items={player.weaknesses} /></View>
              <View style={styles.card}><Text style={styles.heading}>Risks</Text><BulletList items={player.risks} /></View>
            </View>
            <View style={styles.column}>
              <View style={styles.card}>
                <Text style={styles.heading}>Average ratings</Text>
                {player.averageRatings.length ? player.averageRatings.slice(0, 10).map((rating) => (
                  <View key={rating.parameter} style={styles.rating}>
                    <View style={styles.ratingTop}><Text>{readable(rating.parameter)}</Text><Text>{rating.averageScore.toFixed(1)}</Text></View>
                    <View style={styles.track}><View style={[styles.bar, { width: `${Math.max(3, Math.min(100, rating.averageScore * 10))}%` }]} /></View>
                  </View>
                )) : <Text style={styles.muted}>No ratings recorded</Text>}
              </View>
              <View style={styles.card}>
                <Text style={styles.heading}>Media and links</Text>
                {player.video_link && <Link src={player.video_link} style={styles.link}>Player video</Link>}
                {player.agency_link && <Link src={player.agency_link} style={styles.link}>{player.agency || "Agency profile"}</Link>}
                {player.attachments?.filter((item) => item.url).map((item) => <Link key={item.file_name} src={item.url || ""} style={styles.link}>{item.file_name}</Link>)}
                {!player.video_link && !player.agency_link && !player.attachments?.some((item) => item.url) && <Text style={styles.muted}>No media links available</Text>}
              </View>
            </View>
          </View>
          <View style={styles.footer}><Text>ScoutFlow player dossier</Text><Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} /></View>
        </Page>
      ))}
    </Document>
  );
}