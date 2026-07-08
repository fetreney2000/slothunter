// Solver shared types

export type DayType = 'weekday' | 'saturday' | 'sunday' | 'holiday';

export type DeptType = 'IPP' | 'OPD';
export type RoleType = 'PPF' | 'PRA';
export type UserRole = 'Admin' | 'Staff';

export interface Employee {
	employeeId: string;
	name: string;
	dept: DeptType;
	role: RoleType;
	email: string;
	maxHoursPerMonth: number;
	active: boolean;
	salary: number;
	annualAE: number;
	annualHalfPaidAE: number;
	annualPaidAE: number;
	annualPHAE: number;
	annualPH: number;
}

export interface SlotTemplate {
	slotType: string;
	dept: DeptType | null; // null = flexible (both departments eligible)
	role: RoleType;
	hours: number;
}

export interface Slot {
	date: string;
	day: string;
	dayType: DayType;
	slotType: string;
	dept: DeptType | null;
	role: RoleType;
	hours: number;
}

export interface PreselectionEntry {
	date: string;
	slotType: string;
	employeeId: string;
}

export interface RosterResult {
	rosterId: string;
	slots: RosterSlotResult[];
	warnings: string[];
	metrics: SolverMetrics;
	elapsedMs: number;
	strategy: string;
}

export interface RosterSlotResult {
	date: string;
	day: string;
	dayType: DayType;
	slotType: string;
	employeeId: string;
	employeeName: string;
	dept: DeptType;
	role: RoleType;
	hours: number;
}

export interface SolverMetrics {
	totalSlots: number;
	assignedSlots: number;
	unfilledSlots: number;
	coveragePct: number;
	hardPenalty: number;
	exceedOneThirdCount: number;
	roleHoursDeviation: number;
	softPenalty: number;
	assignedHours: number;
	utilizationSpread: number;
	searchSteps: number;
	searchStepLimit: number;
	timedOut: boolean;
}

export interface SolverConfig {
	month: string; // YYYY-MM-01
	searchStepLimit: number;
	strategy: 'objective' | 'constructive';
}

export interface SolverMessage {
	type: 'start' | 'progress' | 'complete' | 'error';
	data?: unknown;
	progress?: number;
	message?: string;
}

// Slot templates for different day types
export const WEEKDAY_SLOTS: SlotTemplate[] = [
	{ slotType: 'AE', dept: null, role: 'PPF', hours: 0 }, // dept from AE_Assignment
	{ slotType: 'IPP_1', dept: 'IPP', role: 'PPF', hours: 4 },
	{ slotType: 'OPD_1', dept: null, role: 'PPF', hours: 4 }, // flexible mix
	{ slotType: 'OPD_2', dept: null, role: 'PPF', hours: 4 }, // flexible mix
	{ slotType: 'OPD_3', dept: null, role: 'PPF', hours: 4 } // flexible mix
];

export const WEEKEND_SLOTS: SlotTemplate[] = [
	{ slotType: 'AE', dept: null, role: 'PPF', hours: 0 }, // dept from AE_Assignment
	{ slotType: 'IPP_1', dept: 'IPP', role: 'PPF', hours: 7 },
	{ slotType: 'IPP_2', dept: 'IPP', role: 'PPF', hours: 7 },
	{ slotType: 'IPP_3', dept: 'IPP', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_1', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_2', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_3', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_4', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'PP_PPF', dept: null, role: 'PPF', hours: 6 },
	{ slotType: 'PP_PRA_1', dept: null, role: 'PRA', hours: 6 },
	{ slotType: 'PP_PRA_2', dept: null, role: 'PRA', hours: 6 }
];

export const HOLIDAY_SLOTS: SlotTemplate[] = [
	{ slotType: 'AE', dept: null, role: 'PPF', hours: 0 }, // dept from AE_Assignment
	{ slotType: 'IPP_1', dept: 'IPP', role: 'PPF', hours: 7 },
	{ slotType: 'IPP_2', dept: 'IPP', role: 'PPF', hours: 7 },
	{ slotType: 'IPP_3', dept: 'IPP', role: 'PPF', hours: 7 },
	{ slotType: 'IPP_4', dept: 'IPP', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_1', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_2', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_3', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_4', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'OPD_5', dept: 'OPD', role: 'PPF', hours: 7 },
	{ slotType: 'PP_PPF', dept: null, role: 'PPF', hours: 6 },
	{ slotType: 'PP_PRA_1', dept: null, role: 'PRA', hours: 6 },
	{ slotType: 'PP_PRA_2', dept: null, role: 'PRA', hours: 6 }
];

// Day name mappings (Malay)
export const DAY_NAMES: Record<number, string> = {
	0: 'Ahd', // Sunday
	1: 'Isn', // Monday
	2: 'Sel', // Tuesday
	3: 'Rab', // Wednesday
	4: 'Kha', // Thursday
	5: 'Jum', // Friday
	6: 'Sab' // Saturday
};