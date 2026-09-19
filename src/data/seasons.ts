import type { Matchup } from '../lib/tracker';
import _2023 from './seasons/2023.json';
import _2024 from './seasons/2024.json';
import _2025 from './seasons/2025.json';
import _2026 from './seasons/2026.json';

export interface WeekData {
	week: number;
	matchups: Matchup[];
}

export interface Season {
	id: string;
	label: string;
	weeks: WeekData[];
	complete?: boolean;
}

export const seasons: Season[] = [
	{ id: '2026', label: '2026 Season', weeks: _2026 as WeekData[] },
	{ id: '2025', label: '2025 Season', complete: true, weeks: _2025 as WeekData[] },
	{ id: '2024', label: '2024 Season', complete: true, weeks: _2024 as WeekData[] },
	{ id: '2023', label: '2023 Season', complete: true, weeks: _2023 as WeekData[] },
];

export function getSeason(id: string): Season | undefined {
	return seasons.find((s) => s.id === id);
}