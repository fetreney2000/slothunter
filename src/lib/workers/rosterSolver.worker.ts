/**
 * Roster Solver Web Worker
 * Implements the complete OT roster generation logic per Solver_Logic.md
 * Runs in a Web Worker to prevent UI blocking
 */

import type {
	Employee,
	Slot,
	SlotTemplate,
	DayType,
	DeptType,
	RosterSlotResult,
	SolverMetrics,
	PreselectionEntry,
	RosterResult
} from '$lib/types/solver';
import {
	WEEKDAY_SLOTS,
	WEEKEND_SLOTS,
	HOLIDAY_SLOTS,
	DAY_NAMES
} from '$lib/types/solver';

// ─── INTERFACES ──────────────────────────────────────────────

interface SolverInput {
	employees: Employee[];
	month: string; // YYYY-MM-01
	holidays: Record<string, string>; // date -> name
	aeAssignments: Record<string, DeptType>; // date -> department
	preselections: PreselectionEntry[];
	unavailability: Record<string, string[]>; // employeeId -> dates[]
	archive: { date: string; slotType: string; employeeId: string; hours: number }[];
	config: { defaultMaxHours: number };
	searchStepLimit: number;
}

interface EmployeeState {
	hoursUsed: number;
	assignedToday: Set<string>; // dates
	lastWorkedDay: string;
	lastWorkedWasAE: boolean;
	lastSlotType: string;
	aeCountThisMonth: number;
	aeCategories: { sunThu: boolean; friSatHol: boolean };
	aeDays: string[];
	weekdaySlotWeekCounts: Map<string, number>; // weekStart -> count
	monthlyRuleStats: {
		ippOffdayIpp: number;
		ippWeekdayIpp: number;
		ippWeekdayOpd: number;
		opdOffdayOpd: number;
		opdWeekdayOpd: number;
		holidaySlotsAll: number;
		aeSlotsAll: number;
		aePaidSlotsAll: number;
		aeUnpaidSlotsAll: number;
	};
	postAEBlock: Set<string>; // dates blocked
}

interface Assignment {
	date: string;
	day: string;
	dayType: DayType;
	slotType: string;
	employeeId: string;
	employeeName: string;
	dept: DeptType;
	role: 'PPF' | 'PRA';
	hours: number;
}

// ─── HELPERS ─────────────────────────────────────────────────

function classifyDay(dateStr: string, holidayDates: Set<string>): DayType {
	if (holidayDates.has(dateStr)) return 'holiday';
	const dow = new Date(dateStr + 'T00:00:00').getDay();
	if (dow === 0) return 'sunday';
	if (dow === 6) return 'saturday';
	return 'weekday';
}

function getDayName(dateStr: string): string {
	const dow = new Date(dateStr + 'T00:00:00').getDay();
	return DAY_NAMES[dow] || '';
}

function calcAEHours(dateStr: string, dayType: DayType, holidays: Record<string, string>): number {
	const dow = new Date(dateStr + 'T00:00:00').getDay();
	if (dayType === 'holiday') {
		const next = getNextDate(dateStr);
		const nextDow = new Date(next + 'T00:00:00').getDay();
		return (nextDow === 6 || nextDow === 0 || holidays[next]) ? 9 : 2;
	}
	if (dow === 5) return 9; // Friday
	if (dow === 6) return 9; // Saturday
	if (dow === 0) {
		const next = getNextDate(dateStr);
		return holidays[next] ? 9 : 2;
	}
	return 0; // Mon-Thu
}

function getAECategory(dateStr: string, holidays: Record<string, string>): 'sunThu' | 'friSatHol' {
	const dow = new Date(dateStr + 'T00:00:00').getDay();
	const next = getNextDate(dateStr);
	const nextDow = new Date(next + 'T00:00:00').getDay();
	if (holidays[next]) return 'friSatHol';
	if (dow === 5 || dow === 6) return 'friSatHol';
	return 'sunThu';
}

function getNextDate(dateStr: string): string {
	const d = new Date(dateStr + 'T00:00:00');
	d.setDate(d.getDate() + 1);
	return d.toISOString().split('T')[0];
}

function getPrevDate(dateStr: string): string {
	const d = new Date(dateStr + 'T00:00:00');
	d.setDate(d.getDate() - 1);
	return d.toISOString().split('T')[0];
}

function getWeekStart(dateStr: string): string {
	const d = new Date(dateStr + 'T00:00:00');
	const dow = d.getDay();
	const diff = dow === 0 ? 6 : dow - 1; // Monday = 0
	d.setDate(d.getDate() - diff);
	return d.toISOString().split('T')[0];
}

