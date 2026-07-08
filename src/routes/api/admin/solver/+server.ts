import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import {
	User, Holiday, AE_Assignment, Preselection,
	Unavailability, Config, Roster, RosterSlot
} from '$lib/server/models';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const body = await request.json();
	const month = body.month; // YYYY-MM-01
	const searchStepLimit = body.searchStepLimit || 800000;
	const solverMode = body.solverMode || 'all';

	if (!month) {
		return json({ error: 'Bulan diperlukan' }, { status: 400 });
	}

	// Gather all data needed for solver
	const employees = await User.find({}).lean();
	const holidays = await Holiday.find({}).lean();
	const aeAssignments = await AE_Assignment.find({ month }).lean();
	const preselections = await Preselection.find({ month }).lean();
	const unavailability = await Unavailability.find({}).lean();

	// Build lookup structures
	const holidayMap: Record<string, string> = {};
	for (const h of holidays) {
		holidayMap[h.date] = h.name;
	}

	const aeMap: Record<string, 'IPP' | 'OPD'> = {};
	for (const ae of aeAssignments) {
		aeMap[ae.date] = ae.department as 'IPP' | 'OPD';
	}

	const unavailMap: Record<string, string[]> = {};
	for (const u of unavailability) {
		if (!unavailMap[u.employeeId]) unavailMap[u.employeeId] = [];
		unavailMap[u.employeeId].push(u.date);
	}

	const config = await Config.findOne().lean();
	const defaultMaxHours = (config as unknown as { defaultMaxHours?: number })?.defaultMaxHours || 40;

	// Load archive from previous month
	const prevMonthDate = new Date(month + 'T00:00:00');
	prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
	const prevMonth = prevMonthDate.toISOString().slice(0, 7) + '-01';
	const prevRoster = await Roster.findOne({ month: prevMonth, isCopy: false }).sort({ generatedAt: -1 }).lean();
	let archive: { date: string; slotType: string; employeeId: string; hours: number }[] = [];
	if (prevRoster) {
		const prevSlots = await RosterSlot.find({ rosterId: (prevRoster as unknown as { rosterId: string }).rosterId, slotType: 'AE' }).lean();
		archive = prevSlots.map(s => ({ date: s.date, slotType: s.slotType, employeeId: s.employeeId, hours: s.hours }));
	}

	return json({
		solverInput: {
			employees: employees.map((e) => ({
				employeeId: e.employeeId,
				name: e.name,
				dept: e.dept,
				role: e.role,
				email: e.email,
				maxHoursPerMonth: e.maxHoursPerMonth || defaultMaxHours,
				active: e.active,
				salary: e.salary || 0,
				annualAE: e.annualAE || 0,
				annualHalfPaidAE: e.annualHalfPaidAE || 0,
				annualPaidAE: e.annualPaidAE || 0,
				annualPHAE: e.annualPHAE || 0,
				annualPH: e.annualPH || 0
			})),
			month,
			holidays: holidayMap,
			aeAssignments: aeMap,
			preselections: preselections.map((p) => ({
				date: p.date,
				slotType: p.slotType,
				employeeId: p.employeeId
			})),
			unavailability: unavailMap,
			archive,
			config: { defaultMaxHours },
			searchStepLimit,
			solverMode
		}
	});
};

// Save solver results
export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const { rosterId, month, slots, metrics, warnings, status } = await request.json();

	if (!rosterId || !month || !slots) {
		return json({ error: 'Data tidak lengkap' }, { status: 400 });
	}

	// Create roster document
	const roster = await Roster.findOneAndUpdate(
		{ rosterId },
		{
			rosterId,
			month,
			status: status || 'Draft',
			generatedAt: new Date(),
			generatedBy: locals.user.email,
			isCopy: false
		},
		{ upsert: true, new: true }
	);

	// Delete old slots for this roster
	await RosterSlot.deleteMany({ rosterId });

	// Insert new slots
	if (slots.length > 0) {
		const slotDocs = slots.map(
			(s: {
				date: string;
				day: string;
				slotType: string;
				employeeId: string;
				employeeName: string;
				dept: string;
				role: string;
				hours: number;
			}) => ({
				rosterId,
				date: s.date,
				day: s.day,
				slotType: s.slotType,
				employeeId: s.employeeId,
				employeeName: s.employeeName,
				dept: s.dept,
				role: s.role,
				hours: s.hours
			})
		);
		await RosterSlot.insertMany(slotDocs);
	}

	return json({
		success: true,
		rosterId: roster.rosterId,
		slotsCount: slots.length,
		metrics,
		warnings
	});
};