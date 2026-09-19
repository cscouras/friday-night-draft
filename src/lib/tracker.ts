export interface TeamScore {
  teamId: string | number;
  teamName: string;
  score: number;
}

export interface Matchup {
  team1: TeamScore;
  team2: TeamScore;
}

export interface TeamRecord {
  w: number;
  l: number;
  t: number;
  winPct: number;
}

export interface TeamStanding {
  teamId: string | number;
  name: string;
  w: number;
  l: number;
  t: number;
  pf: number;
  pa: number;
  winPct: number;
  h2h: TeamRecord;
  median?: TeamRecord;
}

export interface WeeklyAuditRow {
  name: string;
  score: number;
  opponent: string;
  oppScore: number;
  h2h: 'W' | 'L' | 'T';
  med: 'W' | 'L' | 'T';
  wins: number;
  losses: number;
  ties: number;
}

export type Result = 'W' | 'L' | 'T';

export function resultFrom(score: number, against: number): Result {
  if (score > against) return 'W';
  if (score < against) return 'L';
  return 'T';
}

export function formatRecord(w: number, l: number, t: number): string {
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

export function computeMedian(scores: number[]): number {
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[Math.floor(mid)];
}

export function getWeeklyAudit(matchups: Matchup[]): {
  median: number;
  rows: WeeklyAuditRow[];
} {
  const weeklyScores = matchups.flatMap(({ team1, team2 }) => [
    team1.score,
    team2.score,
  ]);
  const median = computeMedian(weeklyScores);

  const rows: WeeklyAuditRow[] = [];
  for (const { team1, team2 } of matchups) {
    for (const [team, opp] of [
      [team1, team2],
      [team2, team1],
    ] as const) {
      const h2h = resultFrom(team.score, opp.score);
      const med = resultFrom(team.score, median);
      const wins = (h2h === 'W' ? 1 : 0) + (med === 'W' ? 1 : 0);
      const losses = (h2h === 'L' ? 1 : 0) + (med === 'L' ? 1 : 0);
      const ties = (h2h === 'T' ? 1 : 0) + (med === 'T' ? 1 : 0);
      rows.push({
        name: team.teamName,
        score: team.score,
        opponent: opp.teamName,
        oppScore: opp.score,
        h2h,
        med,
        wins,
        losses,
        ties,
      });
    }
  }

  return { median, rows };
}

export type TrackerMode = 'median' | 'h2h';

interface RawRecord {
  w: number;
  l: number;
  t: number;
}

interface TeamData {
  name: string;
  h2h: RawRecord;
  median?: RawRecord;
  pf: number;
  paOpp: number;
  paMedian: number;
}

const emptyRecord = (): RawRecord => ({ w: 0, l: 0, t: 0 });

const recordWinPct = ({ w, l, t }: RawRecord): number => {
  const total = w + l + t;
  return total > 0 ? (w + 0.5 * t) / total : 0;
};

const toTeamRecord = (rec: RawRecord): TeamRecord => ({
  w: rec.w,
  l: rec.l,
  t: rec.t,
  winPct: recordWinPct(rec),
});

const addResult = (rec: RawRecord, result: Result): void => {
  if (result === 'W') rec.w++;
  else if (result === 'L') rec.l++;
  else rec.t++;
};

export class LeagueTracker {
  // Keyed permanently by teamId
  private records: Map<string | number, TeamData> = new Map();

  private mode: TrackerMode;

  constructor(options: { mode?: TrackerMode } = {}) {
    this.mode = options.mode ?? 'median';
  }

  private getOrCreate(teamId: string | number, currentName: string): TeamData {
    if (!this.records.has(teamId)) {
      this.records.set(teamId, {
        name: currentName,
        h2h: emptyRecord(),
        pf: 0,
        paOpp: 0,
        paMedian: 0,
      });
    }
    const record = this.records.get(teamId)!;
    // Always update name to the latest one seen
    record.name = currentName;
    return record;
  }

  public processWeek(matchups: Matchup[]): void {
    const weeklyScores: { id: string | number; score: number }[] = [];

    // 1. Process Head-to-Head Matchups
    for (const { team1, team2 } of matchups) {
      const t1 = this.getOrCreate(team1.teamId, team1.teamName);
      const t2 = this.getOrCreate(team2.teamId, team2.teamName);

      t1.pf += team1.score;
      t1.paOpp += team2.score;
      t2.pf += team2.score;
      t2.paOpp += team1.score;

      addResult(t1.h2h, resultFrom(team1.score, team2.score));
      addResult(t2.h2h, resultFrom(team2.score, team1.score));

      weeklyScores.push(
        { id: team1.teamId, score: team1.score },
        { id: team2.teamId, score: team2.score }
      );
    }

    // 2. Calculate Weekly Median
    const median = computeMedian(weeklyScores.map(({ score }) => score));

    // 3. Process Median Matchup
    if (this.mode === 'median') {
      for (const { id, score } of weeklyScores) {
        const team = this.records.get(id)!;
        if (!team.median) team.median = emptyRecord();
        team.paMedian += median;
        addResult(team.median, resultFrom(score, median));
      }
    }
  }

  public getStandings(): TeamStanding[] {
    const useMedian = this.mode === 'median';
    return Array.from(this.records.entries())
      .map(([teamId, stats]) => {
        const median = stats.median ?? emptyRecord();
        const combined: RawRecord = {
          w: stats.h2h.w + median.w,
          l: stats.h2h.l + median.l,
          t: stats.h2h.t + median.t,
        };
        const pa = stats.paOpp + (useMedian ? stats.paMedian : 0);
        return {
          teamId,
          name: stats.name,
          w: combined.w,
          l: combined.l,
          t: combined.t,
          pf: Number(stats.pf.toFixed(2)),
          pa: Number(pa.toFixed(2)),
          winPct: recordWinPct(combined),
          h2h: toTeamRecord(stats.h2h),
          median: useMedian ? toTeamRecord(median) : undefined,
        };
      })
      .sort((a, b) => b.winPct - a.winPct || b.w - a.w || b.pf - a.pf);
  }
}