function getDaysInMonth(month: string): number {
	const y = parseInt(month.slice(0, 4));
	const m = parseInt(month.slice(5, 7));
	return new Date(y, m, 0).getDate();
}

function getMonthDates(month: string): string[] {
	const days = getDaysInMonth(month);
	const dates: string[] = [];
	for (let d = 1; d <= days; d++) {
		dates.push(`${month.slice(0, 7)}-${String(d).padStart(2, '0')}`);
	}
	return dates;
}

// ─── STATE MANAGEMENT ────────────────────────────────────────

function createState(): Map<string, EmployeeState> {
	return new Map();
}

function initState(
	employees: Employee[],
	unavailability: Record<string, string[]>
): Map<string, EmployeeState> {
	const states = new Map<string, EmployeeState>();
	for (const emp of employees) {
		states.set(emp.employeeId, {
			hoursUsed: 0,
			assignedToday: new Set(),
			lastWorkedDay: '',
			lastWorkedWasAE: false,
			lastSlotType: '',
			aeCountThisMonth: 0,
			aeCategories: { sunThu: false, friSatHol: false },
			aeDays: [],
			weekdaySlotWeekCounts: new Map(),
			monthlyRuleStats: {
				ippOffdayIpp: 0,
				ippWeekdayIpp: 0,
				ippWeekdayOpd: 0,
				opdOffdayOpd: 0,
				opdWeekdayOpd: 0,
				holidaySlotsAll: 0,
				aeSlotsAll: 0,
				aePaidSlotsAll: 0,
				aeUnpaidSlotsAll: 0
			},
			postAEBlock: new Set()
		});
	}
	return states;
}

function cloneStates(states: Map<string, EmployeeState>): Map<string, EmployeeState> {
	const cloned = new Map<string, EmployeeState>();
	for (const [id, s] of states) {
		cloned.set(id, {
			hoursUsed: s.hoursUsed,
			assignedToday: new Set(s.assignedToday),
			lastWorkedDay: s.lastWorkedDay,
			lastWorkedWasAE: s.lastWorkedWasAE,
			lastSlotType: s.lastSlotType,
			aeCountThisMonth: s.aeCountThisMonth,
			aeCategories: { ...s.aeCategories },
			aeDays: [...s.aeDays],
			weekdaySlotWeekCounts: new Map(s.weekdaySlotWeekCounts),
			monthlyRuleStats: { ...s.monthlyRuleStats },
			postAEBlock: new Set(s.postAEBlock)
		});
	}
	return cloned;
}

// ─── ELIGIBILITY CHECKS (13 CONSTRAINTS) ─────────────────────

