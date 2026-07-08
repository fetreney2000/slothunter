import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/server/db';
import { User } from '$lib/server/models';
import { hashPassword } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const employees = await User.find({})
		.select('-passwordHash')
		.sort({ employeeId: 1 })
		.lean();

	return json({ employees });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const body = await request.json();
	const {
		employeeId, name, dept, role, email, maxHoursPerMonth,
		salary, annualAE, annualHalfPaidAE, annualPaidAE, annualPHAE, annualPH
	} = body;

	if (!employeeId || !name || !dept || !role || !email) {
		return json({ error: 'Medan wajib tidak lengkap' }, { status: 400 });
	}

	// Check duplicate
	const existing = await User.findOne({
		$or: [{ employeeId }, { email: email.toLowerCase() }]
	});
	if (existing) {
		return json({ error: 'ID atau email sudah wujud' }, { status: 409 });
	}

	const defaultPassword = employeeId.toLowerCase();
	const passwordHash = await hashPassword(defaultPassword);

	const user = await User.create({
		employeeId,
		name,
		dept,
		role,
		email: email.toLowerCase(),
		passwordHash,
		maxHoursPerMonth: maxHoursPerMonth || 56,
		active: true,
		salary: salary || 0,
		annualAE: annualAE || 0,
		annualHalfPaidAE: annualHalfPaidAE || 0,
		annualPaidAE: annualPaidAE || 0,
		annualPHAE: annualPHAE || 0,
		annualPH: annualPH || 0,
		userRole: 'Staff'
	});

	return json({
		success: true,
		employee: { ...user.toObject(), passwordHash: undefined }
	});
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await connectDB();

	const body = await request.json();
	const { employeeId, ...updates } = body;

	if (!employeeId) {
		return json({ error: 'ID Kakitangan diperlukan' }, { status: 400 });
	}

	// Remove passwordHash from updates if present
	delete updates.passwordHash;

	const user = await User.findOneAndUpdate(
		{ employeeId },
		{ $set: updates },
		{ new: true }
	).select('-passwordHash');

	if (!user) {
		return json({ error: 'Kakitangan tidak dijumpai' }, { status: 404 });
	}

	return json({ success: true, employee: user });
};