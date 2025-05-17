import Module, { cli, MainModule } from "../../public/mazebuilder.js";

/**
 * Loads the WebAssembly module and returns the CLI interface
 * 
 * @returns Promise that resolves to the CLI interface or null if loading fails
 */
export async function loadWasm(): Promise<cli | null> {
  try {
    // Initialize the module
    const activeModule: MainModule = await Module();
    
    // Validate module initialization
    if (!activeModule) {
      console.error("Failed to initialize WASM module");
      return null;
    }
    
    // Get the CLI pointer from the module
    const ptr = activeModule.get();
    if (!ptr) {
      console.error("Failed to get pointer from WASM module");
      return null;
    }
    
    console.log("WASM module loaded successfully");
    return ptr;
  } catch (error) {
    console.error("Error loading WASM module:", error instanceof Error ? error.message : String(error));
    return null;
  }
}
