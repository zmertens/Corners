import { loadWasm } from './wasmLoader'
import { cli } from '../../public/mazebuilder'
import { WasmModuleInstance } from '../types'

// Singleton pattern for WASM instance
let wasmInstance: cli | null = null

/**
 * Gets or initializes the WebAssembly instance
 * @returns The initialized WebAssembly instance
 */
export const getWasmInstance = async (): Promise<cli | null> => {
  if (!wasmInstance) {
    wasmInstance = await loadWasm()
  }
  return wasmInstance
}

/**
 * Generates a maze using the WebAssembly module
 * @param rows Number of rows in the maze
 * @param columns Number of columns in the maze
 * @param algorithm Optional algorithm name (currently unused in WASM)
 * @returns A string representation of the generated maze
 * @throws Error if WASM module fails to load
 */
export const generateMaze = async (
  rows: number,
  columns: number,
  algorithm: string = 'recursive-backtracker'
): Promise<string> => {
  const instance = await getWasmInstance()

  if (!instance) {
    throw new Error('Failed to load WASM module')
  }

  try {
    // Ensure positive dimensions
    const validRows = Math.max(1, Math.floor(rows))
    const validColumns = Math.max(1, Math.floor(columns))

    // Call the WASM function to generate the maze
    return instance.stringify_from_dimens(validRows, validColumns)
  } catch (error) {
    throw new Error(
      `Maze generation failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Parse a maze string into a 2D array
 * @param mazeString String representation of the maze
 * @returns 2D array representation of the maze
 */
export const parseMaze = (mazeString: string): string[][] => {
  if (!mazeString) return []
  return mazeString.split('\n').map((row) => row.split(''))
}

/**
 * Convert a maze from 2D array back to string
 * @param maze 2D array representation of the maze
 * @returns String representation of the maze
 */
export const stringifyMaze = (maze: string[][]): string => {
  if (!maze || !maze.length) return ''
  return maze.map((row) => row.join('')).join('\n')
}
