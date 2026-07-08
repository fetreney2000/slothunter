import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { Preselection } from '$lib/server/models';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') return json({ error: 'Unauthorized' }, { status: 401 });
	await connectDB();
	const month = url.searchParams.get('month');
	const q: Record<string, unknown> = {};
	if (month) q.month = month;
	const preselections = await Preselection.find(q).sort({ date: 1, slotType: 1 }).lean();
	return json({ preselections });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') return json({ error: 'Unauthorized' }, { status: 401 });
	await connectDB();
	const { month, date, slotType, employeeId } = await request.json();
	if (!month || !date || !slotType || !employeeId) return json({ error: 'Data tidak lengkap' }, { status: 400 });
	const p = await Preselection.findOneAndUpdate(
		{ month, date, slotType },
		{ month, date, slotType, employeeId },
		{ upsert: true, new: true }
	);
	return json({ success: true, preselection: p });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') return json({ error: 'Unauthorized' }, { status: 401 });
	await connectDB();
	const { month, date, slotType } = await request.json();
	await Preselection.deleteOne({ month, date, slotType });
	return json({ success: true });
};