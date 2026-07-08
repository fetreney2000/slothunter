import { env } from '$env/dynamic/private';

export const MONGODB_URI = env.MONGODB_URI || 'mongodb://localhost:27017/slothunter';
export const JWT_SECRET = env.JWT_SECRET || 'slothunter-jwt-secret-change-me';
export const ADMIN_EMAIL = env.ADMIN_EMAIL || 'otadmin@gmail.com';
export const ADMIN_PASSWORD = env.ADMIN_PASSWORD || '1234';