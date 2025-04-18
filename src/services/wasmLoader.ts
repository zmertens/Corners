import Module from "../../public/mazebuilder.js";

export async function loadWasm(): Promise<any | null> {
  try {
    const activeModule = await Module();
    if (activeModule) {
      const ptr = activeModule.get();
      if (ptr) {
        console.log("WASM module loaded successfully");
        return ptr as any;
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
