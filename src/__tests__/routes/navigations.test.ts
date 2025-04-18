import express, { Application } from 'express';
import request from 'supertest';
import setNavigations from '../../routes/navigations';

describe('Navigation Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create a fresh Express application for each test
    app = express();
    // Set up navigations on the app
    setNavigations(app);
  });

  it('should return "Hello World!" for the root path', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
  });
  
  // Additional tests can be added here as more routes are implemented
});