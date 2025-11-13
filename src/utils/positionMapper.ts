// Map football-data.org positions to our position constants
export const mapFootballDataPosition = (position: string | null): string => {
  if (!position) return "";
  
  const positionLower = position.toLowerCase();
  
  // Goalkeeper
  if (positionLower.includes("goalkeeper") || positionLower.includes("goalie")) {
    return "GK";
  }
  
  // Defenders
  if (positionLower.includes("centre-back") || positionLower.includes("central defender") || positionLower === "defender") {
    return "CB";
  }
  if (positionLower.includes("left-back") || positionLower.includes("left back")) {
    return "LB";
  }
  if (positionLower.includes("right-back") || positionLower.includes("right back")) {
    return "RB";
  }
  
  // Midfielders
  if (positionLower.includes("defensive midfield") || positionLower.includes("holding midfield")) {
    return "DM";
  }
  if (positionLower.includes("central midfield") || positionLower === "midfield") {
    return "CM";
  }
  if (positionLower.includes("attacking midfield")) {
    return "CAM";
  }
  if (positionLower.includes("left midfield")) {
    return "LM";
  }
  if (positionLower.includes("right midfield")) {
    return "RM";
  }
  
  // Wingers
  if (positionLower.includes("left wing")) {
    return "LW";
  }
  if (positionLower.includes("right wing")) {
    return "RW";
  }
  
  // Forwards
  if (positionLower.includes("centre-forward") || positionLower.includes("central forward")) {
    return "CF";
  }
  if (positionLower.includes("striker") || positionLower.includes("attacker") || positionLower === "offence") {
    return "ST";
  }
  
  // If no match, return the original position
  return position;
};
