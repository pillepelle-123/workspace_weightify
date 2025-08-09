import mongoose, { Document, Schema } from 'mongoose';

export interface WeightflowItem {
  weightlistId: string;
  timeLimitMinutes?: number; // undefined for last item
  order: number;
}

export interface IWeightflow extends Document {
  name: string;
  userId: string;
  weightlists: WeightflowItem[];
  createdAt: Date;
  updatedAt: Date;
}

const weightflowSchema = new Schema<IWeightflow>(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    weightlists: [
      {
        weightlistId: { type: String, required: true },
        timeLimitMinutes: { type: Number, min: 1, max: 1440 },
        order: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const Weightflow = mongoose.model<IWeightflow>('Weightflow', weightflowSchema);