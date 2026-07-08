import mongoose from 'mongoose';
import { MONGODB_URI } from '$lib/env';

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

// Extend globalThis to cache the connection in development
declare global {
	// eslint-disable-next-line no-var
	var __mongooseCache: MongooseCache | undefined;
}

function getCache(): MongooseCache {
	if (!globalThis.__mongooseCache) {
		globalThis.__mongooseCache = { conn: null, promise: null };
	}
	return globalThis.__mongooseCache;
}

export async function connectDB(): Promise<typeof mongoose> {
	const cache = getCache();

	if (cache.conn) {
		return cache.conn;
	}

	if (!cache.promise) {
		const opts: mongoose.ConnectOptions = {
			bufferCommands: false,
			maxPoolSize: 10, // Optimized for serverless
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000
		};

		cache.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
			console.log('MongoDB connected successfully');
			return mongooseInstance;
		});
	}

	try {
		cache.conn = await cache.promise;
	} catch (e) {
		cache.promise = null;
		throw e;
	}

	return cache.conn;
}

export async function disconnectDB(): Promise<void> {
	const cache = getCache();
	if (cache.conn) {
		await mongoose.disconnect();
		cache.conn = null;
		cache.promise = null;
	}
}