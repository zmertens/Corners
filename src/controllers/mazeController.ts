import { Request, Response } from "express";
import { MazeModel, Maze } from "../models/maze";
import { generateMaze } from "../services/mazeService";
import { AuthRequest } from "../types";
import { UserDocument } from "../models/user";

/**
 * Creates a new maze using the WASM generator
 */
export const createMaze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { rows, columns, algorithm = "recursive-backtracker" } = req.body;
    
    if (!rows || !columns) {
      res.status(400).json({ message: "Missing required parameters: rows and columns" });
      return;
    }
    
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    
    try {
      let mazeData: string;
      
      // Try using WASM instance from request if available (faster)
      if (req.wasmInstance) {
        mazeData = req.wasmInstance.stringify_from_dimens(
          parseInt(rows, 10),
          parseInt(columns, 10)
        );
      } else {
        // Fall back to service if not available
        mazeData = await generateMaze(
          parseInt(rows, 10), 
          parseInt(columns, 10), 
          algorithm
        );
      }
      
      // Create a unique ID for the maze
      const id = `maze_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const user = req.user as UserDocument;
      
      // Create maze document in database
      const newMaze = await MazeModel.create({
        id,
        data: mazeData,
        rows: parseInt(rows, 10),
        columns: parseInt(columns, 10),
        algorithm,
        user: user._id,
      });
      
      res.status(201).json({
        message: "Maze created successfully",
        maze: {
          id: newMaze.id,
          data: newMaze.data,
          rows: newMaze.rows,
          columns: newMaze.columns,
          algorithm: newMaze.algorithm,
        },
      });
    } catch (wasmError) {
      console.error("WASM maze generation error:", wasmError);
      res.status(500).json({ message: "Failed to generate maze" });
    }  } catch (error) {
    console.error("Create maze error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Retrieves all mazes belonging to the authenticated user
 */
export const getUserMazes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    
    const user = req.user as UserDocument;
    const mazes = await MazeModel.find({ user: user._id }).sort({ createdAt: -1 });
    
    res.json({
      count: mazes.length,
      mazes: mazes.map(maze => ({
        id: maze.id,
        rows: maze.rows,
        columns: maze.columns,
        algorithm: maze.algorithm,
        createdAt: maze.createdAt
      }))
    });
  } catch (error) {
    console.error("Get user mazes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Retrieves a specific maze by ID
 */
export const getMazeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const mazeId = req.params.id;
    
    if (!mazeId) {
      res.status(400).json({ message: "Maze ID is required" });
      return;
    }
    
    const maze = await MazeModel.findOne({ id: mazeId });
    
    if (!maze) {
      res.status(404).json({ message: "Maze not found" });
      return;
    }
    
    res.json({
      id: maze.id,
      data: maze.data,
      rows: maze.rows,
      columns: maze.columns,
      algorithm: maze.algorithm,
      createdAt: maze.createdAt
    });
  } catch (error) {
    console.error("Get maze error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Updates an existing maze
 */
export const updateMaze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    
    const user = req.user as UserDocument;
    const mazeId = req.params.id;
    
    if (!mazeId) {
      res.status(400).json({ message: "Maze ID is required" });
      return;
    }
    
    const maze = await MazeModel.findOne({ id: mazeId });
    
    if (!maze) {
      res.status(404).json({ message: "Maze not found" });
      return;
    }
    
    // Check if the user owns the maze
    if (maze.user.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not authorized to update this maze" });
      return;
    }
    
    // Update maze fields
    const { rows, columns, algorithm, data } = req.body;
    
    const updates: Partial<Maze> = {};
    
    if (rows !== undefined) updates.rows = parseInt(rows, 10);
    if (columns !== undefined) updates.columns = parseInt(columns, 10);
    if (algorithm !== undefined) updates.algorithm = algorithm;
    if (data !== undefined) updates.data = data;
    
    // Apply updates
    Object.assign(maze, updates);
    await maze.save();
    
    res.json({
      message: "Maze updated successfully",
      maze: {
        id: maze.id,
        data: maze.data,
        rows: maze.rows,
        columns: maze.columns,
        algorithm: maze.algorithm,
        updatedAt: maze.updatedAt
      },
    });
  } catch (error) {
    console.error("Update maze error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Deletes a maze by ID
 */
export const deleteMaze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    
    const user = req.user as UserDocument;
    const mazeId = req.params.id;
    
    if (!mazeId) {
      res.status(400).json({ message: "Maze ID is required" });
      return;
    }
    
    const maze = await MazeModel.findOne({ id: mazeId });
    
    if (!maze) {
      res.status(404).json({ message: "Maze not found" });
      return;
    }
    
    // Check if the user owns the maze
    if (maze.user.toString() !== user._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this maze" });
      return;
    }
    
    await maze.deleteOne();
    
    res.json({ 
      message: "Maze deleted successfully",
      id: mazeId
    });
  } catch (error) {
    console.error("Delete maze error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
