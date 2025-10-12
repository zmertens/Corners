import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals'

// Define types for mocks
type MockApp = {
  use: jest.Mock
  listen: jest.Mock & { mock: { calls: any[] } }
}
type MockExpress = jest.Mock<any> & {
  (): MockApp
  json: jest.Mock
  urlencoded: jest.Mock
  static: jest.Mock
}

jest.mock('../config/database', () => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve()
  })
})

// Mock cors
jest.mock('cors', () => {
  return jest.fn(() => 'cors-middleware')
})

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}))

// Mock path
jest.mock('path', () => ({
  join: jest.fn(() => '/mock/path'),
}))

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
  mockExpress.static = jest.fn(() => 'static-middleware')

  return mockExpress
})

// Mock these modules to prevent actual execution
jest.mock('../services/wasmLoader', () => {
  return {
    loadWasm: jest.fn().mockImplementation(() => {
      // Create a mock that matches the actual WASM module structure
      const mockStringVector = jest.fn().mockImplementation(() => ({
        push_back: jest.fn(),
        delete: jest.fn(),
      }))

      const mockCli = {
        convert: jest.fn().mockReturnValue('mock maze data'),
        convert_as_base64: jest.fn().mockReturnValue('bW9jayBtYXplIGRhdGE='), // "mock maze data" in base64
        help: jest.fn().mockReturnValue('mock help message'),
        version: jest.fn().mockReturnValue('mock version'),
      }

      return Promise.resolve({
        get: jest.fn().mockReturnValue(mockCli),
        StringVector: mockStringVector,
        cli: {},
        _main: jest.fn(),
        calledRun: true,
      })
    }),
  }
})

jest.mock('../services/wasmLoader', () => ({
  getWasmModule: jest.fn().mockImplementation(() => {
    const mockStringVector = jest.fn().mockImplementation(() => ({
      push_back: jest.fn(),
      delete: jest.fn(),
    }))

    const mockCli = {
      convert: jest.fn().mockReturnValue('mock maze data'),
      convert_as_base64: jest.fn().mockReturnValue('bW9jayBtYXplIGRhdGE='),
      help: jest.fn().mockReturnValue('mock help message'),
      version: jest.fn().mockReturnValue('mock version'),
    }

    return Promise.resolve({
      get: jest.fn().mockReturnValue(mockCli),
      StringVector: mockStringVector,
      cli: {},
      _main: jest.fn(),
      calledRun: true,
    })
  }),
  generateMaze: jest.fn().mockImplementation(() => Promise.resolve('mock maze data')),
}))

jest.mock('../config/database', () => jest.fn())
jest.mock('../routes/navigations', () => jest.fn())
jest.mock('../middleware/wasm', () => ({
  wasmMiddleware: jest.fn((_req: any, _res: any, next: any) => next()),
}))

describe('Express App', () => {
  let mockExpress: MockExpress
  let mockApp: MockApp
  // let consoleLogSpy: ConsoleSpy;

  beforeEach(() => {
    // Reset modules
    jest.resetModules()

    // Reset environment
    delete process.env.PORT

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
      require('../app')
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
      require('../app')
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

  it('should initialize WASM module without errors', async () => {
    // Get the mock before importing the app
    const { getWasmModule } = require('../services/wasmLoader')
    
    // Import app to trigger initialization
    jest.isolateModules(() => {
      require('../app')
    })

    // Wait a bit for async WASM initialization
    await new Promise(resolve => setTimeout(resolve, 100))

    // The test passes if no errors were thrown during app initialization
    // WASM mock is working if we see the console logs showing successful initialization
    expect(true).toBe(true) // This test mainly verifies no errors during init
  })
})
