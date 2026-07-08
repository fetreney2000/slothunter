import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Roster, RosterSlot, RosterLog } from '$lib/server/models';

// Update roster status
export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const { rosterId, status, action } = await request.json();

	if (!rosterId) {
		return json({ error: 'Roster ID diperlukan' }, { status: 400 });
	}

	const roster = await Roster.findOne({ rosterId });
	if (!roster) {
		return json({ error: 'Roster tidak dijumpai' }, { status: 404 });
	}

	if (action === 'finalize') {
		roster.status = 'Final';
		await roster.save();
		return json({ success: true, status: 'Final' });
	}

	if (action === 'copy') {
		// Create copy roster for daily changes
		const copyId = `${rosterId}_copy`;
		const existingCopy = await Roster.findOne({ rosterId: copyId });
		if (existingCopy) {
			await RosterSlot.deleteMany({ rosterId: copyId });
			await Roster.deleteOne({ rosterId: copyId });
		}

		const copy = await Roster.create({
			rosterId: copyId,
			month: roster.month,
			status: 'Draft',
			generatedAt: new Date(),
			generatedBy: locals.user.email,
			isCopy: true
		});

		// Copy all slots
		const originalSlots = await RosterSlot.find({ rosterId }).lean();
		if (originalSlots.length > 0) {
			const copySlots = originalSlots.map((s) => ({
				...s,
				_id: undefined,
				rosterId: copyId,
				createdAt: undefined,
				updatedAt: undefined
			}));
			await RosterSlot.insertMany(copySlots);
		}

		return json({ success: true, copyRosterId: copyId });
	}

	if (action === 'updateSlot') {
		const { date, slotType, newEmployeeId, newEmployeeName, newDept, newRole, newHours } =
			await request.json();

		const slot = await RosterSlot.findOne({ rosterId, date, slotType });
		if (!slot) {
			return json({ error: 'Slot tidak dijumpai' }, { status: 404 });
		}

		// Log the change
		await RosterLog.create({
			rosterId,
			changedAt: new Date(),
			changedBy: {
				email: locals.user.email,
				name: locals.user.name,
				role: locals.user.role
			},
			date,
			slot: slotType,
			oldEmployeeId: slot.employeeId,
			oldEmployeeName: slot.employeeName,
			oldDept: slot.dept,
			oldRole: slot.role,
			oldHours: slot.hours,
			newEmployeeId: newEmployeeId || '',
			newEmployeeName: newEmployeeName || '',
			newDept: newDept || slot.dept,
			newRole: newRole || slot.role,
			newHours: newHours ?? slot.hours,
			action: 'UPDATE'
		});

		// Update slot
		if (newEmployeeId !== undefined) slot.employeeId = newEmployeeId;
		if (newEmployeeName !== undefined) slot.employeeName = newEmployeeName;
		if (newDept !== undefined) slot.dept = newDept;
		if (newRole !== undefined) slot.role = newRole;
		if (newHours !== undefined) slot.hours = newHours;
		await slot.save();

		return json({ success: true, slot });
	}

	if (status) {
		roster.status = status;
		await roster.save();
		return json({ success: true, status: roster.status });
	}

	return json({ error: 'Tindakan tidak dikenali' }, { status: 400 });
};