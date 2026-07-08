import mongoose, { Schema, type Document } from 'mongoose';

export interface IRosterLog extends Document {
	rosterId: string;
	changedAt: Date;
	changedBy: {
		email: string;
		name: string;
		role: 'admin' | 'staff';
	};
	date: string; // YYYY-MM-DD
	slot: string; // Slot type (AE, OPD_1, etc.)
	oldEmployeeId: string;
	oldEmployeeName: string;
	oldDept: 'IPP' | 'OPD';
	oldRole: 'PPF' | 'PRA';
	oldHours: number;
	newEmployeeId: string;
	newEmployeeName: string;
	newDept: 'IPP' | 'OPD';
	newRole: 'PPF' | 'PRA';
	newHours: number;
	action: 'UPDATE' | 'SYNC_POST_AE' | 'CREATE' | 'DELETE';
	createdAt: Date;
	updatedAt: Date;
}

const RosterLogSchema = new Schema<IRosterLog>(
	{
		rosterId: {
			type: String,
			required: true,
			index: true
		},
		changedAt: {
			type: Date,
			required: true,
			default: Date.now
		},
		changedBy: {
			email: { type: String, required: true },
			name: { type: String, required: true },
			role: { type: String, required: true, enum: ['admin', 'staff'] }
		},
		date: {
			type: String,
			required: true,
			match: /^\d{4}-\d{2}-\d{2}$/
		},
		slot: {
			type: String,
			required: true
		},
		oldEmployeeId: {
			type: String,
			default: ''
		},
		oldEmployeeName: {
			type: String,
			default: ''
		},
		oldDept: {
			type: String,
			enum: ['IPP', 'OPD', ''],
			default: ''
		},
		oldRole: {
			type: String,
			enum: ['PPF', 'PRA', ''],
			default: ''
		},
		oldHours: {
			type: Number,
			default: 0
		},
		newEmployeeId: {
			type: String,
			required: true
		},
		newEmployeeName: {
			type: String,
			required: true
		},
		newDept: {
			type: String,
			required: true,
			enum: ['IPP', 'OPD']
		},
		newRole: {
			type: String,
			required: true,
			enum: ['PPF', 'PRA']
		},
		newHours: {
			type: Number,
			required: true,
			default: 0
		},
		action: {
			type: String,
			required: true,
			enum: ['UPDATE', 'SYNC_POST_AE', 'CREATE', 'DELETE']
		}
	},
	{
		timestamps: true,
		collection: 'roster_logs'
	}
);

// Indexes for audit trail queries
RosterLogSchema.index({ rosterId: 1, changedAt: -1 });
RosterLogSchema.index({ rosterId: 1, date: 1 });
RosterLogSchema.index({ 'changedBy.email': 1 });

export const RosterLog =
	mongoose.models.RosterLog ||
	mongoose.model<IRosterLog>('RosterLog', RosterLogSchema);