import type { IBoard } from './Board.js';
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IList extends Document {
  title: string;
  boardId: Types.ObjectId | IBoard;
  position: number;
  _destroy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const listSchema = new Schema<IList>(
  {
    title: { type: String, required: true, trim: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    position: { type: Number, required: true },
    _destroy: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
// Fast lookup of lists belonging to a board, and ordering by position
listSchema.index({ boardId: 1, position: 1 });


export const List = mongoose.model<IList>('List', listSchema);
