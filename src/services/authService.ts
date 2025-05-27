import jwt from 'jsonwebtoken'
import { UserDocument } from '../models/user'
import mongoose from 'mongoose'

// Get values from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d'

/**
 * Interface for decoded JWT token
 */
export interface DecodedToken {
  id: string
  username: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Generate JWT token for user authentication
 * @param user User document from MongoDB
 * @returns JWT token string
 */
export const generateToken = (user: UserDocument): string => {
  // Use user._id.toString() to ensure we have a string representation of the ObjectId
  const payload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
  }

  return jwt.sign(payload, JWT_SECRET)
}

/**
 * Verify JWT token and return payload if valid
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken
  } catch (error) {
    // Handle different error types
    const err = error as Error

    if (err.name === 'TokenExpiredError') {
      console.error('Token expired')
    } else if (err.name === 'JsonWebTokenError') {
      console.error('JWT error:', err.message)
    } else if (err.name === 'NotBeforeError') {
      console.error('Token not active yet')
    } else {
      console.error('Unknown JWT verification error:', err)
    }
    return null
  }
}
