import * as wasmLoader from '../../services/wasmLoader'
import Module from '../../../public/mazebuildercli'

// Mock the mazebuilder module
jest.mock('../../../public/mazebuildercli', () => {

  return jest.fn()
})

describe('WASM Loader', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    // Set up console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up spies
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should successfully initialize and return the WASM module', async () => {
    // Mock successful WASM module loading
    const mockGet = jest.fn().mockReturnValue(true)
    const mockConvert = jest
      .fn()
      .mockImplementation(
        (r: number, c: number) => `Mocked maze string for dimensions ${r}x${c}`
      )

    const mockModule = {
      get: mockGet,
      convert: mockConvert,
      StringVector: jest.fn(), // Add StringVector to the mock
    }

    ;(Module as jest.Mock).mockResolvedValue(mockModule)

    // Call the initializeWasm function
    await wasmLoader.initializeWasm()

    // Verify the module is ready and accessible
    expect(wasmLoader.isWasmReady()).toBe(true)
    expect(wasmLoader.getWasmModule()).toBeTruthy()
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✅ WASM module loaded successfully'
    )
  })

  it('should handle exceptions when loading WASM module', async () => {
    // Mock exception when loading WASM module
    const mockError = new Error('WASM loading error')
    ;(Module as jest.Mock).mockRejectedValue(mockError)

    // Verify error handling
    expect(wasmLoader.isWasmReady()).toBe(false)
    expect(wasmLoader.getWasmModule()).toBeNull()
  })
})
