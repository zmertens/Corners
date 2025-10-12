import { Application } from 'express'
import { authenticate } from '../middleware/auth'
import * as authController from '../controllers/authController'
import * as mazeController from '../controllers/mazeController'

const setNavigations = (app: Application) => {
  // Base route
  app.get('/', (req, res) => {
    res.send('** Corners ** Login/Auth services!')
  })

  // Test route to check WASM middleware
  app.get('/api/test-wasm', (req: any, res) => {
    const hasWasm = !!req.wasmModule
    res.json({
      hasWasmModule: hasWasm,
      wasmModuleKeys: req.wasmModule ? Object.keys(req.wasmModule) : [],
      message: hasWasm ? 'WASM module available' : 'WASM module not available'
    })
  })

  // Auth routes
  app.post('/api/auth/login', (req, res, next) => {
    Promise.resolve(authController.login(req, res)).catch(next)
  })

  app.post('/api/auth/logout', authController.logout)

  app.post('/api/auth/register', (req, res, next) => {
    Promise.resolve(authController.register(req, res)).catch(next)
  })

  app.post('/api/auth/forgot-password', (req, res, next) => {
    Promise.resolve(authController.forgotPassword(req, res)).catch(next)
  })

  app.post('/api/auth/reset-password', (req, res, next) => {
    Promise.resolve(authController.resetPassword(req, res)).catch(next)
  })

  // API endpoint for maze creation (public endpoint)
  app.post('/api/mazes/create', (req, res, next) => {
    Promise.resolve(mazeController.createMazeAPI(req, res)).catch(next)
  })

  app.put('/api/mazes/create', (req, res, next) => {
    Promise.resolve(mazeController.createMazeAPI(req, res)).catch(next)
  })

  // User routes
  app.get('/api/users', authenticate as any, authController.getAllUsers)
  app.get('/api/user/:id', authenticate as any, (req, res, next) => {
    Promise.resolve(authController.getUserById(req, res)).catch(next)
  })

  app.delete('/api/user/:id', authenticate as any, (req, res, next) => {
    Promise.resolve(authController.deleteUser(req, res)).catch(next)
  })
}

export default setNavigations
