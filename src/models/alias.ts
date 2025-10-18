import mongoose, { Document, Schema, Model } from 'mongoose'

export interface Alias {
  name: string
  user: mongoose.Types.ObjectId
  active: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface AliasMethods {
  // Add any instance methods here if needed
}

export interface AliasDocument extends Alias, Document, AliasMethods {
  _id: mongoose.Types.ObjectId
}

export interface AliasModel extends Model<AliasDocument> {
  // Static methods can be defined here if needed
}

const aliasSchema = new Schema<AliasDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
)

// Create compound index to ensure unique alias names per user
aliasSchema.index({ name: 1, user: 1 }, { unique: true })

// Create index on active status for faster queries
aliasSchema.index({ active: 1 })

export const AliasModel = mongoose.model<AliasDocument, AliasModel>(
  'Alias',
  aliasSchema
)
