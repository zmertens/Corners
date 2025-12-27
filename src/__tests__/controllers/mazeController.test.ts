import { Request, Response } from 'express'
import mongoose, { version } from 'mongoose'
import { MazeModel } from '../../models/maze'

import { createMazeAPI } from '../../controllers/mazeController'
import { AuthRequest } from '../../types/index'
import { getWasmModule, isWasmReady } from '../../services/wasmLoader'

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

jest.mock('../../services/wasmLoader', () => ({
  getWasmModule: jest.fn(),
  isWasmReady: jest.fn(),
}))

const mockedGetWasmModule = getWasmModule as jest.MockedFunction<
  typeof getWasmModule
>
const mockedIsWasmReady = isWasmReady as jest.MockedFunction<typeof isWasmReady>

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

      // Default WASM mock setup - return null to use request module
      mockedGetWasmModule.mockReturnValue(null)
      mockedIsWasmReady.mockReturnValue(true)
    })

    it('should create a maze with the new API format (single object)', async () => {
      // Setup request data
      mockApiRequest.body = {
        algo: 'binary_tree',
        seed: 10,
        rows: 100,
        columns: 100,
        distances: '[:]',
      }

      // Mock WASM instance
      ;(mockApiRequest as any).wasmModule = {
        StringVector: jest.fn().mockReturnValue({
          push_back: jest.fn(),
          delete: jest.fn(),
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
        version_str: expect.any(String), // version from WASM module
        config: mockApiRequest.body, // original configuration
      })
    })

    it('should create multiple mazes with array input', async () => {
      // Setup request data with array
      mockApiRequest.body = [
        {
          algo: 'dfs',
          seed: 42,
          rows: 10,
          columns: 10,
          distances: '[0:-1]',
        },
        {
          algo: 'binary_tree',
          rows: 20,
          columns: 15,
        },
      ]

      // Mock WASM instance
      ;(mockApiRequest as any).wasmModule = {
        StringVector: jest.fn().mockReturnValue({
          push_back: jest.fn(),
          delete: jest.fn(),
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
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          data: expect.any(String),
          createdAt: expect.any(String),
          version_str: expect.any(String),
          config: mockApiRequest.body[0],
        },
        {
          data: expect.any(String),
          createdAt: expect.any(String),
          version_str: expect.any(String),
          config: mockApiRequest.body[1],
        },
      ])
    })

    it('should return 400 if array is empty', async () => {
      // Setup request with empty array
      mockApiRequest.body = []

      // Call controller function
      await createMazeAPI(mockApiRequest as Request, mockResponse as Response)

      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Request body cannot be empty',
      })
    })

    it('should return 400 if any configuration in array is missing required parameters', async () => {
      // Setup request with missing parameters in one configuration
      mockApiRequest.body = [
        {
          algo: 'dfs',
          rows: 10,
          columns: 10,
        },
        {
          algo: 'binary_tree',
          // Missing rows and columns
        },
      ]

      // Call controller function
      await createMazeAPI(mockApiRequest as Request, mockResponse as Response)

      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          'Missing required parameters (rows and columns) in configuration 2',
      })
    })

    it('should return 400 if rows or columns are missing (single object)', async () => {
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
        error:
          'Missing required parameters (rows and columns) in configuration 1',
      })
    })

    it('should return error for invalid rows or columns', async () => {
      // Setup request with invalid parameters
      mockApiRequest.body = {
        algo: 'binary_tree',
        rows: 'invalid',
        columns: -5,
      }

      // Mock WASM instance to simulate the path where validation occurs
      ;(mockApiRequest as any).wasmModule = {
        StringVector: jest.fn().mockReturnValue({
          push_back: jest.fn(),
          delete: jest.fn(),
        }),
        get: jest.fn().mockReturnValue({
          convert_as_base64: jest.fn().mockReturnValue('mock maze data'),
          version: jest.fn().mockReturnValue('mock version'),
        }),
      }

      // Call controller function
      await createMazeAPI(mockApiRequest as Request, mockResponse as Response)

      // Should return status 207 (multi-status) with error in the response
      expect(mockResponse.status).toHaveBeenCalledWith(207)
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: '',
        createdAt: expect.any(String),
        version_str: '',
        config: mockApiRequest.body,
        error: 'rows and columns must be positive integers',
      })
    })

    it('should handle WASM module unavailable', async () => {
      // Setup request data
      mockApiRequest.body = {
        algo: 'binary_tree',
        rows: 10,
        columns: 10,
      }

      // No WASM module attached to request
      ;(mockApiRequest as any).wasmModule = undefined

      // Mock WASM as unavailable
      mockedGetWasmModule.mockReturnValue(null)
      mockedIsWasmReady.mockReturnValue(false)

      // Call controller function
      await createMazeAPI(mockApiRequest as Request, mockResponse as Response)

      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: '',
        createdAt: expect.any(String),
        version_str: '',
        config: mockApiRequest.body,
        error: 'WASM module not available',
      })
    })
  })
})
