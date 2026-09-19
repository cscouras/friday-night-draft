import { LeagueTracker, type TeamStanding } from './tracker';
import type { Season } from '../data/seasons';

export interface WhatIfRow {
	team: TeamStanding;
	h2hRank: number;
	league: TeamStanding | null;
	leagueRank: number;
	movement: number;
}

const ordinal = (n: number) => {
	const ones = n % 10;
	const tens = Math.floor(n / 10) % 10;
	if (tens === 1) return `${n}th`;
	if (ones === 1) return `${n}st`;
	if (ones === 2) return `${n}nd`;
	if (ones === 3) return `${n}rd`;
	return `${n}th`;
};

export function getWhatIf(season: Season): {
	rows: WhatIfRow[];
	movers: WhatIfRow[];
	totalWeeks: number;
	summary: string;
} {
	const leagueTracker = new LeagueTracker();
	const h2hTracker = new LeagueTracker({ mode: 'h2h' });

	for (const week of season.weeks) {
		leagueTracker.processWeek(week.matchups);
		h2hTracker.processWeek(week.matchups);
	}

	const leagueStandings = leagueTracker.getStandings();
	const h2hStandings = h2hTracker.getStandings();

	const leagueRankById = new Map(leagueStandings.map((t, i) => [t.teamId, i]));

	const rows: WhatIfRow[] = h2hStandings.map((team, h2hRank) => {
		const leagueRank = leagueRankById.get(team.teamId) ?? h2hRank;
		const league = leagueRankById.has(team.teamId)
			? leagueStandings[leagueRank]
			: null;
		const movement = h2hRank - leagueRank;
		return { team, h2hRank, league, leagueRank, movement };
	});

	const totalWeeks = season.weeks.length;

	const movers = rows
		.filter((r) => r.movement !== 0)
		.sort((a, b) => b.movement - a.movement);

	const position = (r: WhatIfRow): string =>
		`${ordinal(r.h2hRank + 1)} → ${ordinal(r.leagueRank + 1)}`;

	let summary: string;
	if (movers.length === 0) {
		summary = `With ${totalWeeks} completed ${totalWeeks === 1 ? 'week' : 'weeks'}, adding the league median matchup wouldn't have changed any team's final placement.`;
	} else {
		const riser = movers[0];
		const faller = movers[movers.length - 1];
		const riserClause = `${riser.team.name} would have climbed ${riser.movement} ${riser.movement === 1 ? 'place' : 'places'} (${position(riser)})`;
		const fallerClause = `${faller.team.name} would have slipped ${Math.abs(faller.movement)} ${Math.abs(faller.movement) === 1 ? 'place' : 'places'} (${position(faller)})`;
		summary = `If league median scoring had been used, ${movers.length} of ${rows.length} teams would have finished in a different spot. ${riserClause}; ${fallerClause}.`;
	}

	return { rows, movers, totalWeeks, summary };
}