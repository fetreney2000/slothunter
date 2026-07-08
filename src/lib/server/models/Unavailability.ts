import mongoose, { Schema, type Document } from 'mongoose';

export interface IUnavailability extends Document {
	employeeId: string;
	date: string; // YYYY-MM-DD
	timestamp: Date;
	createdAt: Date;
	updatedAt: Date;
}

const UnavailabilitySchema = new Schema<IUnavailability>(
	{
		employeeId: {
			type: String,
			required: true,
			index: true
		},
		date: {
			type: String,
			required: true,
			match: /^\d{4}-\d{2}-\d{2}$/
		},
		timestamp: {
			type: Date,
			required: true,
			default: Date.now
		}
	},
	{
		timestamps: true,
		collection: 'unavailability'
	}
);

// Compound index for fast lookups
UnavailabilitySchema.index({ employeeId: 1, date: 1 }, { unique: true });
UnavailabilitySchema.index({ date: 1 });

export const Unavailability =
	mongoose.models.Unavailability ||
	mongoose.model<IUnavailability>('Unavailability', UnavailabilitySchema);