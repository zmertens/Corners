import { Request } from "express";
import { Document, Types } from "mongoose";
import { UserDocument } from "../models/user";
import { cli } from "../../public/mazebuilder";

// Using the maze model type rather than Complex
export interface MazeType {
  id: string;
  data: string;
  rows: number;
  columns: number;
  algorithm: string;
  user: string | Types.ObjectId;
}

export interface MazeDocumentType extends MazeType {
  _id: string; // MongoDB document ID
}

// WebAssembly module type for maze generation
export interface WasmModuleInstance {
  stringify_from_dimens: (rows: number, columns: number) => string;
}

// Extended Request interface with authenticated user
export interface AuthRequest extends Request {
  user?: UserDocument;
  wasmInstance?: cli; // Properly typed WASM instance access
}
