import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { MazeModel } from '../../models/maze'
import * as mazeService from '../../services/mazeService'
import {
  createMaze,
  getUserMazes,
  getMazeById,
  updateMaze,
  deleteMaze,
} from '../../controllers/mazeController'
import { AuthRequest } from '../../types/index'

// Mock mongoose before importing modules that use it
jest.mock('mongoose', () => {
  function MockSchema(this: any, definition: any, options?: any) {
    this.methods = {}
    this.pre = jest.fn()
    this.post = jest.fn()
  }

  // Add Types as a static property
  MockSchema.Types = {
    ObjectId: jest.fn(),
  }

  return {
    Schema: MockSchema,
    model: jest.fn(),
    connect: jest.fn(),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
    },
    Types: {
      ObjectId: jest.fn(),
    },
  }
})

// Mock dependencies
jest.mock('../../models/maze', () => ({
  MazeModel: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}))
jest.mock('../../services/mazeService')

const mockedMazeModel = MazeModel as jest.Mocked<typeof MazeModel>

describe('Maze Controller', () => {
  let mockRequest: Partial<AuthRequest>
  let mockResponse: Partial<Response>
  let mockUser: any

  beforeEach(() => {
    // Create mock request and response objects
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      username: 'testuser',
      email: 'test@example.com',
    }

    mockRequest = {
      user: mockUser,
      body: {},
      params: {},
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('createMaze', () => {
    it('should create a new maze successfully', async () => {
      // Setup request data
      mockRequest.body = {
        rows: 10,
        columns: 10,
        algorithm: 'recursive-backtracker',
      }

      // Mock WASM instance
      mockRequest.wasmModule = {
        _main: jest.fn(),
        cli: jest.fn(),
        StringVector: jest.fn().mockReturnValue({
          push_back: jest.fn(),
        }),
        get: jest.fn().mockReturnValue({
          convert: jest.fn().mockReturnValue('mock maze data'),
        }),
      }

      // Mock maze creation
      const mockMaze = {
        id: 'test_maze_id',
        data: 'mock maze data',
        rows: 10,
        columns: 10,
        algorithm: 'recursive-backtracker',
        save: jest.fn().mockResolvedValue(true),
      }

      mockedMazeModel.create.mockResolvedValue(mockMaze)

      // Call controller function
      await createMaze(mockRequest as AuthRequest, mockResponse as Response)

      // Assertions - The convert function should be called with a StringVector, not raw numbers
      expect(mockRequest.wasmModule?.get()?.convert).toHaveBeenCalledWith(
        expect.objectContaining({
          push_back: expect.any(Function),
        })
      )
      expect(mockedMazeModel.create).toHaveBeenCalledWith({
        id: expect.any(String),
        data: 'mock maze data',
        rows: 10,
        columns: 10,
        algorithm: 'recursive-backtracker',
        user: mockUser._id,
      })
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Maze created successfully',
        maze: expect.objectContaining({
          id: mockMaze.id,
          data: mockMaze.data,
          rows: mockMaze.rows,
          columns: mockMaze.columns,
          algorithm: mockMaze.algorithm,
        }),
      })
    })

    it('should fall back to mazeService when wasmInstance is not available', async () => {
      // Setup request data
      mockRequest.body = {
        rows: 10,
        columns: 10,
        algorithm: 'recursive-backtracker',
      }

      // Remove WASM instance
      mockRequest.wasmModule = undefined

      // Mock generateMaze service
      ;(mazeService.generateMaze as jest.Mock).mockResolvedValue(
        'mock maze data from service'
      )

      // Mock maze creation
      const mockMaze = {
        id: 'test_maze_id',
        data: 'mock maze data from service',
        rows: 10,
        columns: 10,
        algorithm: 'recursive-backtracker',
        save: jest.fn().mockResolvedValue(true),
      }

      mockedMazeModel.create.mockResolvedValue(mockMaze)

      // Call controller function
      await createMaze(mockRequest as AuthRequest, mockResponse as Response)

      // Assertions
      expect(mazeService.generateMaze).toHaveBeenCalledWith(
        10,
        10,
        'recursive-backtracker'
      )
      expect(MazeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'mock maze data from service',
        })
      )
      expect(mockResponse.status).toHaveBeenCalledWith(201)
    })

    it('should return 400 if rows or columns are missing', async () => {
      // Setup request with missing data
      mockRequest.body = {}

      // Call controller function
      await createMaze(mockRequest as AuthRequest, mockResponse as Response)

      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing required parameters: rows and columns',
      })
    })

    it('should return 401 if user is not authenticated', async () => {
      // Setup request with missing user
      mockRequest.user = undefined
      mockRequest.body = { rows: 10, columns: 10 }

      // Call controller function
      await createMaze(mockRequest as AuthRequest, mockResponse as Response)

      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not authenticated',
      })
    })
  })
})
