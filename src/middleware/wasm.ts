import { Request, Response, NextFunction } from 'express'
import { getWasmModule, isWasmReady } from '../services/wasmLoader'
import { AuthRequest } from '../types'

/**
 * Middleware that attaches the pre-loaded WASM instance to the request object
 * This middleware is lightweight since the WASM module is already loaded during startup
 */
export const wasmMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get the already-loaded WASM instance (no async loading here)
    const mod = getWasmModule()

    if (!mod || !isWasmReady()) {
      // Only log warning if WASM is expected but not available
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️ WASM module not available for request')
      }
      req.wasmModule = undefined
    } else {
      // Silently attach the WASM module - no verbose logging
      req.wasmModule = mod
    }

    next()
  } catch (error) {
    console.error('WASM middleware error:', error)
    req.wasmModule = undefined
    // Continue even if WASM fails
    next()
  }
}
