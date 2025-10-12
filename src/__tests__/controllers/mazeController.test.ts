import { Request, Response } from 'express'
import mongoose, { version } from 'mongoose'
import { MazeModel } from '../../models/maze'

import {
  createMazeAPI,
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

jest.mock('../../services/wasmLoader')

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

  describe('createMazeAPI', () => {
    let mockApiRequest: Partial<Request>

    beforeEach(() => {
      mockApiRequest = {
        body: {},
      }
    })

    it('should create a maze with the new API format', async () => {
      // Setup request data
      mockApiRequest.body = {
        algo: 'binary_tree',
        seed: 10,
        rows: 100,
        columns: 100,
      }

      // Mock WASM instance
      ;(mockApiRequest as any).wasmModule = {
        StringVector: jest.fn().mockReturnValue({
          push_back: jest.fn(),
        }),
        get: jest.fn().mockReturnValue({
          convert_as_base64: jest.fn().mockReturnValue('mock maze data'),
          version: jest.fn().mockReturnValue('mock version'),
        }),
      }

      // Call controller function
      await createMazeAPI(mockApiRequest as Request, mockResponse as Response)

      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.any(String), // base64 encoded data
        createdAt: expect.any(String), // ISO timestamp
        version_str: expect.any(String), // version from package.json
      })
    })

    it('should return 400 if rows or columns are missing', async () => {
      // Setup request with missing parameters
      mockApiRequest.body = {
        algo: 'binary_tree',
        seed: 10,
        // Missing rows and columns
      }

      // Call controller function
      await createMazeAPI(mockApiRequest as Request, mockResponse as Response)

      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required parameters: rows and columns',
      })
    })

    it('should return 400 if rows or columns are invalid', async () => {
      // Setup request with invalid parameters
      mockApiRequest.body = {
        algo: 'binary_tree',
        rows: 'invalid',
        columns: -5,
      }

      // Call controller function
      await createMazeAPI(mockApiRequest as Request, mockResponse as Response)

      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'rows and columns must be positive integers',
      })
    })
  })
})