function isEligible(
	emp: Employee,
	slot: Slot,
	state: EmployeeState,
	allStates: Map<string, EmployeeState>,
	holidays: Record<string, string>,
	aeAssignments: Record<string, DeptType>,
	unavailSet: Set<string>,
	archive: Map<string, { employeeId: string; slotType: string }[]>,
	isRelaxed = false
): boolean {
	// CHECK 1: ROLE MATCH
	if (slot.slotType === 'PP_PRA_1' || slot.slotType === 'PP_PRA_2') {
		if (emp.role !== 'PRA') return false;
	} else {
		if (emp.role !== 'PPF') return false;
	}

	// CHECK 2: DEPARTMENT MATCH
	if (slot.slotType === 'AE') {
		const aeDept = aeAssignments[slot.date];
		if (aeDept && emp.dept !== aeDept) return false;
	} else if (slot.slotType.startsWith('IPP_')) {
		if (emp.dept !== 'IPP') return false;
	} else if (slot.slotType.startsWith('OPD_')) {
		if (slot.dayType === 'weekday') {
			// Flexible: any PPF allowed
		} else {
			if (emp.dept !== 'OPD') return false;
		}
	}
	// PP_PPF: both departments allowed

	// CHECK 3: ONE SLOT PER DAY
	if (state.assignedToday.has(slot.date)) return false;

	// CHECK 4: UNAVAILABILITY
	if (unavailSet.has(`${emp.employeeId}:${slot.date}`)) return false;

	// CHECK 5: POST-AE NEXT-DAY BLOCK
	if (state.postAEBlock.has(slot.date)) return false;

	// CHECK 6: CONSECUTIVE DAY RULE (non-AE, non-holiday)
	if (state.lastWorkedDay === getPrevDate(slot.date) &&
		slot.slotType !== 'AE' && slot.dayType !== 'holiday') {
		return false;
	}

	// CHECK 7: SAME SLOT TYPE CONSECUTIVE
	if (state.lastSlotType === slot.slotType &&
		state.lastWorkedDay === getPrevDate(slot.date)) {
		return false;
	}

	// CHECK 8: MONTHLY MAX HOURS
	const maxHrs = emp.maxHoursPerMonth || 40;
	if (state.hoursUsed + slot.hours > maxHrs) return false;

	// CHECK 9: WEEKLY WEEKDAY CAP (max 2 non-AE weekday per week)
	if (slot.dayType === 'weekday' && slot.slotType !== 'AE') {
		const weekStart = getWeekStart(slot.date);
		const count = state.weekdaySlotWeekCounts.get(weekStart) || 0;
		if (count >= 2) return false;
	}

	// CHECK 10: MONTHLY DEPT DISTRIBUTION MAXIMA
	if (slot.dayType === 'weekday' && slot.slotType.startsWith('OPD_')) {
		if (emp.dept === 'IPP' && state.monthlyRuleStats.ippWeekdayOpd >= 4) return false;
		if (emp.dept === 'OPD' && state.monthlyRuleStats.opdWeekdayOpd >= 7) return false;
	}

	// CHECK 11: MONTHLY HOLIDAY SLOT CAP (max 2)
	if (!isRelaxed && slot.dayType === 'holiday' && slot.slotType !== 'AE') {
		if (state.monthlyRuleStats.holidaySlotsAll >= 2) return false;
	}

	// CHECK 12 & 13: AE SPECIFIC CONSTRAINTS
	if (slot.slotType === 'AE') {
		if (state.aeCountThisMonth >= 2) return false;
		const category = getAECategory(slot.date, holidays);
		if (state.aeCountThisMonth === 1) {
			// Must be opposite category
			const existingCat = state.aeCategories.sunThu ? 'sunThu' : 'friSatHol';
			if (category === existingCat) return false;
		}
		// Paid/unpaid caps
		if (category === 'friSatHol' && state.aeCategories.friSatHol) return false;
		if (category === 'sunThu' && state.aeCategories.sunThu) return false;

		// 10-day gap
		for (const aeDay of state.aeDays) {
			const diff = Math.abs(
				(new Date(slot.date + 'T00:00:00').getTime() -
					new Date(aeDay + 'T00:00:00').getTime()) / 86400000
			);
			if (diff < 10) return false;
		}

		// Check archive for 10-day gap
		const archiveAes = archive.get(emp.employeeId) || [];
		for (const archAe of archiveAes) {
			if (archAe.slotType === 'AE') {
				const diff = Math.abs(
					(new Date(slot.date + 'T00:00:00').getTime() -
						new Date(archAe.employeeId + 'T00:00:00').getTime()) / 86400000
				);
				if (diff < 10) return false;
			}
		}
	}

	return true;
}

// ─── ASSIGNMENT TRACKING ─────────────────────────────────────

function applyAssignment(
	emp: Employee,
	slot: Slot,
	state: EmployeeState,
	holidays: Record<string, string>,
	aeAssignments: Record<string, DeptType>
): void {
	state.hoursUsed += slot.hours;
	state.assignedToday.add(slot.date);
	state.lastWorkedDay = slot.date;
	state.lastWorkedWasAE = slot.slotType === 'AE';
	state.lastSlotType = slot.slotType;

	if (slot.slotType === 'AE') {
		state.aeCountThisMonth++;
		const cat = getAECategory(slot.date, holidays);
		if (cat === 'friSatHol') state.aeCategories.friSatHol = true;
		else state.aeCategories.sunThu = true;
		state.aeDays.push(slot.date);
		state.monthlyRuleStats.aeSlotsAll++;
		if (cat === 'friSatHol') state.monthlyRuleStats.aePaidSlotsAll++;
		else state.monthlyRuleStats.aeUnpaidSlotsAll++;

		// Block next day
		state.postAEBlock.add(getNextDate(slot.date));
	}

	// Monthly rule stats
	if (slot.dayType === 'holiday' && slot.slotType !== 'AE') {
		state.monthlyRuleStats.holidaySlotsAll++;
	}

	if (slot.dayType === 'weekday' && slot.slotType.startsWith('OPD_')) {
		if (emp.dept === 'IPP') state.monthlyRuleStats.ippWeekdayOpd++;
		if (emp.dept === 'OPD') state.monthlyRuleStats.opdWeekdayOpd++;
	}

	if (slot.dayType === 'weekday' && slot.slotType !== 'AE') {
		const ws = getWeekStart(slot.date);
		const count = state.weekdaySlotWeekCounts.get(ws) || 0;
		state.weekdaySlotWeekCounts.set(ws, count + 1);
	}
}

