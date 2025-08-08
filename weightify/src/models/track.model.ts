import mongoose, { Document, Schema } from 'mongoose';

export interface ITrack extends Document {
  trackId: string;
  name: string;
  uri: string;
  artists: any[];
  album: any;
  artistNames: string;
  albumName: string;
  albumCoverUrl: string;
  duration_ms: number;
  weightlistId: string;
  playlistId: string;
  isPlayed: boolean;
  sessionId: string;
}

const trackSchema = new Schema<ITrack>({
  trackId: { type: String, required: true },
  name: { type: String, required: true },
  uri: { type: String, required: true },
  artists: [Schema.Types.Mixed],
  album: Schema.Types.Mixed,
  artistNames: { type: String, default: '' },
  albumName: { type: String, default: '' },
  albumCoverUrl: { type: String, default: '' },
  duration_ms: { type: Number, default: 0 },
  weightlistId: { type: String, required: true },
  playlistId: { type: String, required: true },
  isPlayed: { type: Boolean, default: false },
  sessionId: { type: String, required: true }
});

export const Track = mongoose.model<ITrack>('Track', trackSchema);