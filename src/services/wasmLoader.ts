export async function loadWasm(): Promise<any> {
    const response = await fetch('/wasm/maze.wasm');
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.instantiate(buffer);
    return module.instance.exports;
}