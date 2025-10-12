import express, { Application } from 'express'
import request from 'supertest'
import setNavigations from '../../routes/navigations'

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
    // Set up navigations on the app
    setNavigations(app)
  })

  it('should return the correct message for the root path', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.text).toBe('** Corners ** Login/Auth services!')
  })

  // Additional tests can be added here as more routes are implemented
})
