import mongoose, { Schema, type Document } from 'mongoose';

export interface IUser extends Document {
	employeeId: string;
	name: string;
	dept: 'IPP' | 'OPD';
	role: 'PPF' | 'PRA';
	email: string;
	passwordHash: string;
	maxHoursPerMonth: number;
	active: boolean;
	salary: number;
	annualAE: number;
	annualHalfPaidAE: number;
	annualPaidAE: number;
	annualPHAE: number;
	annualPH: number;
	userRole: 'Admin' | 'Staff';
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		employeeId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true
		},
		name: {
			type: String,
			required: true,
			trim: true
		},
		dept: {
			type: String,
			required: true,
			enum: ['IPP', 'OPD']
		},
		role: {
			type: String,
			required: true,
			enum: ['PPF', 'PRA']
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true
		},
		passwordHash: {
			type: String,
			required: true
		},
		maxHoursPerMonth: {
			type: Number,
			required: true,
			default: 56,
			min: 0,
			max: 200
		},
		active: {
			type: Boolean,
			required: true,
			default: true
		},
		salary: {
			type: Number,
			required: true,
			default: 0
		},
		annualAE: {
			type: Number,
			required: true,
			default: 0,
			min: 0
		},
		annualHalfPaidAE: {
			type: Number,
			required: true,
			default: 0,
			min: 0
		},
		annualPaidAE: {
			type: Number,
			required: true,
			default: 0,
			min: 0
		},
		annualPHAE: {
			type: Number,
			required: true,
			default: 0,
			min: 0
		},
		annualPH: {
			type: Number,
			required: true,
			default: 0,
			min: 0
		},
		userRole: {
			type: String,
			required: true,
			enum: ['Admin', 'Staff'],
			default: 'Staff'
		}
	},
	{
		timestamps: true,
		collection: 'users'
	}
);

// Compound indexes for solver queries
UserSchema.index({ active: 1, dept: 1, role: 1 });
UserSchema.index({ active: 1, role: 1 });

export const User =
	mongoose.models.User || mongoose.model<IUser>('User', UserSchema);