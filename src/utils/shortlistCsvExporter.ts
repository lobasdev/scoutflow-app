import { formatEstimatedValue } from "./valueFormatter";

interface Player {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  estimated_value_numeric: number | null;
  foot: string | null;
  height: number | null;
  weight: number | null;
  recommendation: string | null;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
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

export const exportShortlistToCSV = (
  shortlistName: string,
  players: Player[]
): void => {
  const headers = [
    "Name",
    "Age",
    "Position",
    "Team",
    "Nationality",
    "Foot",
    "Height (cm)",
    "Weight (kg)",
    "Recommendation",
    "Appearances",
    "Goals",
    "Assists",
    "Estimated Value"
  ];

  const rows = players.map(player => {
    const age = player.date_of_birth ? calculateAge(player.date_of_birth) : "N/A";

    return [
      player.name,
      age,
      player.position || "N/A",
      player.team || "N/A",
      player.nationality || "N/A",
      player.foot || "N/A",
      player.height || "N/A",
      player.weight || "N/A",
      player.recommendation || "N/A",
      player.appearances ?? "N/A",
      player.goals ?? "N/A",
      player.assists ?? "N/A",
      player.estimated_value_numeric ? formatEstimatedValue(player.estimated_value_numeric) : "N/A"
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  const sanitizedName = shortlistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute("href", url);
  link.setAttribute("download", `shortlist_${sanitizedName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
