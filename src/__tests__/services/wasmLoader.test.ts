import * as wasmLoader from '../../services/wasmLoader'

// Mock the mazebuilder module
jest.mock('../../../public/mazebuildercli', () => {
  return jest.fn()
})

// Import the mocked module
import Module from '../../../public/mazebuildercli'
const MockedModule = Module as jest.MockedFunction<typeof Module>

describe('WASM Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have required functions available', () => {
    // Basic test to ensure the module exports the required functions
    expect(typeof wasmLoader.initializeWasm).toBe('function')
    expect(typeof wasmLoader.getWasmModule).toBe('function')
    expect(typeof wasmLoader.isWasmReady).toBe('function')
    expect(typeof wasmLoader.loadWasm).toBe('function')
  })

  it('should handle exceptions when loading WASM module', async () => {
    // Mock exception when loading WASM module
    const mockError = new Error('WASM loading error')
    MockedModule.mockRejectedValue(mockError)

    // Call the initializeWasm function - should not throw
    await wasmLoader.initializeWasm()

    // Just verify it completes without throwing
    expect(true).toBe(true)
  })
})
