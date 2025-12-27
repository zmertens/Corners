import mongoose, { Document, Schema, Model } from 'mongoose'

export interface Goal {
  start: string
  steps: number
}

export interface Score {
  score: number
  maze: string // base64 encoded maze data
  goal: Goal
  aliases: string[] // list of alias names associated with this score
  user?: mongoose.Types.ObjectId // optional user association for authenticated scores
  createdAt?: Date
  updatedAt?: Date
}

export interface ScoreMethods {
  // Add any instance methods here if needed
}

export interface ScoreDocument extends Score, Document, ScoreMethods {
  _id: mongoose.Types.ObjectId
}

export interface ScoreModel extends Model<ScoreDocument> {
  // Static methods can be defined here if needed
}

const goalSchema = new Schema<Goal>(
  {
    start: {
      type: String,
      required: true,
      trim: true,
    },
    steps: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false } // Disable _id for embedded documents
)

const scoreSchema = new Schema<ScoreDocument>(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maze: {
      type: String,
      required: true,
    },
    goal: {
      type: goalSchema,
      required: true,
    },
    aliases: {
      type: [String],
      default: [],
      validate: {
        validator: function (aliases: string[]) {
          return aliases.length > 0
        },
        message: 'At least one alias is required',
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional because scores can be anonymous
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
)

// Create indexes for better query performance
scoreSchema.index({ score: -1 }) // Descending order for high scores first
scoreSchema.index({ createdAt: -1 }) // Recent scores first
scoreSchema.index({ aliases: 1 }) // For alias-based queries
scoreSchema.index({ user: 1 }) // For user-based queries

export const ScoreModel = mongoose.model<ScoreDocument, ScoreModel>(
  'Score',
  scoreSchema
)
