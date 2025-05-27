import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDatabase from './config/database'
import setNavigations from './routes/navigations'
import { getWasmInstance } from './services/mazeService'
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

// Pre-initialize WASM module
getWasmInstance()
  .then((instance) => {
    if (instance) {
      console.log('WASM module initialized successfully')

      // Test maze generation
      const r = 10
      const c = 10
      try {
        const testMaze = instance.stringify_from_dimens(r, c)
        console.log(`Test maze generation successful: ${r}x${c} maze created`)
        console.log(testMaze)
      } catch (error) {
        console.error('Test maze generation failed:', error)
      }
    } else {
      console.error('Failed to initialize WASM module')
    }
  })
  .catch((error) => {
    console.error('Error initializing WASM module:', error)
  })

// Apply WASM middleware
app.use(wasmMiddleware)

// Set up routes
setNavigations(app)

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

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})

export default app
