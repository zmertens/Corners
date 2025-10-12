import mongoose from 'mongoose'
import connectDatabase from '../../config/database'

// Mock the mongoose module
jest.mock('mongoose', () => {
  return {
    connect: jest.fn(),
    connection: {
      once: jest.fn(),
      on: jest.fn(),
    },
  }
})

describe('Database Connection', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    // Reset the process.exit mock
    process.exit = jest.fn() as any
  })

  it('should connect successfully to the database', async () => {
    // Mock successful connection
    ;(mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined)

    // Call the function
    await connectDatabase()

    // Check if connect was called with correct URI
    expect(mongoose.connect).toHaveBeenCalledWith(
      expect.stringMatching(
        /mongodb:\/\/localhost:27017\/corners|process\.env\.MONGO_URI/
      ),
      expect.any(Object)
    )
  })

  it('should exit process on database connection failure', async () => {
    // Mock connection failure
    const mockError = new Error('Connection failed')
    ;(mongoose.connect as jest.Mock).mockRejectedValueOnce(mockError)

    // Spy on console.error
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    // Call the function - wrap in try/catch since we expect it to throw
    try {
      await connectDatabase()
    } catch (error) {
      // The error should be caught by connectDatabase, not bubble up to here
      // If we get here, there's a problem with the error handling in connectDatabase
      fail('Error should be caught inside connectDatabase')
    }

    // Verify error was logged and process.exit was called
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Database connection failed:',
      mockError
    )
    expect(process.exit).toHaveBeenCalledWith(1)

    // Restore console.error
    consoleErrorSpy.mockRestore()
  })
})
