import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '$lib/env';
import { connectDB } from './db';
import { User } from './models';

export interface JWTPayload {
	employeeId: string;
	email: string;
	role: 'admin' | 'staff';
	dept: 'IPP' | 'OPD';
	staffRole: 'PPF' | 'PRA';
	name: string;
}

const TOKEN_EXPIRY = '7d';
const COOKIE_NAME = 'slothunter_token';

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}

export async function verifyPassword(
	password: string,
	hash: string
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export function createToken(payload: JWTPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as JWTPayload;
	} catch {
		return null;
	}
}

export function getCookieName(): string {
	return COOKIE_NAME;
}

export async function authenticateUser(
	email: string,
	password: string
): Promise<{ token: string; user: JWTPayload } | null> {
	await connectDB();

	const user = await User.findOne({ email: email.toLowerCase(), active: true });
	if (!user) return null;

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) return null;

	const payload: JWTPayload = {
		employeeId: user.employeeId,
		email: user.email,
		role: user.userRole === 'Admin' ? 'admin' : 'staff',
		dept: user.dept,
		staffRole: user.role,
		name: user.name
	};

	const token = createToken(payload);
	return { token, user: payload };
}

export async function ensureAdminExists(): Promise<void> {
	await connectDB();
	const { ADMIN_EMAIL, ADMIN_PASSWORD } = await import('$lib/env');

	const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
	if (existing) return;

	const hash = await hashPassword(ADMIN_PASSWORD);
	await User.create({
		employeeId: 'ADMIN',
		name: 'Pentadbir',
		dept: 'OPD',
		role: 'PPF',
		email: ADMIN_EMAIL.toLowerCase(),
		passwordHash: hash,
		maxHoursPerMonth: 0,
		active: true,
		salary: 0,
		annualAE: 0,
		annualHalfPaidAE: 0,
		annualPaidAE: 0,
		annualPHAE: 0,
		annualPH: 0,
		userRole: 'Admin'
	});
}