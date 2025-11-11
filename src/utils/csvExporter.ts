import { formatEstimatedValue } from "./valueFormatter";

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
  profile_summary: string | null;
  height: number | null;
  weight: number | null;
  recommendation: string | null;
}

interface Rating {
  parameter: string;
  averageScore: number;
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

export const exportPlayersToCSV = (
  players: Player[],
  averageRatingsMap?: Map<string, Rating[]>
): void => {
  // Define CSV headers
  const headers = [
    "Name",
    "Age",
    "Date of Birth",
    "Position",
    "Team",
    "Nationality",
    "Preferred Foot",
    "Height (cm)",
    "Weight (kg)",
    "Profile Summary",
    "Recommendation",
    "Appearances",
    "Minutes Played",
    "Goals",
    "Assists",
    "Estimated Value",
    "Average Ratings"
  ];

  // Convert players to CSV rows
  const rows = players.map(player => {
    const age = player.date_of_birth ? calculateAge(player.date_of_birth) : "N/A";
    const avgRatings = averageRatingsMap?.get(player.id);
    const ratingsStr = avgRatings
      ? avgRatings.map(r => `${r.parameter}: ${r.averageScore.toFixed(1)}`).join("; ")
      : "No ratings";

    return [
      player.name,
      age,
      player.date_of_birth || "N/A",
      player.position || "N/A",
      player.team || "N/A",
      player.nationality || "N/A",
      player.foot || "N/A",
      player.height || "N/A",
      player.weight || "N/A",
      player.profile_summary ? `"${player.profile_summary.replace(/"/g, '""')}"` : "N/A",
      player.recommendation || "N/A",
      player.appearances ?? "N/A",
      player.minutes_played ?? "N/A",
      player.goals ?? "N/A",
      player.assists ?? "N/A",
      player.estimated_value_numeric ? formatEstimatedValue(player.estimated_value_numeric) : "N/A",
      `"${ratingsStr}"`
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `players_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
