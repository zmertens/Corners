// Jest setup file
// This file runs before each test suite

// Mock the WASM module import
jest.mock('../../public/mazebuilder', () => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve({
      get: () => true,
      stringify_from_dimens: (r: number, c: number) => 
        `Mocked maze string for dimensions ${r}x${c}`
    });
  });
});

// Mock Mongoose to avoid actual database connections
jest.mock('mongoose', () => {
  const mConnect = jest.fn();
  return {
    connect: mConnect,
    connection: {
      once: jest.fn(),
      on: jest.fn()
    },
    Schema: jest.fn().mockReturnValue({
      pre: jest.fn().mockReturnThis(),
      virtual: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    }),
    model: jest.fn().mockImplementation(() => {
      return {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({}),
        findById: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
      };
    })
  };
});

// Global afterAll to clean up after tests
afterAll(() => {
  jest.clearAllMocks();
});