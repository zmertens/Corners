import { Request } from 'express'
import { Document, Types } from 'mongoose'
import { UserDocument } from '../models/user'
import { MainModule } from '../../public/mazebuildercli'

// Using the maze model type rather than Complex
export interface MazeType {
  id: string
  data: string
  rows: number
  columns: number
  algorithm: string
  user: string | Types.ObjectId
}

export interface MazeDocumentType extends MazeType {
  _id: string // MongoDB document ID
}

// Extended Request interface with authenticated user
export interface AuthRequest extends Request {
  user?: UserDocument
  wasmModule?: MainModule
}
