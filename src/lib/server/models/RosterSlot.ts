import mongoose, { Schema, type Document } from 'mongoose';

export interface IRosterSlot extends Document {
	rosterId: string;
	date: string; // YYYY-MM-DD
	day: string; // Isn, Sel, Rab, Kha, Jum, Sab, Ahd, CUTI UMUM
	slotType: string; // AE, IPP_1, OPD_1, PP_PPF, PP_PRA_1, POST-AE, etc.
	employeeId: string;
	employeeName: string;
	dept: 'IPP' | 'OPD';
	role: 'PPF' | 'PRA';
	hours: number;
	createdAt: Date;
	updatedAt: Date;
}

const RosterSlotSchema = new Schema<IRosterSlot>(
	{
		rosterId: {
			type: String,
			required: true,
			index: true
		},
		date: {
			type: String,
			required: true,
			match: /^\d{4}-\d{2}-\d{2}$/
		},
		day: {
			type: String,
			required: true
		},
		slotType: {
			type: String,
			required: true
		},
		employeeId: {
			type: String,
			required: true
		},
		employeeName: {
			type: String,
			required: true
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
		hours: {
			type: Number,
			required: true,
			default: 0,
			min: 0
		}
	},
	{
		timestamps: true,
		collection: 'roster_slots'
	}
);

// Compound indexes for fast roster lookups
RosterSlotSchema.index({ rosterId: 1, date: 1 });
RosterSlotSchema.index({ rosterId: 1, employeeId: 1 });
RosterSlotSchema.index({ rosterId: 1, date: 1, slotType: 1 }, { unique: true });

export const RosterSlot =
	mongoose.models.RosterSlot ||
	mongoose.model<IRosterSlot>('RosterSlot', RosterSlotSchema);