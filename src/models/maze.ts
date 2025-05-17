import mongoose, { Document, Schema } from "mongoose";

export interface Maze {
  id: string;
  data: string;
  rows: number;
  columns: number;
  algorithm: string;
  user: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MazeDocument extends Maze, Omit<Document, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const mazeSchema = new Schema<MazeDocument>({
  id: { type: String, required: true, unique: true },
  data: { type: String, required: true },
  rows: { type: Number, required: true },
  columns: { type: Number, required: true },
  algorithm: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { 
  timestamps: true // Adds createdAt and updatedAt fields
});

export const MazeModel = mongoose.model<MazeDocument>("Maze", mazeSchema);
