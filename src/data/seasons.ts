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
}

export const seasons: Season[] = [
	{ id: '2026', label: '2026 Season', weeks: _2026 as WeekData[] },
	{ id: '2025', label: '2025 Season', weeks: _2025 as WeekData[] },
	{ id: '2024', label: '2024 Season', weeks: _2024 as WeekData[] },
	{ id: '2023', label: '2023 Season', weeks: _2023 as WeekData[] },
];

export function getSeason(id: string): Season | undefined {
	return seasons.find((s) => s.id === id);
}