// ─── CANDIDATE RANKING ───────────────────────────────────────

function rankCandidates(
	eligible: Employee[],
	states: Map<string, EmployeeState>,
	slot: Slot
): Employee[] {
	// Compute role averages
	const roleHours: Map<string, number[]> = new Map();
	for (const emp of eligible) {
		const state = states.get(emp.employeeId)!;
		if (!roleHours.has(emp.role)) roleHours.set(emp.role, []);
		roleHours.get(emp.role)!.push(state.hoursUsed);
	}

	const roleAvg: Map<string, number> = new Map();
	for (const [role, hours] of roleHours) {
		roleAvg.set(role, hours.reduce((a, b) => a + b, 0) / hours.length);
	}

	return [...eligible].sort((a, b) => {
		const sa = states.get(a.employeeId)!;
		const sb = states.get(b.employeeId)!;
		const avgA = roleAvg.get(a.role) || 0;
		const avgB = roleAvg.get(b.role) || 0;

		// TIER 0: Fairness within role
		const deficitA = avgA - sa.hoursUsed;
		const deficitB = avgB - sb.hoursUsed;
		if (Math.abs(deficitA - deficitB) > 0.5) return deficitB - deficitA;

		// Remaining hours
		const remainA = (a.maxHoursPerMonth || 40) - sa.hoursUsed;
		const remainB = (b.maxHoursPerMonth || 40) - sb.hoursUsed;
		if (remainA !== remainB) return remainB - remainA;

		// TIER 2: Annual priority (for AE/holiday)
		if (slot.slotType === 'AE') {
			if (a.annualAE !== b.annualAE) return a.annualAE - b.annualAE;
		}
		if (slot.dayType === 'holiday') {
			if (a.annualPH !== b.annualPH) return a.annualPH - b.annualPH;
		}

		// TIER 3: Employee ID lexical
		return a.employeeId.localeCompare(b.employeeId);
	});
}

// ─── OBJECTIVE FUNCTION ──────────────────────────────────────

interface ObjectiveScore {
	unfilledCount: number;
	hardPenalty: number;
	exceedOneThirdCount: number;
	roleHoursDeviation: number;
	softPenalty: number;
	assignedHours: number;
	utilizationSpread: number;
}

function computeObjective(
	assignments: Assignment[],
	employees: Employee[],
	month: string,
	states: Map<string, EmployeeState>
): ObjectiveScore {
	let hardPenalty = 0;
	let exceedOneThirdCount = 0;
	let softPenalty = 0;
	let assignedHours = 0;

	const roleHours: Map<string, number[]> = new Map();

	for (const emp of employees) {
		const s = states.get(emp.employeeId);
		if (!s) continue;

		assignedHours += s.hoursUsed;
		if (!roleHours.has(emp.role)) roleHours.set(emp.role, []);
		roleHours.get(emp.role)!.push(s.hoursUsed);

		const maxHrs = emp.maxHoursPerMonth || 40;

		// Hard penalties
		if (s.monthlyRuleStats.holidaySlotsAll > 2)
			hardPenalty += (s.monthlyRuleStats.holidaySlotsAll - 2) * 80;
		if (s.monthlyRuleStats.aeSlotsAll > 2)
			hardPenalty += (s.monthlyRuleStats.aeSlotsAll - 2) * 120;
		if (s.monthlyRuleStats.aePaidSlotsAll > 1)
			hardPenalty += (s.monthlyRuleStats.aePaidSlotsAll - 1) * 120;
		if (s.monthlyRuleStats.aeUnpaidSlotsAll > 1)
			hardPenalty += (s.monthlyRuleStats.aeUnpaidSlotsAll - 1) * 120;
		if (emp.dept === 'IPP' && s.monthlyRuleStats.ippWeekdayOpd > 4)
			hardPenalty += (s.monthlyRuleStats.ippWeekdayOpd - 4) * 70;
		if (emp.dept === 'OPD' && s.monthlyRuleStats.opdWeekdayOpd > 7)
			hardPenalty += (s.monthlyRuleStats.opdWeekdayOpd - 7) * 70;

		// Exceed 1/3
		if (s.hoursUsed > maxHrs * (1 / 3) * 3) exceedOneThirdCount++;

		// Soft penalties
		if (s.hoursUsed < maxHrs) {
			softPenalty += (maxHrs - s.hoursUsed) * 35;
		}

		// Utilization deviation
		const utilization = maxHrs > 0 ? s.hoursUsed / maxHrs : 0;
		softPenalty += Math.abs(utilization - 0.85) * 240;
	}

	// Role hours deviation
	let roleHoursDeviation = 0;
	for (const [, hours] of roleHours) {
		if (hours.length > 1) {
			const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
			const variance = hours.reduce((sum, h) => sum + (h - avg) ** 2, 0) / hours.length;
			roleHoursDeviation += Math.sqrt(variance);
		}
	}

	const totalSlots = assignments.length;
	const assignedSlots = assignments.filter((a) => a.employeeId).length;
	const unfilledCount = totalSlots - assignedSlots;

	const allHours = employees.map((e) => {
		const s = states.get(e.employeeId);
		return s ? s.hoursUsed : 0;
	});
	const avgHrs = allHours.reduce((a, b) => a + b, 0) / allHours.length;
	const utilizationSpread = avgHrs > 0
		? Math.sqrt(allHours.reduce((sum, h) => sum + (h - avgHrs) ** 2, 0) / allHours.length) / avgHrs
		: 0;

	return {
		unfilledCount,
		hardPenalty,
		exceedOneThirdCount,
		roleHoursDeviation,
		softPenalty,
		assignedHours,
		utilizationSpread
	};
}

