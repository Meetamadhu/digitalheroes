import { DRAW_NUMBER_COUNT, SCORE_MAX, SCORE_MIN } from "./constants";

export type DrawLogic = "random" | "algorithmic";

/** Pick five unique winning numbers in Stableford range. */
export function drawWinningNumbers(
  logic: DrawLogic,
  scoreFrequency: Map<number, number>,
): number[] {
  if (logic === "random") {
    return pickRandomUnique(DRAW_NUMBER_COUNT, SCORE_MIN, SCORE_MAX);
  }

  const weighted: number[] = [];
  for (let n = SCORE_MIN; n <= SCORE_MAX; n++) {
    const weight = scoreFrequency.get(n) ?? 1;
    for (let i = 0; i < weight; i++) weighted.push(n);
  }

  const chosen = new Set<number>();
  while (chosen.size < DRAW_NUMBER_COUNT && weighted.length > 0) {
    const idx = Math.floor(Math.random() * weighted.length);
    chosen.add(weighted[idx]);
  }

  while (chosen.size < DRAW_NUMBER_COUNT) {
    chosen.add(SCORE_MIN + Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)));
  }

  return [...chosen].sort((a, b) => a - b);
}

export function countMatches(userScores: number[], winningNumbers: number[]): number {
  const wins = new Set(winningNumbers);
  return userScores.filter((s) => wins.has(s)).length;
}

export function buildScoreFrequency(allScores: number[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const s of allScores) {
    map.set(s, (map.get(s) ?? 0) + 1);
  }
  return map;
}

function pickRandomUnique(count: number, min: number, max: number): number[] {
  const set = new Set<number>();
  while (set.size < count) {
    set.add(min + Math.floor(Math.random() * (max - min + 1)));
  }
  return [...set].sort((a, b) => a - b);
}

export type SimulationRow = {
  userId: string;
  email: string;
  scores: number[];
  matchCount: number;
};

export function simulateDraw(
  winningNumbers: number[],
  participants: { userId: string; email: string; scores: number[] }[],
): SimulationRow[] {
  return participants
    .map((p) => ({
      ...p,
      matchCount: countMatches(p.scores, winningNumbers),
    }))
    .sort((a, b) => b.matchCount - a.matchCount);
}
