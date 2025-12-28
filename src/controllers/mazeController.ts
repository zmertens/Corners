import { Request, Response } from 'express'
import { MazeModel, Maze } from '../models/maze'
import { AuthRequest } from '../types/index'
import { UserDocument } from '../models/user'
import { ScoreModel } from '../models/score'
import { getWasmModule, isWasmReady } from '../services/wasmLoader'

/**
 * Retrieves all mazes belonging to the authenticated user
 */
export const getUserMazes = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const user = req.user as UserDocument
    const mazes = await MazeModel.find({ user: user._id }).sort({
      createdAt: -1,
    })

    res.json({
      count: mazes.length,
      mazes: mazes.map((maze) => ({
        id: maze.id,
        rows: maze.rows,
        columns: maze.columns,
        distances: maze.distances,
        algorithm: maze.algorithm,
        createdAt: maze.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get user mazes error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Retrieves a specific maze by ID
 */
export const getMazeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const mazeId = req.params.id

    if (!mazeId) {
      res.status(400).json({ message: 'Maze ID is required' })
      return
    }

    const maze = await MazeModel.findOne({ id: mazeId })

    if (!maze) {
      res.status(404).json({ message: 'Maze not found' })
      return
    }

    res.json({
      id: maze.id,
      data: maze.data,
      rows: maze.rows,
      columns: maze.columns,
      distances: maze.distances,
      algorithm: maze.algorithm,
      createdAt: maze.createdAt,
    })
  } catch (error) {
    console.error('Get maze error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Updates an existing maze
 */
export const updateMaze = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const user = req.user as UserDocument
    const mazeId = req.params.id

    if (!mazeId) {
      res.status(400).json({ message: 'Maze ID is required' })
      return
    }

    const maze = await MazeModel.findOne({ id: mazeId })

    if (!maze) {
      res.status(404).json({ message: 'Maze not found' })
      return
    }

    // Check if the user owns the maze
    if (maze.user.toString() !== user._id.toString()) {
      res.status(403).json({
        message: 'Not authorized to update this maze',
      })
      return
    }

    // Update maze fields
    const { rows, columns, algorithm, data } = req.body

    const updates: Partial<Maze> = {}

    if (rows !== undefined) updates.rows = parseInt(rows, 10)
    if (columns !== undefined) updates.columns = parseInt(columns, 10)
    if (algorithm !== undefined) updates.algorithm = algorithm
    if (data !== undefined) updates.data = data

    // Apply updates
    Object.assign(maze, updates)
    await maze.save()

    res.json({
      message: 'Maze updated successfully',
      maze: {
        id: maze.id,
        data: maze.data,
        rows: maze.rows,
        columns: maze.columns,
        distances: maze.distances,
        algorithm: maze.algorithm,
        updatedAt: maze.updatedAt,
      },
    })
  } catch (error) {
    console.error('Update maze error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Deletes a maze by ID
 */
export const deleteMaze = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const user = req.user as UserDocument
    const mazeId = req.params.id

    if (!mazeId) {
      res.status(400).json({ message: 'Maze ID is required' })
      return
    }

    const maze = await MazeModel.findOne({ id: mazeId })

    if (!maze) {
      res.status(404).json({ message: 'Maze not found' })
      return
    }

    // Check if the user owns the maze
    if (maze.user.toString() !== user._id.toString()) {
      res.status(403).json({
        message: 'Not authorized to delete this maze',
      })
      return
    }

    await maze.deleteOne()

    res.json({
      message: 'Maze deleted successfully',
      id: mazeId,
    })
  } catch (error) {
    console.error('Delete maze error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Interface for maze configuration
interface MazeConfig {
  algo?: string
  seed?: number
  rows: number
  columns: number
  distances?: string
}

// Interface for maze result
interface MazeResult {
  data: string
  createdAt: string
  version_str: string
  config: MazeConfig
  error?: string
}

/**
 * Helper function to generate a single maze from configuration
 * Uses the pre-loaded WASM module for efficiency
 */
const generateSingleMaze = async (
  config: MazeConfig,
  wasmModule?: any
): Promise<MazeResult> => {
  const { algo = 'binary_tree', seed, rows, columns, distances = '' } = config

  // Validate numeric inputs
  const numRows = parseInt(rows as any, 10)
  const numColumns = parseInt(columns as any, 10)
  const numSeed = seed ? parseInt(seed as any, 10) : undefined

  if (isNaN(numRows) || isNaN(numColumns) || numRows <= 0 || numColumns <= 0) {
    return {
      data: '',
      createdAt: new Date().toISOString(),
      version_str: '',
      config,
      error: 'rows and columns must be positive integers',
    }
  }

  try {
    let mazeData: string | undefined
    let mazeBuilderCliVersion: string | undefined

    // Use the provided WASM module or get the global one
    const moduleToUse = wasmModule || getWasmModule()

    if (!moduleToUse || !isWasmReady()) {
      return {
        data: '',
        createdAt: new Date().toISOString(),
        version_str: '',
        config,
        error: 'WASM module not available',
      }
    }

    // Use WASM module for maze generation
    if (moduleToUse.StringVector && moduleToUse.get) {
      const sv = new moduleToUse.StringVector()
      sv.push_back('-r')
      sv.push_back(numRows.toString())
      sv.push_back('-c')
      sv.push_back(numColumns.toString())

      sv.push_back('-a')
      sv.push_back(algo)

      if (numSeed !== undefined) {
        sv.push_back('-s')
        sv.push_back(numSeed.toString())
      }

      if (distances !== '') {
        console.log(`Adding distances parameter: ${distances}`)
        sv.push_back('-d')
        sv.push_back(distances)
      }

      const cliInstance = moduleToUse.get()

      if (cliInstance && cliInstance.convert_as_base64) {
        try {
          mazeData = cliInstance.convert_as_base64(sv)
          mazeBuilderCliVersion = cliInstance.version
            ? cliInstance.version()
            : 'unknown version'
        } catch (conversionError) {
          console.error('WASM conversion error:', conversionError)
        }
      }

      // Clean up
      sv.delete()
    }

    if (!mazeData) {
      return {
        data: '',
        createdAt: new Date().toISOString(),
        version_str: '',
        config,
        error: `Failed to generate maze with algorithm '${algo}' - WASM module issue`,
      }
    }

    return {
      data: mazeData,
      createdAt: new Date().toISOString(),
      version_str: mazeBuilderCliVersion || 'unknown',
      config,
    }
  } catch (wasmError) {
    console.error('WASM maze generation error:', wasmError)
    return {
      data: '',
      createdAt: new Date().toISOString(),
      version_str: '',
      config,
      error: 'Failed to generate maze',
    }
  }
}

/**
 * Creates maze(s) using the new API format - accepts single object or array of objects
 * Returns data as base64 string(s) with timestamp and version
 */
export const createMazeAPI = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const requestBody = req.body

    // Check if request body is an array or single object
    const isArray = Array.isArray(requestBody)
    const mazeConfigs: MazeConfig[] = isArray ? requestBody : [requestBody]

    // Validate that we have at least one configuration
    if (mazeConfigs.length === 0) {
      res.status(400).json({
        error: 'Request body cannot be empty',
      })
      return
    }

    // Validate each configuration has required parameters
    for (let i = 0; i < mazeConfigs.length; i++) {
      const config = mazeConfigs[i]
      if (!config.rows || !config.columns) {
        res.status(400).json({
          error: `Missing required parameters (rows and columns) in configuration ${i + 1}`,
        })
        return
      }
    }

    // Check WASM module availability - use global module or fallback to request module
    const wasmModule = getWasmModule() || req.wasmModule

    if (!wasmModule || (!isWasmReady() && !req.wasmModule)) {
      console.warn('WASM module not available')
      const errorResponse = isArray
        ? mazeConfigs.map((config) => ({
            data: '',
            createdAt: new Date().toISOString(),
            version_str: '',
            config,
            error: 'WASM module not available',
          }))
        : {
            data: '',
            createdAt: new Date().toISOString(),
            version_str: '',
            config: mazeConfigs[0],
            error: 'WASM module not available',
          }

      res.status(500).json(errorResponse)
      return
    }

    // Generate mazes for all configurations
    const results: MazeResult[] = []
    for (const config of mazeConfigs) {
      const result = await generateSingleMaze(config, wasmModule)
      results.push(result)
    }

    // Check if any generation failed
    const hasErrors = results.some((result) => result.error)
    if (hasErrors) {
      // Return results with errors marked
      const response = isArray ? results : results[0]
      res.status(207).json(response)
      return
    }

    // Return successful results
    const response = isArray ? results : results[0]
    res.status(201).json(response)
  } catch (error) {
    console.error('Create maze API error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}

/**
 * Get maze scores with optional query parameters
 * Query parameters:
 * - limit: number (optional, default: 20, max: 100)
 * Public endpoint - does not require authentication
 */
export const getMazeScores = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    const scores = await ScoreModel.find({})
      .limit(limit)
      .sort({ score: -1, createdAt: -1 }) // Order by highest score first, then most recent
      .select('score maze goal aliases createdAt')

    const responseData = scores.map((score) => ({
      score: score.score,
      maze: score.maze, // base64 string
      goal: score.goal, // { start: string, steps: number }
      aliases: score.aliases, // list of strings
      createdAt: score.createdAt,
    }))

    res.json({
      count: responseData.length,
      scores: responseData,
    })
  } catch (error) {
    console.error('Get maze scores error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Returns help information for both WASM module and Corners app
 */
export const getHelp = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    let mazeBuilderHelp = 'WASM module help not available'

    // Get help string from the global WASM module first, then fallback to request module
    const wasmModule = getWasmModule() || req.wasmModule

    if (wasmModule && isWasmReady()) {
      try {
        const cliInstance = wasmModule.get()

        if (cliInstance && cliInstance.help) {
          mazeBuilderHelp = cliInstance.help()
        }
      } catch (wasmError) {
        console.error('Error getting WASM help:', wasmError)
      }
    } else {
      console.warn('WASM module not available for help')
    }

    // Get package info
    const packageInfo = require('../../package.json')
    const cornersInfo = `${packageInfo.name} v${packageInfo.version} - ${packageInfo.description}`

    res.json({
      maze_builder_help: mazeBuilderHelp,
      corners_info: cornersInfo,
    })
  } catch (error) {
    console.error('Get help error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}
