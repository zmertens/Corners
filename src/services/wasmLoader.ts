import Module, { MainModule } from '../../public/mazebuildercli'

// Singleton pattern for WASM instance
let wasmInstance: MainModule | null = null

/**
 * Loads the WebAssembly module and returns the CLI interface
 *
 * @returns Promise that resolves to the CLI interface or null if loading fails
 */
export async function loadWasm(): Promise<MainModule | null> {
  try {
    // Initialize the module
    const activeModule: MainModule = await Module()

    // Validate module initialization
    if (!activeModule) {
      
      console.error('Failed to initialize WASM module')

      return null
    }

    // Validate that StringVector is available
    if (!activeModule.StringVector) {

      console.error('StringVector not available in WASM module')

      return null
    }

    console.log('WASM module loaded successfully')
    console.log('StringVector available:', typeof activeModule.StringVector)

    return activeModule

  } catch (error) {

    console.error(
      'Error loading WASM module:',
      error instanceof Error ? error.message : String(error)
    )

    return null
  }
}

/**
 * Gets or initializes the WebAssembly instance
 * @returns The initialized WebAssembly instance
 */
export const getWasmModule = async (): Promise<MainModule | null> => {
  if (!wasmInstance) {
    
    wasmInstance = await loadWasm()
  }

  return wasmInstance
}