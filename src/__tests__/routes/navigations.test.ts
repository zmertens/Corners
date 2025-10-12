import express, { Application } from 'express'
import request from 'supertest'
import setNavigations from '../../routes/navigations'

// Mock the controllers
jest.mock('../../controllers/mazeController', () => ({
  createMazeAPI: jest.fn((req, res) => {
    res.status(201).json({
      data: 'bW9jayBtYXplIGRhdGE=', // "mock maze data" in base64
      createdAt: '2025-10-12T00:00:00.000Z',
      version_str: '1.0.0',
    })
  }),
}))

jest.mock('../../controllers/authController', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  deleteUser: jest.fn(),
}))

jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => next()),
}))

// Mock mongoose before importing any modules that use it
jest.mock('mongoose', () => {
  function MockSchema(this: any, definition: any, options?: any) {
    this.methods = {}
    this.pre = jest.fn()
    this.post = jest.fn()
  }

  // Add Types as a static property
  MockSchema.Types = {
    ObjectId: jest.fn(),
  }

  return {
    Schema: MockSchema,
    model: jest.fn(),
    connect: jest.fn(),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
    },
    Types: {
      ObjectId: jest.fn(),
    },
  }
})

describe('Navigation Routes', () => {
  let app: Application

  beforeEach(() => {
    // Create a fresh Express application for each test
    app = express()
    app.use(express.json()) // Add JSON middleware for POST requests
    // Set up navigations on the app
    setNavigations(app)
  })

  it('should return the correct message for the root path', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.text).toBe('** Corners ** Maze building services!')
  })

  it('should handle POST to /api/mazes/create', async () => {
    const payload = {
      algo: 'binary_tree',
      seed: 10,
      rows: 100,
      columns: 100,
    }

    const response = await request(app)
      .post('/api/mazes/create')
      .send(payload)

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('createdAt')
    expect(response.body).toHaveProperty('version_str')
  })

  it('should handle PUT to /api/mazes/create', async () => {
    const payload = {
      algo: 'recursive_backtracker',
      seed: 42,
      rows: 50,
      columns: 50,
    }

    const response = await request(app)
      .put('/api/mazes/create')
      .send(payload)

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('createdAt')
    expect(response.body).toHaveProperty('version_str')
  })

  // Additional tests can be added here as more routes are implemented
})