function isBetterObjective(a: ObjectiveScore, b: ObjectiveScore): boolean {
	if (a.unfilledCount !== b.unfilledCount) return a.unfilledCount < b.unfilledCount;
	if (a.hardPenalty !== b.hardPenalty) return a.hardPenalty < b.hardPenalty;
	if (a.exceedOneThirdCount !== b.exceedOneThirdCount)
		return a.exceedOneThirdCount < b.exceedOneThirdCount;
	if (Math.abs(a.roleHoursDeviation - b.roleHoursDeviation) > 0.01)
		return a.roleHoursDeviation < b.roleHoursDeviation;
	if (a.softPenalty !== b.softPenalty) return a.softPenalty < b.softPenalty;
	if (a.assignedHours !== b.assignedHours) return a.assignedHours > b.assignedHours;
	return a.utilizationSpread < b.utilizationSpread;
}

// ─── SOLVER STRATEGIES ───────────────────────────────────────

type SlotSorter = (slots: Slot[], employeeMap: Map<string, Employee>, states: Map<string, EmployeeState>) => Slot[];

const strategies: SlotSorter[] = [
	// 1. Most-constrained first
	(slots, empMap, states) => {
		return [...slots].sort((a, b) => {
			const countA = [...empMap.values()].filter((e) => {
				const s = states.get(e.employeeId)!;
				return isEligible(e, a, s, states, {}, {}, new Set(), new Map());
			}).length;
			const countB = [...empMap.values()].filter((e) => {
				const s = states.get(e.employeeId)!;
				return isEligible(e, b, s, states, {}, {}, new Set(), new Map());
			}).length;
			return countA - countB;
		});
	},
	// 2. Fairness-first: AE -> holiday -> weekend -> weekday
	(slots) => {
		const priority: Record<string, number> = { AE: 0, holiday: 1, saturday: 2, sunday: 2, weekday: 3 };
		return [...slots].sort((a, b) => {
			const pa = a.slotType === 'AE' ? 0 : priority[a.dayType] ?? 3;
			const pb = b.slotType === 'AE' ? 0 : priority[b.dayType] ?? 3;
			return pa - pb;
		});
	},
	// 3. Front-loaded (days 1->31)
	(slots) => [...slots].sort((a, b) => a.date.localeCompare(b.date)),
	// 4. Back-loaded (days 31->1)
	(slots) => [...slots].sort((a, b) => b.date.localeCompare(a.date)),
	// 5. Department-balanced
	(slots) => {
		return [...slots].sort((a, b) => {
			if (a.slotType.startsWith('IPP_') && !b.slotType.startsWith('IPP_')) return -1;
			if (!a.slotType.startsWith('IPP_') && b.slotType.startsWith('IPP_')) return 1;
			return a.date.localeCompare(b.date);
		});
	},
	// 6. Minimum monthly deficit
	(slots) => {
		const priority: Record<string, number> = { AE: 0, holiday: 1, saturday: 2, sunday: 2, weekday: 3 };
		return [...slots].sort((a, b) => {
			const pa = a.slotType === 'AE' ? 0 : priority[a.dayType] ?? 3;
			const pb = b.slotType === 'AE' ? 0 : priority[b.dayType] ?? 3;
			if (pa !== pb) return pa - pb;
			return a.date.localeCompare(b.date);
		});
	}
];

