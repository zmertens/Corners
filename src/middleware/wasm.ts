import { Request, Response, NextFunction } from 'express'
import { getWasmModule } from '../services/wasmLoader'
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
    const mod = await getWasmModule()

    if (!mod) {

      console.warn('WASM middleware: Failed to load WASM module')
    }

    // Attach the instance to the request object
    req.wasmModule = mod === null ? undefined : mod

    next()
  } catch (error) {
    
    console.error('WASM middleware error:', error)
    // Continue even if WASM fails to load
    next()
  }
}
