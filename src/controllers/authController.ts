import { Request, Response } from 'express'
import crypto from 'crypto'
import { UserModel, UserDocument } from '../models/user'
import { AuthRequest } from '../types'
import { generateToken } from '../services/authService'

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, avatar } = req.body

    // Validate input
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Username, email, and password are required' })
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Capture IP address
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                     'unknown'

    // Create new user (password expected to be base64 encoded)
    const user = await UserModel.create({
      username,
      email,
      password, // Will be processed by the pre-save hook
      avatar: avatar || undefined,
      ipAddress,
    })

    // Generate token
    const token = generateToken(user)

    // Update user with JWT token
    user.token = token
    await user.save()

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        ipAddress: user.ipAddress,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'Username and password are required' })
    }

    // Find user
    const user = await UserModel.findOne({ username })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Check password (password should be base64 encoded)
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Generate token
    const token = generateToken(user)

    // Capture IP address
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                     'unknown'

    // Update user with JWT token and IP address
    user.token = token
    user.ipAddress = ipAddress
    await user.save()

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        ipAddress: user.ipAddress,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // If user is authenticated, clear their token
    if (req.user) {
      req.user.token = undefined
      await req.user.save()
    }
    
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await UserModel.find().select('-password')
    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = (await UserModel.findById(req.params.id)) as UserDocument

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Make sure the authenticated user is deleting their own account
    if (req.user && user && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await user.deleteOne()
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    const user = await UserModel.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken()
    await user.save()

    // In a real application, you would send an email with the reset link
    // For this implementation, we'll just return the token
    res.json({
      message: 'Password reset token generated',
      resetToken,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    // Set new password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