function solveStrategy(
	sortedSlots: Slot[],
	employees: Employee[],
	states: Map<string, EmployeeState>,
	holidays: Record<string, string>,
	aeAssignments: Record<string, DeptType>,
	unavailMap: Map<string, Set<string>>,
	archiveMap: Map<string, { employeeId: string; slotType: string }[]>,
	empMap: Map<string, Employee>,
	stepCounter: { steps: number },
	stepLimit: number,
	restart: number
): { assignments: Map<string, string>; success: boolean } {
	const assignments = new Map<string, string>(); // "date:slotType" -> employeeId

	// Clone states for this attempt
	const localStates = cloneStates(states);

	for (const slot of sortedSlots) {
		if (stepCounter.steps >= stepLimit) break;

		const key = `${slot.date}:${slot.slotType}`;

		const eligible = employees.filter((emp) => {
			const s = localStates.get(emp.employeeId)!;
			const unavailSet = unavailMap.get(emp.employeeId) || new Set();
			return isEligible(emp, slot, s, localStates, holidays, aeAssignments, unavailSet, archiveMap);
		});

		stepCounter.steps++;

		if (eligible.length === 0) continue;

		const ranked = rankCandidates(eligible, localStates, slot);

		// On restart > 0, randomly pick from top 3
		let chosen: Employee;
		if (restart > 0 && ranked.length > 1) {
			const topN = Math.min(3, ranked.length);
			chosen = ranked[Math.floor(Math.random() * topN)];
		} else {
			chosen = ranked[0];
		}

		const empState = localStates.get(chosen.employeeId)!;
		applyAssignment(chosen, slot, empState, holidays, aeAssignments);
		assignments.set(key, chosen.employeeId);
	}

	// Check if all slots filled
	const unfilled = sortedSlots.filter((s) => !assignments.has(`${s.date}:${s.slotType}`));
	return { assignments, success: unfilled.length === 0 };
}

// ─── MAIN SOLVER ─────────────────────────────────────────────

function buildSlotSequence(
	month: string,
	holidays: Record<string, string>,
	aeAssignments: Record<string, DeptType>,
	preselections: PreselectionEntry[]
): { slots: Slot[]; preselected: Map<string, string> } {
	const dates = getMonthDates(month);
	const holidayDates = new Set(Object.keys(holidays));
	const slots: Slot[] = [];
	const preselected = new Map<string, string>();

	// Index preselections
	const presMap = new Map<string, string>();
	for (const p of preselections) {
		presMap.set(`${p.date}:${p.slotType}`, p.employeeId);
	}

	for (const date of dates) {
		const dayType = classifyDay(date, holidayDates);
		const day = getDayName(date);

		let templates: SlotTemplate[];
		if (dayType === 'holiday') templates = HOLIDAY_SLOTS;
		else if (dayType === 'saturday' || dayType === 'sunday') templates = WEEKEND_SLOTS;
		else templates = WEEKDAY_SLOTS;

		for (const tmpl of templates) {
			const hours = tmpl.slotType === 'AE'
				? calcAEHours(date, dayType, holidays)
				: tmpl.hours;

			const dept = tmpl.slotType === 'AE'
				? (aeAssignments[date] || tmpl.dept)
				: tmpl.dept;

			const slot: Slot = {
				date,
				day,
				dayType,
				slotType: tmpl.slotType,
				dept,
				role: tmpl.role,
				hours
			};

			const key = `${date}:${tmpl.slotType}`;
			if (presMap.has(key)) {
				preselected.set(key, presMap.get(key)!);
				// Don't add to solver sequence - it's pre-locked
			} else {
				slots.push(slot);
			}
		}
	}

	return { slots, preselected };
}

