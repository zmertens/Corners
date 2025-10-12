import { Response, NextFunction } from 'express'
import { wasmMiddleware } from '../../middleware/wasm'
import * as mazeService from '../../services/wasmLoader'
import { AuthRequest } from '../../types'

// Mock dependencies
jest.mock('../../services/wasmLoader', () => ({

  getWasmModule: jest.fn(),
}))

const mockedMazeService = mazeService as jest.Mocked<typeof mazeService>

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

    // Reset all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should attach WASM instance to request when loaded successfully', async () => {
    // Mock successful WASM instance loading
    const mockWasmInstance = {
      convert: jest.fn().mockReturnValue('mock maze data'),
    }
    ;(mockedMazeService.getWasmModule as jest.Mock).mockResolvedValue(

      mockWasmInstance
    )

    // Call middleware
    await wasmMiddleware(
      
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    )

    // Assertions
    expect(mockedMazeService.getWasmModule).toHaveBeenCalled()
    expect(mockRequest.wasmModule).toBe(mockWasmInstance)
    expect(mockNext).toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should proceed without WASM instance when loading fails', async () => {
    // Mock failed WASM instance loading
    mockedMazeService.getWasmModule.mockResolvedValue(null)

    // Call middleware
    await wasmMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    )

    // Assertions
    expect(mockedMazeService.getWasmModule).toHaveBeenCalled()
    // expect(mockRequest.wasmInstance).toBeUndefined();
    expect(mockNext).toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'WASM middleware: Failed to load WASM module'
    )
  })

  it('should handle exceptions and proceed', async () => {
    // Mock exception when loading WASM
    const mockError = new Error('Test error')
    mockedMazeService.getWasmModule.mockRejectedValue(mockError)

    // Call middleware
    await wasmMiddleware(
      mockRequest as AuthRequest,
      mockResponse as Response,
      mockNext
    )

    // Assertions
    expect(mockedMazeService.getWasmModule).toHaveBeenCalled()
    expect(mockRequest.wasmModule).toBeUndefined()
    expect(mockNext).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'WASM middleware error:',
      mockError
    )
  })
})
