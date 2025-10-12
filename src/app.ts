import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDatabase from './config/database'
import setNavigations from './routes/navigations'
import { getWasmModule } from './services/mazeService'
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

// Set up routes first
setNavigations(app)

// Apply WASM middleware
app.use(wasmMiddleware)

// Pre-initialize WASM module
getWasmModule()
  .then((module) => {
    if (module) {
      console.log('WASM module loaded successfully')
      console.log('Available methods:', Object.keys(module))
      console.log('StringVector available:', typeof module.StringVector)
      console.log('get method available:', typeof module.get)

      try {
        const cliPointer = module.get()
        
        if (cliPointer) {
          console.log('WASM CLI instance retrieved successfully')
          console.log('CLI methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(cliPointer)))

          // Test maze generation
          const r = 10
          const c = 10
          try {
            const params = new module.StringVector()
            params.push_back('-r')
            params.push_back(`${r}`)
            params.push_back('-c')
            params.push_back(`${c}`)
            const testMaze = cliPointer.convert_as_base64(params)
            console.log(`Test maze generation successful: ${r}x${c} maze created`)
            const testMazeDecoded = Buffer.from(testMaze, 'base64').toString('utf8')
            console.log('Test maze preview:', testMazeDecoded.substring(0, 100) + '...')

            params.delete()

            // Create a new StringVector for help command
            const helpParams = new module.StringVector()
            helpParams.push_back('-h')
            const helpMessage = cliPointer.convert(helpParams)
            console.log('Help message from WASM module:')
            console.log(helpMessage)
            helpParams.delete()
          } catch (error) {
            console.error('Test maze generation failed:', error)
          }
        } else {
          console.error('Failed to get CLI instance from WASM module')
        }
      } catch (error) {
        console.error('Error getting CLI instance:', error)
      }
    } else {
      console.error('WASM module is null')
    }
  })
  .catch((error) => {
    console.error('Error initializing WASM module:', error)
  })

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
  console.log('Available endpoints:')
  console.log('  POST/PUT /api/mazes/create - Create new maze')
  console.log('  POST /api/auth/login - User login') 
  console.log('  POST /api/auth/register - User registration')
  console.log('  GET / - Base route')
  
  // Log registered routes after server is fully started
  console.log('\nRegistered routes:')
  if (app._router && app._router.stack) {
    app._router.stack.forEach((r: any) => {
      if (r.route && r.route.path) {
        console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`)
      }
    })
  } else {
    console.log('  No routes registered or router not initialized')
  }
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})

export default app
