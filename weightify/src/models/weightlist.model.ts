import mongoose, { Document, Schema } from 'mongoose';

export interface SourcePlaylist {
  playlistId: string;
  weight: number;
}

export interface WeightChange {
  afterMinutes: number;
  newWeights: { playlistId: string; weight: number }[];
}

export interface IWeightlist extends Document {
  name: string;
  userId: string;
  sourcePlaylists: SourcePlaylist[];
  scheduledWeightChanges?: WeightChange[];
  playbackMode: 'default' | 'shuffle';
  repeatMode: 'none' | 'entire_weightlist' | 'single_song';
  singlePlaylistMode: boolean;
  crossfadeDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

const weightlistSchema = new Schema<IWeightlist>(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    sourcePlaylists: [
      {
        playlistId: { type: String, required: true },
        weight: { type: Number, required: true, min: 0, max: 100 }
      }
    ],
    scheduledWeightChanges: [
      {
        afterMinutes: { type: Number, required: true, min: 1 },
        newWeights: [
          {
            playlistId: { type: String, required: true },
            weight: { type: Number, required: true, min: 0, max: 100 }
          }
        ]
      }
    ],
    playbackMode: { 
      type: String, 
      enum: ['default', 'shuffle'], 
      default: 'default' 
    },
    repeatMode: { 
      type: String, 
      enum: ['none', 'entire_weightlist', 'single_song'], 
      default: 'none' 
    },
    singlePlaylistMode: { 
      type: Boolean, 
      default: false 
    },
    crossfadeDuration: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 15 
    }
  },
  { timestamps: true }
);

export const Weightlist = mongoose.model<IWeightlist>('Weightlist', weightlistSchema);