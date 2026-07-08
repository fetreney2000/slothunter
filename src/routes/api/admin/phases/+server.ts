import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { PhaseConfig } from '$lib/server/models';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	await connectDB();
	const month = url.searchParams.get('month');
	const q: Record<string, unknown> = {};
	if (month) q.month = month;
	let config = await PhaseConfig.findOne(q).lean();
	if (!config && month) {
		// Create default phases
		config = await PhaseConfig.create({
			month,
			phases: [
				{ phase: 1, startDate: `${month.slice(0,7)}-20`, endDate: `${month.slice(0,7)}-22`, weekendSlots: 1, weekdaySlots: 2 },
				{ phase: 2, startDate: `${month.slice(0,7)}-23`, endDate: `${month.slice(0,7)}-25`, weekendSlots: 1, weekdaySlots: 1 },
				{ phase: 3, startDate: `${month.slice(0,7)}-26`, endDate: `${month.slice(0,7)}-28`, weekendSlots: 1, weekdaySlots: 1 }
			]
		});
	}
	return json({ config });
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') return json({ error: 'Unauthorized' }, { status: 401 });
	await connectDB();
	const { month, phases } = await request.json();
	const config = await PhaseConfig.findOneAndUpdate(
		{ month },
		{ month, phases },
		{ upsert: true, new: true }
	);
	return json({ success: true, config });
};