import { Application } from 'express'
import { authenticate } from '../middleware/auth'
import * as authController from '../controllers/authController'
import * as mazeController from '../controllers/mazeController'

const setNavigations = (app: Application) => {
  // Base route
  app.get('/', (req, res) => {
    res.send('** Corners ** Login/Auth services!')
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
  // Maze routes - these need to come before more generic user/:id routes to avoid conflicts
  app.get('/api/user/mazes', authenticate as any, mazeController.getUserMazes)
  app.post('/api/user/maze', authenticate as any, mazeController.createMaze)
  app.get('/api/user/maze/:id', authenticate as any, mazeController.getMazeById)
  app.put('/api/user/maze/:id', authenticate as any, mazeController.updateMaze)
  app.delete(
    '/api/user/maze/:id',
    authenticate as any,
    mazeController.deleteMaze
  )

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
