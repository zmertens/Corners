import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals'
import request from 'supertest'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

// Define types for mocks
type MockApp = {
  use: jest.Mock
  listen: jest.Mock & { mock: { calls: any[] } }
}
type MockExpress = jest.Mock<any> & {
  (): MockApp
  json: jest.Mock
  urlencoded: jest.Mock
}

jest.mock('../config/database', () => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve()
  })
})

// Mock modules
jest.mock('express', () => {
  // Simple express mock that provides just what we need
  const mockApp = {
    use: jest.fn(),
    listen: jest.fn().mockReturnValue({
      on: jest.fn(),
    }),
  }

  // Create a properly typed mock
  const mockExpress = jest.fn(() => mockApp) as unknown as MockExpress
  mockExpress.json = jest.fn(() => 'json-middleware')
  mockExpress.urlencoded = jest.fn(() => 'urlencoded-middleware')

  return mockExpress
})

// Mock these modules to prevent actual execution
jest.mock('../services/wasmLoader', () => {
  return {
    loadWasm: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        convert: (r: number, c: number): string =>
          `mock maze ${r}x${c}`,
      })
    }),
  }
})

jest.mock('../config/database', () => jest.fn())
jest.mock('../routes/navigations', () => jest.fn())

describe('Express App', () => {
  let mockExpress: MockExpress
  let mockApp: MockApp
  // let consoleLogSpy: ConsoleSpy;

  beforeEach(() => {
    // Reset modules
    jest.resetModules()

    // Spy on console.log to verify startup message
    // consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Get our mocked express
    mockExpress = require('express') as unknown as MockExpress
    mockApp = mockExpress()
  })

  afterEach(() => {
    // consoleLogSpy.mockRestore();
  })

  it('should set up express with the correct middleware', () => {
    // Import app to trigger initialization
    jest.isolateModules(() => {
      // require('../app');
    })

    // Verify express was initialized with the correct middleware
    expect(mockExpress.json).toHaveBeenCalled()
    expect(mockExpress.urlencoded).toHaveBeenCalledWith({ extended: true })
    expect(mockApp.use).toHaveBeenCalledWith('json-middleware')
    expect(mockApp.use).toHaveBeenCalledWith('urlencoded-middleware')
  })

  it('should start the server on the defined port', () => {
    // Import app to trigger initialization
    jest.isolateModules(() => {
      // require('../app');
    })

    // Verify the server was started
    expect(mockApp.listen).toHaveBeenCalled()
    expect(mockApp.listen.mock.calls[0][0]).toBe(3000) // Default port

    // Execute the callback passed to listen()
    const listenCallback = mockApp.listen.mock.calls[0][1] as () => void
    listenCallback()

    // Verify the startup message was logged
    // expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Server is running'));
  })
})
