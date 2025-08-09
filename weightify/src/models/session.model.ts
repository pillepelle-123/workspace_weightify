import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  weightlistId: string;
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  currentTrackIndex: number;
  currentPlaylistId: string | null;
  weightflowId?: string;
  currentWeightlistIndex?: number;
  timeLimitMinutes?: number;
}

const sessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true },
  weightlistId: { type: String, required: true },
  userId: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  lastActivityTime: { type: Date, default: Date.now },
  currentTrackIndex: { type: Number, default: 0 },
  currentPlaylistId: { type: String, default: null },
  weightflowId: { type: String },
  currentWeightlistIndex: { type: Number },
  timeLimitMinutes: { type: Number }
});

export const Session = mongoose.model<ISession>('Session', sessionSchema);