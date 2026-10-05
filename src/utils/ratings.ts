import { getSkillsForPosition } from "@/constants/skills";

export interface RatingScore { parameter: string; score: number }

export function calculateAverageRatings(position: string | null, ratings: RatingScore[]) {
  const allowed = new Set(getSkillsForPosition(position).map((skill) => skill.key));
  const scores = new Map<string, number[]>();
  ratings.forEach((rating) => {
    if (!allowed.has(rating.parameter)) return;
    scores.set(rating.parameter, [...(scores.get(rating.parameter) || []), rating.score]);
  });
  return [...scores.entries()].map(([parameter, values]) => ({
    parameter,
    averageScore: values.reduce((total, score) => total + score, 0) / values.length,
  }));
}