import { Request, Response } from 'express'
import { MazeModel, Maze } from '../models/maze'
import { generateMaze } from '../services/mazeService'
import { AuthRequest } from '../types/index'
import { StringVector } from '../../public/mazebuildercli'
import { UserDocument } from '../models/user'

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

/**
 * Creates a maze using the new API format - accepts algo, seed, rows, columns
 * Returns data as base64 string with timestamp and version
 */
export const createMazeAPI = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const { algo = 'binary_tree', seed, rows, columns } = req.body

    if (!rows || !columns) {
      res.status(400).json({
        error: 'Missing required parameters: rows and columns',
      })
      return
    }

    // Validate numeric inputs
    const numRows = parseInt(rows as string, 10)
    const numColumns = parseInt(columns as string, 10)
    const numSeed = seed ? parseInt(seed as string, 10) : undefined

    if (isNaN(numRows) || isNaN(numColumns) || numRows <= 0 || numColumns <= 0) {
      res.status(400).json({
        error: 'rows and columns must be positive integers',
      })
      return
    }

    try {
      let mazeData: string | undefined

      // Use WASM module if available on request object
      if ((req as any).wasmModule) {
        const wasmModule = (req as any).wasmModule
        const sv = new wasmModule.StringVector()
        sv.push_back('-r')
        sv.push_back(numRows.toString())
        sv.push_back('-c')
        sv.push_back(numColumns.toString())
        
        // Add algorithm parameter if supported by WASM
        if (algo) {
          sv.push_back('-a')
          sv.push_back(algo)
        }
        
        // Add seed parameter if provided
        if (numSeed !== undefined) {
          sv.push_back('-s')
          sv.push_back(numSeed.toString())
        }
        
        mazeData = wasmModule.get()?.convert(sv)
      } else {
        // Fall back to service
        mazeData = await generateMaze(numRows, numColumns, algo)
      }

      if (!mazeData) {
        res.status(500).json({ error: 'Failed to generate maze data' })
        return
      }

      // Convert maze data to base64
      const base64Data = Buffer.from(mazeData).toString('base64')

      // Get package version for version_str
      const packageJson = require('../../package.json')
      const versionStr = packageJson.version || '1.0.0'

      res.status(201).json({
        data: base64Data,
        createdAt: new Date().toISOString(),
        version_str: versionStr,
      })
    } catch (wasmError) {
      console.error('WASM maze generation error:', wasmError)
      res.status(500).json({ error: 'Failed to generate maze' })
    }
  } catch (error) {
    console.error('Create maze API error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}
