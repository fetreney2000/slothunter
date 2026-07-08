import mongoose, { Schema, type Document } from 'mongoose';

export interface IHoliday extends Document {
	date: string; // YYYY-MM-DD
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

const HolidaySchema = new Schema<IHoliday>(
	{
		date: {
			type: String,
			required: true,
			unique: true,
			match: /^\d{4}-\d{2}-\d{2}$/,
			index: true
		},
		name: {
			type: String,
			required: true,
			trim: true
		}
	},
	{
		timestamps: true,
		collection: 'holidays'
	}
);

export const Holiday =
	mongoose.models.Holiday ||
	mongoose.model<IHoliday>('Holiday', HolidaySchema);