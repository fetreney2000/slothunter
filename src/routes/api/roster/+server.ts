import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Roster, RosterSlot } from '$lib/server/models';

// GET: Fetch roster slots for a month
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const month = url.searchParams.get('month');
	const rosterId = url.searchParams.get('rosterId');
	const employeeId = url.searchParams.get('employeeId');

	let roster: Record<string, unknown> | null = null;
	if (rosterId) {
		roster = await Roster.findOne({ rosterId }).lean() as Record<string, unknown> | null;
	} else if (month) {
		roster = await Roster.findOne({ month, isCopy: false })
			.sort({ generatedAt: -1 })
			.lean() as Record<string, unknown> | null;
	}

	if (!roster) {
		return json({ error: 'Roster tidak dijumpai', slots: [] }, { status: 404 });
	}

	const query: Record<string, unknown> = { rosterId: roster.rosterId };
	if (employeeId) {
		query.employeeId = employeeId;
	}

	const slots = await RosterSlot.find(query)
		.sort({ date: 1, slotType: 1 })
		.lean();

	// Compute summary per employee
	const summary: Record<string, { totalHours: number; slotCount: number }> = {};
	for (const s of slots) {
		if (!summary[s.employeeId]) {
			summary[s.employeeId] = { totalHours: 0, slotCount: 0 };
		}
		summary[s.employeeId].totalHours += s.hours;
		summary[s.employeeId].slotCount++;
	}

	return json({
		roster: {
			rosterId: roster.rosterId,
			month: roster.month,
			status: roster.status,
			generatedAt: roster.generatedAt
		},
		slots,
		summary
	});
};