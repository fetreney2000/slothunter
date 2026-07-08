import mongoose, { Schema, type Document } from 'mongoose';

export interface IPhaseConfig extends Document {
	month: string; // YYYY-MM-01
	phases: {
		phase: number; // 1, 2, 3
		startDate: string;
		endDate: string;
		weekendSlots: number;
		weekdaySlots: number;
	}[];
	createdAt: Date;
	updatedAt: Date;
}

const PhaseConfigSchema = new Schema<IPhaseConfig>(
	{
		month: {
			type: String,
			required: true,
			unique: true,
			match: /^\d{4}-\d{2}-01$/
		},
		phases: [
			{
				phase: { type: Number, required: true },
				startDate: { type: String, required: true },
				endDate: { type: String, required: true },
				weekendSlots: { type: Number, required: true, default: 1 },
				weekdaySlots: { type: Number, required: true, default: 1 }
			}
		]
	},
	{
		timestamps: true,
		collection: 'phase_configs'
	}
);

export const PhaseConfig =
	mongoose.models.PhaseConfig ||
	mongoose.model<IPhaseConfig>('PhaseConfig', PhaseConfigSchema);