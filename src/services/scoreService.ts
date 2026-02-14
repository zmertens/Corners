import { ScoreModel, ScoreDocument } from '../models/score'
import mongoose from 'mongoose'

export interface ScoreCreateInput {
  score: number
  maze: string
  goal: {
    start: string
    steps: number
  }
  aliases: string[]
  userId?: mongoose.Types.ObjectId
}

export interface ScoreUpdateInput {
  score?: number
  maze?: string
  goal?: {
    start: string
    steps: number
  }
  aliases?: string[]
}

export const fetchScores = async (limit: number): Promise<ScoreDocument[]> => {
  return ScoreModel.find({})
    .limit(limit)
    .sort({ score: -1, createdAt: -1 })
    .select('score maze goal aliases createdAt')
}

export const createScoreEntry = async (
  input: ScoreCreateInput
): Promise<ScoreDocument> => {
  const scoreData: any = {
    score: input.score,
    maze: input.maze,
    goal: {
      start: input.goal.start,
      steps: input.goal.steps,
    },
    aliases: input.aliases,
  }

  if (input.userId) {
    scoreData.user = input.userId
  }

  return ScoreModel.create(scoreData)
}

export const updateScoreEntry = async (
  scoreId: string,
  userId: mongoose.Types.ObjectId,
  updates: ScoreUpdateInput
): Promise<ScoreDocument | null> => {
  const score = await ScoreModel.findOne({ _id: scoreId, user: userId })
  if (!score) {
    return null
  }

  if (updates.score !== undefined) {
    score.score = updates.score
  }

  if (updates.maze !== undefined) {
    score.maze = updates.maze
  }

  if (updates.goal !== undefined) {
    score.goal = {
      start: updates.goal.start,
      steps: updates.goal.steps,
    }
  }

  if (updates.aliases !== undefined) {
    score.aliases = updates.aliases
  }

  await score.save()
  return score
}

export const fetchUserScores = async (
  userId: mongoose.Types.ObjectId,
  limit: number
): Promise<ScoreDocument[]> => {
  return ScoreModel.find({ user: userId })
    .limit(limit)
    .sort({ score: -1, createdAt: -1 })
    .select('score maze goal aliases createdAt updatedAt')
}
