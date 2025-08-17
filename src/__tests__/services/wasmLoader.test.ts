import { loadWasm } from '../../services/wasmLoader'
import Module from '../../../public/mazebuildercli'

// Mock the mazebuilder module
jest.mock('../../../public/mazebuilder.js', () => {
  return jest.fn()
})

describe('WASM Loader', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    // Set up console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Clean up spies
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    jest.clearAllMocks()
  })

  it('should successfully load and return the WASM module', async () => {
    // Mock successful WASM module loading
    const mockGet = jest.fn().mockReturnValue(true)
    const mockStringifyFromDimens = jest
      .fn()
      .mockImplementation(
        (r: number, c: number) => `Mocked maze string for dimensions ${r}x${c}`
      )

    const mockModule = {
      get: mockGet,
      stringify_from_dimens: mockStringifyFromDimens,
    }

    ;(Module as jest.Mock).mockResolvedValue(mockModule)

    // Call the loadWasm function
    const result = await loadWasm()

    // Verify the result
    expect(result).toBeTruthy()
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'WASM module loaded successfully'
    )
  })

  it('should handle failure to get pointer from WASM module', async () => {
    // Mock WASM module with failing get() function
    ;(Module as jest.Mock).mockResolvedValue({
      get: () => false,
    })

    // Call the loadWasm function
    const result = await loadWasm()

    // Verify error handling
    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get pointer from WASM module'
    )
  })

  it('should handle failure to initialize WASM module', async () => {
    // Mock failure to initialize WASM module
    ;(Module as jest.Mock).mockResolvedValue(null)

    // Call the loadWasm function
    const result = await loadWasm()

    // Verify error handling
    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to initialize WASM module'
    )
  })

  it('should handle exceptions when loading WASM module', async () => {
    // Mock exception when loading WASM module
    const mockError = new Error('WASM loading error')
    ;(Module as jest.Mock).mockRejectedValue(mockError)

    // Call the loadWasm function
    const result = await loadWasm()

    // Verify error handling
    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading WASM module:',
      mockError.message
    )
  })
})