function postProcess(
	assignments: Map<string, string>,
	month: string,
	holidays: Record<string, string>,
	aeAssignments: Record<string, DeptType>,
	employees: Map<string, Employee>
): Assignment[] {
	const dates = getMonthDates(month);
	const holidayDates = new Set(Object.keys(holidays));
	const result: Assignment[] = [];

	for (const date of dates) {
		const dayType = classifyDay(date, holidayDates);
		const day = getDayName(date);

		let templates: SlotTemplate[];
		if (dayType === 'holiday') templates = HOLIDAY_SLOTS;
		else if (dayType === 'saturday' || dayType === 'sunday') templates = WEEKEND_SLOTS;
		else templates = WEEKDAY_SLOTS;

		for (const tmpl of templates) {
			const key = `${date}:${tmpl.slotType}`;
			const empId = assignments.get(key);
			const emp = empId ? employees.get(empId) : undefined;

			const hours = tmpl.slotType === 'AE'
				? calcAEHours(date, dayType, holidays)
				: tmpl.hours;

			result.push({
				date,
				day,
				dayType,
				slotType: tmpl.slotType,
				employeeId: empId || '',
				employeeName: emp?.name || '',
				dept: emp?.dept || (tmpl.dept || 'OPD'),
				role: tmpl.role,
				hours
			});
		}

		// Add POST-AE markers
		if (dayType !== 'weekday' || true) {
			// Find who did AE yesterday
			const prevDate = getPrevDate(date);
			const prevKey = `${prevDate}:AE`;
			const prevAEEmpId = assignments.get(prevKey);
			if (prevAEEmpId) {
				const emp = employees.get(prevAEEmpId);
				result.push({
					date,
					day,
					dayType,
					slotType: 'POST-AE',
					employeeId: prevAEEmpId,
					employeeName: emp?.name || '',
					dept: emp?.dept || 'OPD',
					role: 'PPF',
					hours: 0
				});
			}
		}
	}

	return result;
}

// ─── WEB WORKER ENTRY ────────────────────────────────────────

