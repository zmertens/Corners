import { Application } from 'express'
import { authenticate } from '../middleware/auth'
import * as authController from '../controllers/authController'
import * as mazeController from '../controllers/mazeController'
import * as aliasController from '../controllers/aliasController'
import * as scoreController from '../controllers/scoreController'
import * as networkController from '../controllers/networkController'

const setNavigations = (app: Application) => {
  // Base route
  app.get('/', (req, res) => {
    res.send('** Corners ** Maze building services!')
  })

  // Help route
  app.get('/api/help', (req, res, next) => {
    Promise.resolve(mazeController.getHelp(req, res)).catch(next)
  })

  // Auth routes
  app.post('/api/auth/login', (req, res, next) => {
    Promise.resolve(authController.login(req, res)).catch(next)
  })

  app.post('/api/auth/logout', authController.logout)

  app.post('/api/auth/register', (req, res, next) => {
    Promise.resolve(authController.register(req, res)).catch(next)
  })

  // Alias routes (require authentication)
  app.get('/api/auth/aliases', authenticate as any, (req, res, next) => {
    Promise.resolve(aliasController.getAliases(req, res)).catch(next)
  })

  app.post('/api/auth/aliases', authenticate as any, (req, res, next) => {
    Promise.resolve(aliasController.createAlias(req, res)).catch(next)
  })

  app.put('/api/auth/aliases/:id', authenticate as any, (req, res, next) => {
    Promise.resolve(aliasController.updateAlias(req, res)).catch(next)
  })

  app.delete('/api/auth/aliases/:id', authenticate as any, (req, res, next) => {
    Promise.resolve(aliasController.deleteAlias(req, res)).catch(next)
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

  // Maze scores routes (public endpoint)
  app.get('/api/mazes/scores', (req, res, next) => {
    Promise.resolve(mazeController.getMazeScores(req, res)).catch(next)
  })

  // Network discovery routes
  app.get('/mazes/networks/data', (req, res, next) => {
    Promise.resolve(networkController.getNetworkData(req, res)).catch(next)
  })

  app.post('/mazes/networks/data', (req, res, next) => {
    Promise.resolve(networkController.registerNetworkPlayer(req, res)).catch(
      next
    )
  })

  app.get('/api/mazes/networks/data', (req, res, next) => {
    Promise.resolve(networkController.getNetworkData(req, res)).catch(next)
  })

  app.post('/api/mazes/networks/data', (req, res, next) => {
    Promise.resolve(networkController.registerNetworkPlayer(req, res)).catch(
      next
    )
  })

  // Score management routes
  app.post('/api/mazes/scores', (req, res, next) => {
    Promise.resolve(scoreController.createScore(req, res)).catch(next)
  })

  app.put('/api/mazes/scores/:id', authenticate as any, (req, res, next) => {
    Promise.resolve(scoreController.updateScore(req, res)).catch(next)
  })

  app.get('/api/user/scores', authenticate as any, (req, res, next) => {
    Promise.resolve(scoreController.getUserScores(req, res)).catch(next)
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
