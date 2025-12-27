import Module, { MainModule } from '../../public/mazebuildercli'

// Singleton pattern for WASM instance
let wasmInstance: MainModule | null = null
let wasmLoadingPromise: Promise<MainModule | null> | null = null
let isWasmLoaded = false

/**
 * Loads the WebAssembly module and returns the CLI interface
 * This function is called only once during application startup
 *
 * @returns Promise that resolves to the CLI interface or null if loading fails
 */
export async function loadWasm(): Promise<MainModule | null> {
  try {
    console.log('Loading WASM module...')

    // Initialize the module
    const activeModule: MainModule = await Module()

    // Validate module initialization
    if (!activeModule) {
      console.error('Failed to initialize WASM module')
      return null
    }

    // Validate that required methods are available
    if (!activeModule.StringVector) {
      console.error('StringVector not available in WASM module')
      return null
    }

    if (!activeModule.get) {
      console.error('get method not available in WASM module')
      return null
    }

    console.log('✅ WASM module loaded successfully')
    console.log('Available methods:', Object.keys(activeModule))
    console.log('StringVector available:', typeof activeModule.StringVector)
    console.log('get method available:', typeof activeModule.get)

    // Test basic functionality
    try {
      const cliInstance = activeModule.get()
      if (cliInstance) {
        console.log('✅ WASM CLI instance retrieved successfully')
      }
    } catch (testError) {
      console.warn('⚠️ WASM CLI instance test failed:', testError)
    }

    isWasmLoaded = true
    return activeModule
  } catch (error) {
    console.error(
      '❌ Error loading WASM module:',
      error instanceof Error ? error.message : String(error)
    )
    return null
  }
}

/**
 * Initialize WASM module during application startup
 * This should be called once when the application starts
 */
export const initializeWasm = async (): Promise<void> => {
  if (wasmLoadingPromise) {
    console.log('WASM module is already being loaded...')
    await wasmLoadingPromise
    return
  }

  if (wasmInstance) {
    console.log('WASM module is already loaded')
    return
  }

  wasmLoadingPromise = loadWasm()
  wasmInstance = await wasmLoadingPromise
  wasmLoadingPromise = null
}

/**
 * Gets the initialized WebAssembly instance
 * Returns the cached instance if already loaded
 * @returns The initialized WebAssembly instance or null if not loaded
 */
export const getWasmModule = (): MainModule | null => {
  return wasmInstance
}

/**
 * Check if WASM module is loaded and ready
 */
export const isWasmReady = (): boolean => {
  return isWasmLoaded && wasmInstance !== null
}

/**
 * Reset WASM loader state - for testing purposes only
 * @internal
 */
export const resetWasmState = (): void => {
  wasmInstance = null
  wasmLoadingPromise = null
  isWasmLoaded = false
}
