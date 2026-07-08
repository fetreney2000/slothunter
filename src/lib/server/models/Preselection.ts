import mongoose, { Schema, type Document } from 'mongoose';

export interface IPreselection extends Document {
	month: string; // YYYY-MM-01
	date: string; // YYYY-MM-DD
	slotType: string; // AE, OPD_1, IPP_1, PP_PPF, PP_PRA_1, etc.
	employeeId: string;
	createdAt: Date;
	updatedAt: Date;
}

const PreselectionSchema = new Schema<IPreselection>(
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
		slotType: {
			type: String,
			required: true,
			trim: true
		},
		employeeId: {
			type: String,
			required: true
		}
	},
	{
		timestamps: true,
		collection: 'preselections'
	}
);

PreselectionSchema.index({ month: 1, date: 1, slotType: 1 }, { unique: true });
PreselectionSchema.index({ month: 1 });

export const Preselection =
	mongoose.models.Preselection ||
	mongoose.model<IPreselection>('Preselection', PreselectionSchema);