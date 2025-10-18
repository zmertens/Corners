import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDatabase from './config/database'
import setNavigations from './routes/navigations'
import { initializeWasm, getWasmModule, isWasmReady } from './services/wasmLoader'
import { wasmMiddleware } from './middleware/wasm'
import path from 'path'

// Load environment variables from .env file
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Basic middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')))

// Connect to database
connectDatabase()

// Apply WASM middleware BEFORE routes (lightweight now)
app.use(wasmMiddleware)

// Set up routes after middleware but before server start
setNavigations(app)

// Initialize WASM module once during startup
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing application components...')
    
    // Initialize WASM module
    await initializeWasm()
    
    if (isWasmReady()) {
      console.log('✅ WASM module initialization complete')
      
      // Optional: Test the WASM functionality
      const module = getWasmModule()
      if (module) {
        try {
          const cliInstance = module.get()
          if (cliInstance) {
            // Quick test
            const params = new module.StringVector()
            params.push_back('-r')
            params.push_back('5')
            params.push_back('-c')
            params.push_back('5')
            const testMaze = cliInstance.convert(params)
            console.log(testMaze)
            params.delete()
          }
        } catch (testError) {
          console.warn('⚠️ WASM functionality test failed:', testError)
        }
      }
    } else {
      console.warn('⚠️ WASM module failed to initialize - maze generation will not be available')
    }
    
  } catch (error) {
    console.error('❌ Error during app initialization:', error)
    throw error
  }
}

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
  }
)

// 404 handler
app.use((_req: express.Request, res: express.Response) => {
  
  res.status(404).json({ message: 'Route not found' })
})

// Start server function
const startServer = async () => {
  try {
    // Initialize app components first
    await initializeApp()
    
    // Start the server
    const server = app.listen(PORT, () => {

      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    })
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {

      console.log('SIGTERM received. Shutting down gracefully')

      server.close(() => {

        console.log('Process terminated')
      })
    })
    
    return server
    
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the application
startServer()

export default app
