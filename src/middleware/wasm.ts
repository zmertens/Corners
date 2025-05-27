import { Request, Response, NextFunction } from 'express'
import { getWasmInstance } from '../services/mazeService'
import { AuthRequest } from '../types'

/**
 * Middleware that attaches the WASM instance to the request object
 * This ensures the WASM instance is available for all routes that need it
 */
export const wasmMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get or initialize WASM instance
    const wasmInstance = await getWasmInstance()

    if (!wasmInstance) {
      console.warn('WASM middleware: Failed to load WASM module')
    }

    // Attach the instance to the request object
    req.wasmInstance = wasmInstance === null ? undefined : wasmInstance

    next()
  } catch (error) {
    console.error('WASM middleware error:', error)
    // Continue even if WASM fails to load
    next()
  }
}
