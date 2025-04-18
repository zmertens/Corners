import express from 'express';
import connectDatabase from '../config/database';
import setNavigations from '../routes/navigations';
import { loadWasm } from '../services/wasmLoader';

// Mock dependencies
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    listen: jest.fn().mockImplementation((port, callback) => {
      callback && callback();
      return { on: jest.fn() };
    })
  };
  
  const mockExpress = jest.fn(() => mockApp);
  
  // Add middleware mocks
  mockExpress.json = jest.fn(() => 'json-middleware');
  mockExpress.urlencoded = jest.fn(() => 'urlencoded-middleware');
  
  return mockExpress;
});

jest.mock('../config/database');
jest.mock('../routes/navigations');
jest.mock('../services/wasmLoader');

describe('App Initialization', () => {
  let mockExpressApp: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Set up console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Get reference to mock express app
    mockExpressApp = (express as unknown as jest.Mock<any, any>)();
    
    // Mock loadWasm successful response
    const mockWasmInstance = {
      stringify_from_dimens: jest.fn().mockImplementation((r, c) => `Mock maze ${r}x${c}`)
    };
    (loadWasm as jest.Mock).mockResolvedValue(mockWasmInstance);
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should initialize the express app correctly', async () => {
    // Import the app to trigger initialization
    jest.isolateModules(() => {
      require('../app');
    });
    
    // Verify express middleware setup
    expect(express.json).toHaveBeenCalled();
    expect(express.urlencoded).toHaveBeenCalledWith({ extended: true });
    expect(mockExpressApp.use).toHaveBeenCalledWith('json-middleware');
    expect(mockExpressApp.use).toHaveBeenCalledWith('urlencoded-middleware');
    
    // Verify database connection
    expect(connectDatabase).toHaveBeenCalled();
    
    // Verify routes setup
    expect(setNavigations).toHaveBeenCalledWith(mockExpressApp);
    
    // Verify server startup
    expect(mockExpressApp.listen).toHaveBeenCalledWith(
      expect.any(Number), 
      expect.any(Function)
    );
  });
  
  it('should handle WASM loading success', async () => {
    // Import the app
    jest.isolateModules(() => {
      require('../app');
    });
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify WASM loading logs
    expect(loadWasm).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('WASM instance loaded');
    expect(consoleLogSpy).toHaveBeenCalledWith('WASM instance is ready');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mock maze'));
  });
  
  it('should handle WASM loading failure', async () => {
    // Mock WASM loading failure
    (loadWasm as jest.Mock).mockResolvedValue(null);
    
    // Import the app
    jest.isolateModules(() => {
      require('../app');
    });
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify error logging
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load WASM instance');
  });
  
  it('should handle WASM loading exception', async () => {
    // Mock WASM loading exception
    const mockError = new Error('WASM loading error');
    (loadWasm as jest.Mock).mockRejectedValue(mockError);
    
    // Import the app
    jest.isolateModules(() => {
      require('../app');
    });
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify error logging
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading WASM instance:',
      mockError
    );
  });
});