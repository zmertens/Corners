import mongoose, { Document, Schema, Model } from "mongoose";
import crypto from "crypto";

export interface User {
  username: string;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
}

export interface UserDocument extends User, Document, UserMethods {
  _id: mongoose.Types.ObjectId;
}

export interface UserModel extends Model<UserDocument> {
  // Static methods can be defined here if needed
}

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(this.password, salt, 1000, 64, "sha512")
      .toString("hex");
    
    // Store password as salt:hash
    this.password = `${salt}:${hash}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    const [salt, hash] = this.password.split(":");
    const candidateHash = crypto
      .pbkdf2Sync(candidatePassword, salt, 1000, 64, "sha512")
      .toString("hex");
    return candidateHash === hash;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
    
  // Token expires in 1 hour
  this.resetPasswordExpires = new Date(Date.now() + 3600000);
  
  return resetToken;
};

export const UserModel = mongoose.model<UserDocument, UserModel>("User", userSchema);
