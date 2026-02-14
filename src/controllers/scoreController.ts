import { Request, Response } from 'express'
import { AuthRequest } from '../types'
import { UserDocument } from '../models/user'
import {
  fetchScores,
  createScoreEntry,
  updateScoreEntry,
  fetchUserScores,
} from '../services/scoreService'

/**
 * Get scores with optional query parameters
 * Query parameters:
 * - limit: number (optional, default: 20, max: 100)
 * Does not require authentication - public endpoint
 */
export const getScores = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    const scores = await fetchScores(limit)

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
    console.error('Get scores error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Create a new score entry
 * This can be called by authenticated or anonymous users
 */
export const createScore = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { score, maze, goal, aliases } = req.body

    // Validate required fields
    if (typeof score !== 'number' || score < 0) {
      res.status(400).json({ message: 'Score must be a non-negative number' })
      return
    }

    if (!maze || typeof maze !== 'string') {
      res.status(400).json({ message: 'Maze data (base64 string) is required' })
      return
    }

    if (
      !goal ||
      typeof goal !== 'object' ||
      !goal.start ||
      typeof goal.steps !== 'number'
    ) {
      res.status(400).json({
        message:
          'Goal object with start (string) and steps (number) is required',
      })
      return
    }

    if (!aliases || !Array.isArray(aliases) || aliases.length === 0) {
      res.status(400).json({ message: 'At least one alias is required' })
      return
    }

    // Validate aliases are strings
    if (
      !aliases.every(
        (alias) => typeof alias === 'string' && alias.trim().length > 0
      )
    ) {
      res.status(400).json({ message: 'All aliases must be non-empty strings' })
      return
    }

    // Prepare score data
    const scoreData: any = {
      score: score,
      maze: maze,
      goal: {
        start: goal.start.toString(),
        steps: parseInt(goal.steps, 10),
      },
      aliases: aliases.map((alias: string) => alias.trim()),
    }

    // Add user if authenticated
    if (req.user) {
      const user = req.user as UserDocument
      scoreData.user = user._id
    }

    const newScore = await createScoreEntry({
      score: scoreData.score,
      maze: scoreData.maze,
      goal: scoreData.goal,
      aliases: scoreData.aliases,
      userId: scoreData.user,
    })

    res.status(201).json({
      message: 'Score created successfully',
      score: {
        id: newScore._id,
        score: newScore.score,
        maze: newScore.maze,
        goal: newScore.goal,
        aliases: newScore.aliases,
        createdAt: newScore.createdAt,
      },
    })
  } catch (error) {
    console.error('Create score error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Update an existing score entry
 * Note: Scores are updateable but not deleteable per requirements
 * Only authenticated users can update scores they created
 */
export const updateScore = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ message: 'Authentication required to update scores' })
      return
    }

    const user = req.user as UserDocument
    const scoreId = req.params.id

    if (!scoreId) {
      res.status(400).json({ message: 'Score ID is required' })
      return
    }

    const { score, maze, goal, aliases } = req.body

    if (score !== undefined) {
      if (typeof score !== 'number' || score < 0) {
        res.status(400).json({ message: 'Score must be a non-negative number' })
        return
      }
    }

    if (maze !== undefined) {
      if (typeof maze !== 'string') {
        res.status(400).json({ message: 'Maze data must be a string' })
        return
      }
    }

    if (goal !== undefined) {
      if (
        typeof goal !== 'object' ||
        !goal.start ||
        typeof goal.steps !== 'number'
      ) {
        res.status(400).json({
          message:
            'Goal object with start (string) and steps (number) is required',
        })
        return
      }
    }

    if (aliases !== undefined) {
      if (!Array.isArray(aliases) || aliases.length === 0) {
        res.status(400).json({ message: 'At least one alias is required' })
        return
      }

      if (
        !aliases.every(
          (alias) => typeof alias === 'string' && alias.trim().length > 0
        )
      ) {
        res
          .status(400)
          .json({ message: 'All aliases must be non-empty strings' })
        return
      }
    }

    const existingScore = await updateScoreEntry(scoreId, user._id, {
      score,
      maze,
      goal:
        goal !== undefined
          ? {
              start: goal.start.toString(),
              steps: parseInt(goal.steps, 10),
            }
          : undefined,
      aliases:
        aliases !== undefined
          ? aliases.map((alias: string) => alias.trim())
          : undefined,
    })

    if (!existingScore) {
      res
        .status(404)
        .json({ message: 'Score not found or not authorized to update' })
      return
    }

    res.json({
      message: 'Score updated successfully',
      score: {
        id: existingScore._id,
        score: existingScore.score,
        maze: existingScore.maze,
        goal: existingScore.goal,
        aliases: existingScore.aliases,
        updatedAt: existingScore.updatedAt,
      },
    })
  } catch (error) {
    console.error('Update score error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Get scores for the authenticated user
 */
export const getUserScores = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' })
      return
    }

    const user = req.user as UserDocument
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    const scores = await fetchUserScores(user._id, limit)

    const responseData = scores.map((score) => ({
      id: score._id,
      score: score.score,
      maze: score.maze,
      goal: score.goal,
      aliases: score.aliases,
      createdAt: score.createdAt,
      updatedAt: score.updatedAt,
    }))

    res.json({
      count: responseData.length,
      scores: responseData,
    })
  } catch (error) {
    console.error('Get user scores error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