self.onmessage = function (e: MessageEvent<SolverInput>) {
	const input = e.data;
	const startTime = Date.now();

	try {
		self.postMessage({ type: 'progress', progress: 0, message: 'Membina struktur data...' });

		const employeeMap = new Map<string, Employee>();
		for (const emp of input.employees) {
			if (emp.active) employeeMap.set(emp.employeeId, emp);
		}
		const employees = [...employeeMap.values()];

		const holidayDates = new Set(Object.keys(input.holidays));
		const unavailMap = new Map<string, Set<string>>();
		for (const [empId, dates] of Object.entries(input.unavailability)) {
			unavailMap.set(empId, new Set(dates));
		}

		// Build archive map for 10-day AE gap checking
		const archiveMap = new Map<string, { employeeId: string; slotType: string }[]>();
		for (const entry of input.archive) {
			if (!archiveMap.has(entry.employeeId)) archiveMap.set(entry.employeeId, []);
			archiveMap.get(entry.employeeId)!.push({ employeeId: entry.employeeId, slotType: entry.slotType });
		}

		// Build slot sequence
		const { slots, preselected } = buildSlotSequence(
			input.month,
			input.holidays,
			input.aeAssignments,
			input.preselections
		);

		// Initialize states
		const baseStates = initState(employees, input.unavailability);

		// Apply preselections to states
		for (const [key, empId] of preselected) {
			const [date, slotType] = key.split(':');
			const emp = employeeMap.get(empId);
			const state = baseStates.get(empId);
			if (emp && state) {
				const dayType = classifyDay(date, holidayDates);
				const hours = slotType === 'AE'
					? calcAEHours(date, dayType, input.holidays)
					: (dayType === 'weekday' ? 4 : 7);
				const slot: Slot = {
					date, day: getDayName(date), dayType, slotType,
					dept: emp.dept, role: emp.role, hours
				};
				applyAssignment(emp, slot, state, input.holidays, input.aeAssignments);
			}
		}

		self.postMessage({ type: 'progress', progress: 10, message: 'Menjalankan Strategi A...' });

		// STRATEGY A: 6 strategies × 25 restarts
		let bestAssignments = new Map<string, string>();
		let bestObjective: ObjectiveScore | null = null;
		let bestStates = baseStates;
		const stepCounter = { steps: 0 };
		const limit = input.searchStepLimit || 800000;

		for (let s = 0; s < strategies.length; s++) {
			for (let r = 0; r < 25; r++) {
				if (stepCounter.steps >= limit) break;

				const result = solveStrategy(
					slots, employees, baseStates, input.holidays,
					input.aeAssignments, unavailMap, archiveMap,
					employeeMap, stepCounter, limit, r
				);

				// Merge with preselections
				const merged = new Map([...preselected, ...result.assignments]);

				// Compute objective
				const tempStates = initState(employees, input.unavailability);
				for (const [key, empId] of merged) {
					const [date, slotType] = key.split(':');
					const emp = employeeMap.get(empId);
					const st = tempStates.get(empId);
					if (emp && st) {
						const dayType = classifyDay(date, holidayDates);
						const hours = slotType === 'AE'
							? calcAEHours(date, dayType, input.holidays)
							: (dayType === 'weekday' ? 4 : 7);
						const slot: Slot = {
							date, day: getDayName(date), dayType, slotType,
							dept: emp.dept, role: emp.role, hours
						};
						applyAssignment(emp, slot, st, input.holidays, input.aeAssignments);
					}
				}

				const obj = computeObjective(postProcess(merged, input.month, input.holidays, input.aeAssignments, employeeMap), employees, input.month, tempStates);

				if (!bestObjective || isBetterObjective(obj, bestObjective)) {
					bestObjective = obj;
					bestAssignments = merged;
					bestStates = tempStates;
				}

				if (result.success) break; // All filled, no need for more restarts
			}
		}

		self.postMessage({ type: 'progress', progress: 70, message: 'Menjalankan Strategi B (jika perlu)...' });

		// STRATEGY B: Check if unfilled
		const unfilledCount = bestObjective?.unfilledCount ?? slots.length;
		if (unfilledCount > 0 && stepCounter.steps < limit) {
			// Beam search with width 50
			// (Simplified: just re-run strategy A with more randomization)
			for (let r = 0; r < 25; r++) {
				if (stepCounter.steps >= limit) break;
				const result = solveStrategy(
					slots, employees, baseStates, input.holidays,
					input.aeAssignments, unavailMap, archiveMap,
					employeeMap, stepCounter, limit, r + 1
				);
				const merged = new Map([...preselected, ...result.assignments]);
				const tempStates = initState(employees, input.unavailability);
				for (const [key, empId] of merged) {
					const [date, slotType] = key.split(':');
					const emp = employeeMap.get(empId);
					const st = tempStates.get(empId);
					if (emp && st) {
						const dayType = classifyDay(date, holidayDates);
						const hours = slotType === 'AE'
							? calcAEHours(date, dayType, input.holidays)
							: (dayType === 'weekday' ? 4 : 7);
						const slot: Slot = {
							date, day: getDayName(date), dayType, slotType,
							dept: emp.dept, role: emp.role, hours
						};
						applyAssignment(emp, slot, st, input.holidays, input.aeAssignments);
					}
				}
				const obj = computeObjective(postProcess(merged, input.month, input.holidays, input.aeAssignments, employeeMap), employees, input.month, tempStates);
				if (!bestObjective || isBetterObjective(obj, bestObjective)) {
					bestObjective = obj;
					bestAssignments = merged;
					bestStates = tempStates;
				}
			}
		}

		self.postMessage({ type: 'progress', progress: 90, message: 'Memproses keputusan...' });

		// Build final result
		const finalAssignments = new Map([...preselected, ...bestAssignments]);
		const resultSlots = postProcess(finalAssignments, input.month, input.holidays, input.aeAssignments, employeeMap);

		// Generate warnings
		const warnings: string[] = [];
		const unfilledSlots = resultSlots.filter((s) => !s.employeeId && s.slotType !== 'POST-AE');
		if (unfilledSlots.length > 0) {
			for (const s of unfilledSlots) {
				warnings.push(`Slot tidak diisi: ${s.date} ${s.slotType}`);
			}
		}

		const elapsedMs = Date.now() - startTime;
		const metrics: SolverMetrics = {
			totalSlots: slots.length + preselected.size,
			assignedSlots: resultSlots.filter((s) => s.employeeId).length,
			unfilledSlots: unfilledSlots.length,
			coveragePct: slots.length > 0 ? ((slots.length - unfilledSlots.length) / slots.length) * 100 : 100,
			hardPenalty: bestObjective?.hardPenalty ?? 0,
			exceedOneThirdCount: bestObjective?.exceedOneThirdCount ?? 0,
			roleHoursDeviation: bestObjective?.roleHoursDeviation ?? 0,
			softPenalty: bestObjective?.softPenalty ?? 0,
			assignedHours: bestObjective?.assignedHours ?? 0,
			utilizationSpread: bestObjective?.utilizationSpread ?? 0,
			searchSteps: stepCounter.steps,
			searchStepLimit: limit,
			timedOut: stepCounter.steps >= limit
		};

		const rosterResult: RosterResult = {
			rosterId: `Roster_${input.month.slice(0, 7)}_${Date.now()}`,
			slots: resultSlots,
			warnings,
			metrics,
			elapsedMs,
			strategy: 'Strategy A+B constructive'
		};

		self.postMessage({ type: 'complete', data: rosterResult });
	} catch (err) {
		self.postMessage({
			type: 'error',
			message: err instanceof Error ? err.message : 'Unknown solver error'
		});
	}
};