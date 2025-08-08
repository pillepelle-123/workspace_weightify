import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  spotifyId: string;
  email: string;
  displayName: string;
  refreshToken: string;
  accessToken?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  spotifyId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: { type: String, required: true },
  refreshToken: { type: String, required: true },
  accessToken: { type: String },
  tokenExpiresAt: { type: Date },
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', userSchema);