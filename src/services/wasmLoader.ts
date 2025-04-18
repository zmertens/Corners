import Module, { cli, MainModule } from "../../public/mazebuilder.js";

export async function loadWasm(): Promise<cli | null> {
  try {
    const activeModule: MainModule = await Module();
    if (activeModule) {
      const ptr = activeModule.get();
      if (ptr) {
        console.log("WASM module loaded successfully");
        return ptr;
      } else {
        console.error("Failed to get pointer from WASM module");
      }
    } else {
      console.error("Failed to initialize WASM module");
    }
  } catch (error) {
    console.error("Error loading WASM module:", error);
  }
  return null;
}
