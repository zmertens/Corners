import { Response, NextFunction } from 'express'
import { UserModel } from '../models/user'
import { AuthRequest } from '../types'
// import { UserDocument } from "../models/user";
import { verifyToken } from '../services/authService'

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    // Find user by ID
    const user = await UserModel.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    // Verify that the token matches the one stored in the user model
    // This provides additional security by ensuring the token hasn't been revoked
    if (user.token !== token) {
      return res
        .status(401)
        .json({ message: 'Token has been revoked or expired' })
    }

    // Set user in request object
    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ message: 'Invalid token' })
  }
}
