import mongoose, { Schema, type Document } from 'mongoose';

export interface IRoster extends Document {
	rosterId: string; // e.g., Roster_2026-06_1779159244431
	month: string; // YYYY-MM-01
	status: 'Draft' | 'Phase1' | 'Phase2' | 'Phase3' | 'Final';
	generatedAt: Date;
	generatedBy?: string;
	isCopy: boolean; // true = Copy Roster (editable), false = Original (read-only)
	createdAt: Date;
	updatedAt: Date;
}

const RosterSchema = new Schema<IRoster>(
	{
		rosterId: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		month: {
			type: String,
			required: true,
			match: /^\d{4}-\d{2}-01$/
		},
		status: {
			type: String,
			required: true,
			enum: ['Draft', 'Phase1', 'Phase2', 'Phase3', 'Final'],
			default: 'Draft'
		},
		generatedAt: {
			type: Date,
			required: true,
			default: Date.now
		},
		generatedBy: {
			type: String
		},
		isCopy: {
			type: Boolean,
			required: true,
			default: false
		}
	},
	{
		timestamps: true,
		collection: 'rosters'
	}
);

RosterSchema.index({ month: 1, isCopy: 1 });
RosterSchema.index({ month: 1, status: 1 });

export const Roster =
	mongoose.models.Roster || mongoose.model<IRoster>('Roster', RosterSchema);