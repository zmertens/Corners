// Jest setup file
// This file runs before each test suite

// Configure Jest timeout for async operations
jest.setTimeout(10000)

// Mock the WASM module import
jest.mock('../../public/mazebuildercli.js', () => {
  const mockCliInstance = {
    convert: jest
      .fn()
      .mockImplementation(
        (rows: number, cols: number) =>
          `Mocked maze string for dimensions ${rows}x${cols}`
      ),
  }

  return jest.fn().mockImplementation(() => {
    return Promise.resolve({
      get: jest.fn().mockReturnValue(mockCliInstance),
      cli: mockCliInstance,
    })
  })
})

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}))

// Mock the service files to prevent dependency issues
jest.mock('../services/wasmLoader', () => ({
  getWasmModule: jest.fn().mockReturnValue(null),
  isWasmReady: jest.fn().mockReturnValue(false),
  initializeWasm: jest.fn(),
  loadWasm: jest.fn(),
}))

// Mock the model files to prevent schema creation issues
jest.mock('../models/alias', () => ({
  AliasModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

jest.mock('../models/score', () => ({
  ScoreModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

jest.mock('../models/user', () => ({
  UserModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

// Mock process.env
process.env.JWT_SECRET = 'test_secret_key'
process.env.PORT = '3000'
process.env.NODE_ENV = 'test'

// Mock Mongoose to avoid actual database connections
jest.mock('mongoose', () => {
  // Create ObjectId mock for testing
  class ObjectId {
    toString() {
      return 'mock-object-id'
    }
  }

  // Mock Document type with _id
  const mockDocument = {
    _id: new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Mock Schema constructor with proper methods and Types
  function MockSchema(definition: any, options: any) {
    const schemaInstance = {
      pre: jest.fn().mockReturnThis(),
      virtual: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      index: jest.fn().mockReturnThis(),
      methods: {},
      statics: {},
      definition,
      options,
    }
    return schemaInstance
  }

  // Add Schema.Types static property
  ;(MockSchema as any).Types = {
    ObjectId: 'ObjectId',
  }

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    connection: {
      once: jest.fn(),
      on: jest.fn(),
    },
    Schema: MockSchema,
    model: jest.fn().mockImplementation((name) => {
      return {
        find: jest.fn().mockResolvedValue([{ ...mockDocument }]),
        findOne: jest.fn().mockResolvedValue({ ...mockDocument }),
        findById: jest.fn().mockResolvedValue({ ...mockDocument }),
        create: jest
          .fn()
          .mockImplementation((data) =>
            Promise.resolve({ ...mockDocument, ...data })
          ),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }
    }),
    Types: {
      ObjectId: jest.fn().mockImplementation(() => new ObjectId()),
    },
  }
})

// Global afterAll to clean up after tests
afterAll(() => {
  jest.clearAllMocks()
})
