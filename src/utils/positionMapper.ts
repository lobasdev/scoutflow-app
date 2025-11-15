// Map football-data.org positions to our position constants
export const mapFootballDataPosition = (position: string | null): string => {
  if (!position) return "";
  
  const positionLower = position.toLowerCase();
  
  // Goalkeeper
  if (positionLower.includes("goalkeeper") || positionLower.includes("goalie")) {
    return "GK";
  }
  
  // Defenders
  if (positionLower.includes("centre-back") || positionLower.includes("central defender") || positionLower === "defender" || positionLower === "defence") {
    return "CB";
  }
  if (positionLower.includes("left-back") || positionLower.includes("left back") || positionLower === "left back") {
    return "LB";
  }
  if (positionLower.includes("left wing-back") || positionLower.includes("left wingback")) {
    return "LWB";
  }
  if (positionLower.includes("right-back") || positionLower.includes("right back") || positionLower === "right back") {
    return "RB";
  }
  if (positionLower.includes("right wing-back") || positionLower.includes("right wingback")) {
    return "RWB";
  }
  
  // Midfielders
  if (positionLower.includes("defensive midfield") || positionLower.includes("holding midfield")) {
    return "CDM";
  }
  if (positionLower.includes("central midfield") || positionLower === "midfield") {
    return "CM";
  }
  if (positionLower.includes("attacking midfield")) {
    return "CAM";
  }
  
  // Wingers
  if (positionLower.includes("left wing") || positionLower.includes("left winger")) {
    return "LW";
  }
  if (positionLower.includes("right wing") || positionLower.includes("right winger")) {
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
