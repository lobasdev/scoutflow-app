// Position categories
export const GOALKEEPER_POSITIONS = ['GK'];
export const FIELD_POSITIONS = ['LB', 'RB', 'CB', 'DM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];

export const ALL_POSITIONS = [...GOALKEEPER_POSITIONS, ...FIELD_POSITIONS];

// Skill definitions
export interface SkillParameter {
  key: string;
  label: string;
}

export const FIELD_PLAYER_SKILLS: SkillParameter[] = [
  { key: "speed", label: "Speed" },
  { key: "passing", label: "Passing" },
  { key: "vision", label: "Vision" },
  { key: "technique", label: "Technique" },
  { key: "decision_making", label: "Decision Making" },
  { key: "physicality", label: "Physicality" },
  { key: "potential", label: "Potential" },
];

export const GOALKEEPER_SKILLS: SkillParameter[] = [
  { key: "reflexes", label: "Reflexes" },
  { key: "distribution", label: "Distribution" },
  { key: "positioning", label: "Positioning" },
  { key: "handling", label: "Handling" },
  { key: "decision_making", label: "Decision Making" },
  { key: "physicality", label: "Physicality" },
  { key: "potential", label: "Potential" },
];

export const getSkillsForPosition = (position: string | null): SkillParameter[] => {
  if (!position) return FIELD_PLAYER_SKILLS;
  return GOALKEEPER_POSITIONS.includes(position) ? GOALKEEPER_SKILLS : FIELD_PLAYER_SKILLS;
};

export const isGoalkeeper = (position: string | null): boolean => {
  return position ? GOALKEEPER_POSITIONS.includes(position) : false;
};
