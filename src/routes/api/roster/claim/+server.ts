import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Roster, RosterSlot, PhaseConfig } from '$lib/server/models';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	await connectDB();
	const { month, date, slotType } = await request.json();
	const empId = locals.user.employeeId;

	// Find the roster
	const roster = await Roster.findOne({ month, isCopy: false }).sort({ generatedAt: -1 });
	if (!roster) return json({ error: 'Roster tidak dijumpai' }, { status: 404 });
	if (roster.status === 'Final') return json({ error: 'Roster sudah muktamad' }, { status: 403 });

	// Check phase limits
	const phaseConfig = await PhaseConfig.findOne({ month }).lean();
	if (phaseConfig) {
		const today = new Date().toISOString().slice(0, 10);
		let currentPhase = null;
		for (const p of (phaseConfig as unknown as { phases: Array<Record<string, unknown>> }).phases) {
			if (today >= (p.startDate as string) && today <= (p.endDate as string)) {
				currentPhase = p;
				break;
			}
		}
		if (currentPhase) {
			const d = new Date(date + 'T00:00:00').getDay();
			const isWeekend = d === 0 || d === 6;
			const max = (isWeekend ? currentPhase.weekendSlots : currentPhase.weekdaySlots) as number;

			// Count existing slots in this phase
			const phaseSlots = await RosterSlot.find({
				rosterId: roster.rosterId,
				employeeId: empId,
				date: { $gte: currentPhase.startDate, $lte: currentPhase.endDate },
				slotType: { $ne: 'POST-AE' }
			}).lean();

			let count = 0;
			for (const s of phaseSlots) {
				const sd = new Date(s.date + 'T00:00:00').getDay();
				const sw = sd === 0 || sd === 6;
				if (isWeekend === sw) count++;
			}

			if (count >= max) {
				return json({ error: `Kuota ${isWeekend ? 'hujung minggu' : 'hari bekerja'} fasa ${currentPhase.phase} penuh (${count}/${max})` }, { status: 403 });
			}
		}
	}

	// Check slot is empty
	const existing = await RosterSlot.findOne({ rosterId: roster.rosterId, date, slotType });
	if (existing?.employeeId) {
		return json({ error: 'Slot sudah diisi' }, { status: 409 });
	}

	// Update slot
	if (existing) {
		existing.employeeId = empId;
		existing.employeeName = locals.user.name;
		existing.dept = locals.user.dept;
		existing.role = locals.user.staffRole;
		await existing.save();
	} else {
		await RosterSlot.create({
			rosterId: roster.rosterId,
			date,
			day: '',
			slotType,
			employeeId: empId,
			employeeName: locals.user.name,
			dept: locals.user.dept,
			role: locals.user.staffRole,
			hours: 0
		});
	}

	return json({ success: true });
};