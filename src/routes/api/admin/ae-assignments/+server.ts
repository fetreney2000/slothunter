import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { AE_Assignment } from '$lib/server/models';

// GET: Fetch AE assignments for a month
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();
	const month = url.searchParams.get('month');
	const query: Record<string, unknown> = {};
	if (month) query.month = month;

	const assignments = await AE_Assignment.find(query).sort({ date: 1 }).lean();
	return json({ assignments });
};

// POST: Set AE assignment for a date
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();
	const { month, date, department } = await request.json();

	if (!month || !date || !department) {
		return json({ error: 'Data tidak lengkap' }, { status: 400 });
	}

	const assignment = await AE_Assignment.findOneAndUpdate(
		{ month, date },
		{ month, date, department },
		{ upsert: true, new: true }
	);

	return json({ success: true, assignment });
};

// DELETE: Remove AE assignment
export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();
	const { month, date } = await request.json();
	await AE_Assignment.deleteOne({ month, date });
	return json({ success: true });
};