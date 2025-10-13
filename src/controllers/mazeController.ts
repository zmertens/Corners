import { Request, Response } from 'express'
import { MazeModel, Maze } from '../models/maze'
import { AuthRequest } from '../types/index'
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
  req: AuthRequest,
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
      let mazeBuilderCliVersion: string | undefined

      // Use WASM module if available on request object
      if (req.wasmModule) {
        const wasmModule = req.wasmModule
        
        // Check if the module has the expected structure
        if (wasmModule.StringVector && wasmModule.get) {
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
          
          const cliInstance = wasmModule.get()
          if (cliInstance && cliInstance.convert_as_base64) {
            mazeData = cliInstance.convert_as_base64(sv)
            mazeBuilderCliVersion = cliInstance.version ? cliInstance.version() : "unknown version"
          }
          
          // Clean up
          sv.delete()
        } else {
          console.warn('WASM module missing expected methods (StringVector or get)')
        }
      } else {
        console.warn('WASM module not available on request object')
      }      if (!mazeData) {

        console.error('Failed to generate maze data - WASM module issue')

        res.status(500).json({ error: 'Failed to generate maze data' })

        return
      }

      res.status(201).json({
        data: mazeData,
        createdAt: new Date().toISOString(),
        version_str: mazeBuilderCliVersion,
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

/**
 * Returns help information for both WASM module and Corners app
 */
export const getHelp = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    let mazeBuilderHelp = 'WASM module help not available'
    
    // Get help string from WASM module
    if (req.wasmModule) {
      try {
        const wasmModule = req.wasmModule
        const cliInstance = wasmModule.get()
        
        if (cliInstance && cliInstance.help) {
          mazeBuilderHelp = cliInstance.help()
        }
      } catch (wasmError) {
        console.error('Error getting WASM help:', wasmError)
      }
    } else {
      console.warn('WASM module not available on request object')
    }
    
    // Get package info
    const packageInfo = require('../../package.json')
    const cornersInfo = `${packageInfo.name} v${packageInfo.version} - ${packageInfo.description}`
    
    res.json({
      maze_builder_help: mazeBuilderHelp,
      corners_info: cornersInfo
    })
  } catch (error) {
    console.error('Get help error:', error)
    res.status(500).json({ error: 'Server error' })
  }
}
