import mongoose, { Schema, type Types } from 'mongoose';
import type { IList } from './List.js';
import type { IBoard } from './Board.js';
import type { IUser } from './User.js';

export interface ICard extends Document {
  title: string;
  description?: string;
  listId: Types.ObjectId | IList;
  boardId: Types.ObjectId | IBoard;
  labels: string[];
  dueDate?: Date;
  members: Types.ObjectId[] | IUser[];
  position: number;
  _destroy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema<ICard>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    listId: { type: Schema.Types.ObjectId, ref: 'List', required: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    labels: [{ type: String }],
    dueDate: { type: Date },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    position: { type: Number, required: true },
    _destroy: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
// Fast lookup of cards in a board/list and ordering by position
cardSchema.index({ boardId: 1 });
cardSchema.index({ listId: 1, position: 1 });
cardSchema.index({ members: 1 });

export const Card = mongoose.model<ICard>('Card', cardSchema);
