import mongoose, { Schema, type Document } from 'mongoose';

export interface IConfig extends Document {
	adminEmail: string;
	defaultMaxHours: number;
	unavailabilityCutoffDay: number;
	rosterMonth: Date;
	lastRosterUrl: string;
	lastSummaryUrl: string;
	lastGeneratedMonth: Date;
	createdAt: Date;
	updatedAt: Date;
}

const ConfigSchema = new Schema<IConfig>(
	{
		adminEmail: {
			type: String,
			required: true,
			default: 'otadmin@gmail.com'
		},
		defaultMaxHours: {
			type: Number,
			required: true,
			default: 40
		},
		unavailabilityCutoffDay: {
			type: Number,
			required: true,
			default: 15
		},
		rosterMonth: {
			type: Date,
			required: true
		},
		lastRosterUrl: {
			type: String,
			default: ''
		},
		lastSummaryUrl: {
			type: String,
			default: ''
		},
		lastGeneratedMonth: {
			type: Date
		}
	},
	{
		timestamps: true,
		collection: 'config'
	}
);

export const Config =
	mongoose.models.Config || mongoose.model<IConfig>('Config', ConfigSchema);