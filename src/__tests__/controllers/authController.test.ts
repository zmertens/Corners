import { Request, Response } from 'express'
import * as authController from '../../controllers/authController'
import { UserModel, UserDocument } from '../../models/user'
import { generateToken } from '../../services/authService'
import { AuthRequest } from '../../types'

// Mock dependencies
jest.mock('../../models/user')
jest.mock('../../services/authService')

describe('Auth Controller', () => {
  let mockReq: Partial<Request | AuthRequest>
  let mockRes: Partial<Response>

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    }

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    }

    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully with base64 password', async () => {
      const base64Password = Buffer.from('testpassword').toString('base64')

      mockReq = {
        body: {
          username: 'testuser',
          password: base64Password,
        },
        ip: '127.0.0.1',
      }

      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        token: undefined,
        ipAddress: undefined,
        avatar: undefined,
      }

      ;(UserModel.findOne as jest.Mock).mockResolvedValue(mockUser)
      ;(generateToken as jest.Mock).mockReturnValue('mock-csv-token')

      await authController.login(mockReq as Request, mockRes as Response)

      expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' })
      expect(mockUser.comparePassword).toHaveBeenCalledWith(base64Password)
      expect(generateToken).toHaveBeenCalledWith(mockUser)
      expect(mockUser.save).toHaveBeenCalled()

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'mock-csv-token',
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          ipAddress: '127.0.0.1',
          avatar: undefined,
        },
      })
    })

    it('should return 400 if username is missing', async () => {
      mockReq.body = {
        password: 'somepassword',
      }

      await authController.login(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Username and password are required',
      })
    })

    it('should return 400 if password is missing', async () => {
      mockReq.body = {
        username: 'testuser',
      }

      await authController.login(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Username and password are required',
      })
    })

    it('should return 401 if user not found', async () => {
      mockReq.body = {
        username: 'nonexistentuser',
        password: 'somepassword',
      }
      ;(UserModel.findOne as jest.Mock).mockResolvedValue(null)

      await authController.login(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      })
    })

    it('should return 401 if password is incorrect', async () => {
      mockReq.body = {
        username: 'testuser',
        password: 'wrongpassword',
      }

      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false),
      }

      ;(UserModel.findOne as jest.Mock).mockResolvedValue(mockUser)

      await authController.login(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      })
    })
  })

  describe('register', () => {
    it('should register user successfully with base64 password', async () => {
      const base64Password = Buffer.from('newpassword').toString('base64')

      mockReq = {
        body: {
          username: 'newuser',
          email: 'new@example.com',
          password: base64Password,
        },
        ip: '127.0.0.1',
      }

      const mockUser = {
        _id: 'new-user-id',
        username: 'newuser',
        email: 'new@example.com',
        save: jest.fn().mockResolvedValue(true),
        token: 'new-csv-token',
        ipAddress: '127.0.0.1',
        avatar: undefined,
      }

      ;(UserModel.findOne as jest.Mock).mockResolvedValue(null) // No existing user
      ;(UserModel.create as jest.Mock).mockResolvedValue(mockUser)
      ;(generateToken as jest.Mock).mockReturnValue('new-csv-token')

      await authController.register(mockReq as Request, mockRes as Response)

      expect(UserModel.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'new@example.com' }, { username: 'newuser' }],
      })

      expect(UserModel.create).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: base64Password,
        avatar: undefined,
        ipAddress: '127.0.0.1',
      })

      expect(mockUser.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        token: 'new-csv-token',
        user: {
          id: 'new-user-id',
          username: 'newuser',
          email: 'new@example.com',
          ipAddress: '127.0.0.1',
          avatar: undefined,
        },
      })
    })

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {
        username: 'testuser',
        // email and password missing
      }

      await authController.register(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Username, email, and password are required',
      })
    })

    it('should return 400 if user already exists', async () => {
      mockReq.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'somepassword',
      }

      const existingUser = { username: 'existinguser' }
      ;(UserModel.findOne as jest.Mock).mockResolvedValue(existingUser)

      await authController.register(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User already exists',
      })
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      authController.logout(mockReq as Request, mockRes as Response)

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      })
    })
  })

  describe('getAllUsers', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        { _id: 'user1', username: 'user1', email: 'user1@example.com' },
        { _id: 'user2', username: 'user2', email: 'user2@example.com' },
      ]

      const mockSelect = jest.fn().mockResolvedValue(mockUsers)
      ;(UserModel.find as jest.Mock).mockReturnValue({ select: mockSelect })

      await authController.getAllUsers(mockReq as Request, mockRes as Response)

      expect(UserModel.find).toHaveBeenCalledWith()
      expect(mockSelect).toHaveBeenCalledWith('-password')
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers)
    })
  })

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockReq.params = { id: 'user-id' }

      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
      }

      const mockSelect = jest.fn().mockResolvedValue(mockUser)
      ;(UserModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

      await authController.getUserById(mockReq as Request, mockRes as Response)

      expect(UserModel.findById).toHaveBeenCalledWith('user-id')
      expect(mockSelect).toHaveBeenCalledWith('-password')
      expect(mockRes.json).toHaveBeenCalledWith(mockUser)
    })

    it('should return 404 if user not found', async () => {
      mockReq.params = { id: 'nonexistent-id' }

      const mockSelect = jest.fn().mockResolvedValue(null)
      ;(UserModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

      await authController.getUserById(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found',
      })
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const authReq = {
        ...mockReq,
        user: {
          _id: 'user-id',
        } as unknown as UserDocument,
        params: { id: 'user-id' },
      } as AuthRequest

      const mockUser = {
        _id: 'user-id',
        deleteOne: jest.fn().mockResolvedValue(true),
      }

      ;(UserModel.findById as jest.Mock).mockResolvedValue(mockUser)

      await authController.deleteUser(authReq, mockRes as Response)

      expect(UserModel.findById).toHaveBeenCalledWith('user-id')
      expect(mockUser.deleteOne).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User deleted successfully',
      })
    })

    it('should return 404 if user not found', async () => {
      const authReq = {
        ...mockReq,
        user: {
          _id: 'user-id',
        } as unknown as UserDocument,
        params: { id: 'nonexistent-id' },
      } as AuthRequest

      ;(UserModel.findById as jest.Mock).mockResolvedValue(null)

      await authController.deleteUser(authReq, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found',
      })
    })

    it('should return 403 if user tries to delete different user', async () => {
      const authReq = {
        ...mockReq,
        user: {
          _id: 'user-id-1',
        } as unknown as UserDocument,
        params: { id: 'user-id-2' },
      } as AuthRequest

      const mockUser = {
        _id: 'user-id-2',
      }

      ;(UserModel.findById as jest.Mock).mockResolvedValue(mockUser)

      await authController.deleteUser(authReq, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authorized',
      })
    })
  })
})
