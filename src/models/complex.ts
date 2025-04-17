import mongoose, { Document, Schema } from 'mongoose';

export interface Complex {
    id: string;
    data: string;
}

export interface ComplexDocument extends Complex, Omit<Document, 'id'> {}

const mazeSchema = new Schema<ComplexDocument>({
    id: { type: String, required: true, unique: true },
    data: { type: String, required: true }
});

export const MazeModel = mongoose.model<ComplexDocument>('Maze', mazeSchema);