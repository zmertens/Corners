import { Response, NextFunction } from 'express'
import { wasmMiddleware } from '../../middleware/wasm'
import * as wasmLoader from '../../services/wasmLoader'
import { AuthRequest } from '../../types'

// Mock dependencies
jest.mock('../../services/wasmLoader', () => ({
  getWasmModule: jest.fn(),
  isWasmReady: jest.fn(),
}))

const mockedWasmLoader = wasmLoader as jest.Mocked<typeof wasmLoader>

describe('WASM Middleware', () => {
  let mockRequest: Partial<AuthRequest>
  let mockResponse: Partial<Response>
  let mockNext: jest.MockedFunction<NextFunction>
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    // Create mock request, response and next function
    mockRequest = {}
    mockResponse = {}
    mockNext = jest.fn()

    // Spy on console methods
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Set NODE_ENV to test to suppress warnings
    process.env.NODE_ENV = 'test'

    // Reset all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should attach WASM instance to request when loaded successfully', () => {
    // Mock successful WASM instance loading
    const mockWasmInstance = {
      convert: jest.fn(),
      get: jest.fn(),
      StringVector: jest.fn(),
      _main: jest.fn(),
      calledRun: true,
    } as any
    
    mockedWasmLoader.getWasmModule.mockReturnValue(mockWasmInstance)
    mockedWasmLoader.isWasmReady.mockReturnValue(true)

    // Call middleware (now synchronous)
    wasmMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    )

    // Verify WASM instance is attached to request
    expect(mockRequest.wasmModule).toBe(mockWasmInstance)
    expect(mockedWasmLoader.getWasmModule).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
  })

  it('should set wasmModule to undefined when WASM is not ready', () => {
    mockedWasmLoader.getWasmModule.mockReturnValue(null)
    mockedWasmLoader.isWasmReady.mockReturnValue(false)

    // Call middleware
    wasmMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    )

    // Verify undefined is set when WASM is not available
    expect(mockRequest.wasmModule).toBeUndefined()
    expect(mockedWasmLoader.getWasmModule).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
  })

  it('should handle errors gracefully and continue', () => {
    // Mock error in getWasmModule
    mockedWasmLoader.getWasmModule.mockImplementation(() => {
      throw new Error('WASM loading error')
    })

    // Call middleware
    wasmMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    )

    // Verify error is handled and middleware continues
    expect(mockRequest.wasmModule).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith('WASM middleware error:', expect.any(Error))
    expect(mockNext).toHaveBeenCalled()
  })

  it('should not log warnings in test environment', () => {
    mockedWasmLoader.getWasmModule.mockReturnValue(null)
    mockedWasmLoader.isWasmReady.mockReturnValue(false)

    // Call middleware
    wasmMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    )

    // Verify no warning is logged in test environment
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
  })

  it('should log warnings in non-test environment', () => {
    // Change environment
    process.env.NODE_ENV = 'development'
    
    mockedWasmLoader.getWasmModule.mockReturnValue(null)
    mockedWasmLoader.isWasmReady.mockReturnValue(false)

    // Call middleware
    wasmMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    )

    // Verify warning is logged in non-test environment
    expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ WASM module not available for request')
    expect(mockNext).toHaveBeenCalled()
  })
})
