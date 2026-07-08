import mongoose, { Schema, type Document } from 'mongoose';

export interface IAE_Assignment extends Document {
	month: string; // YYYY-MM-01 (first day of month)
	date: string; // YYYY-MM-DD
	department: 'IPP' | 'OPD';
	createdAt: Date;
	updatedAt: Date;
}

const AE_AssignmentSchema = new Schema<IAE_Assignment>(
	{
		month: {
			type: String,
			required: true,
			match: /^\d{4}-\d{2}-01$/
		},
		date: {
			type: String,
			required: true,
			match: /^\d{4}-\d{2}-\d{2}$/
		},
		department: {
			type: String,
			required: true,
			enum: ['IPP', 'OPD']
		}
	},
	{
		timestamps: true,
		collection: 'ae_assignments'
	}
);

AE_AssignmentSchema.index({ month: 1, date: 1 }, { unique: true });
AE_AssignmentSchema.index({ date: 1 });

export const AE_Assignment =
	mongoose.models.AE_Assignment ||
	mongoose.model<IAE_Assignment>('AE_Assignment', AE_AssignmentSchema);