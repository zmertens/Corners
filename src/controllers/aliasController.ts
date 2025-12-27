import { Request, Response } from 'express'
import { AliasModel, AliasDocument } from '../models/alias'
import { AuthRequest } from '../types'
import { UserDocument } from '../models/user'

/**
 * Get aliases for the authenticated user
 * Query parameters:
 * - limit: number (optional, default: 20, max: 100)
 * - active: boolean (optional, filter by active status)
 */
export const getAliases = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const user = req.user as UserDocument
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const activeFilter = req.query.active

    // Build query
    const query: any = { user: user._id }

    if (activeFilter !== undefined) {
      query.active = activeFilter === 'true'
    }

    const aliases = await AliasModel.find(query)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('name active createdAt updatedAt')

    res.json({
      count: aliases.length,
      aliases: aliases.map((alias) => ({
        id: alias._id,
        name: alias.name,
        active: alias.active,
        createdAt: alias.createdAt,
        updatedAt: alias.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Get aliases error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Create a new alias for the authenticated user
 */
export const createAlias = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const user = req.user as UserDocument
    const { name, active = true } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ message: 'Alias name is required' })
      return
    }

    // Check if alias already exists for this user
    const existingAlias = await AliasModel.findOne({
      name: name.trim(),
      user: user._id,
    })

    if (existingAlias) {
      res
        .status(409)
        .json({ message: 'Alias name already exists for this user' })
      return
    }

    const alias = await AliasModel.create({
      name: name.trim(),
      user: user._id,
      active: Boolean(active),
    })

    res.status(201).json({
      message: 'Alias created successfully',
      alias: {
        id: alias._id,
        name: alias.name,
        active: alias.active,
        createdAt: alias.createdAt,
        updatedAt: alias.updatedAt,
      },
    })
  } catch (error) {
    console.error('Create alias error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Update an existing alias for the authenticated user
 */
export const updateAlias = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const user = req.user as UserDocument
    const aliasId = req.params.id
    const { name, active } = req.body

    if (!aliasId) {
      res.status(400).json({ message: 'Alias ID is required' })
      return
    }

    const alias = await AliasModel.findOne({
      _id: aliasId,
      user: user._id,
    })

    if (!alias) {
      res.status(404).json({ message: 'Alias not found' })
      return
    }

    // Update fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ message: 'Invalid alias name' })
        return
      }

      // Check if new name conflicts with existing aliases
      const existingAlias = await AliasModel.findOne({
        name: name.trim(),
        user: user._id,
        _id: { $ne: aliasId },
      })

      if (existingAlias) {
        res
          .status(409)
          .json({ message: 'Alias name already exists for this user' })
        return
      }

      alias.name = name.trim()
    }

    if (active !== undefined) {
      alias.active = Boolean(active)
    }

    await alias.save()

    res.json({
      message: 'Alias updated successfully',
      alias: {
        id: alias._id,
        name: alias.name,
        active: alias.active,
        createdAt: alias.createdAt,
        updatedAt: alias.updatedAt,
      },
    })
  } catch (error) {
    console.error('Update alias error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

/**
 * Delete an alias for the authenticated user
 */
export const deleteAlias = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    const user = req.user as UserDocument
    const aliasId = req.params.id

    if (!aliasId) {
      res.status(400).json({ message: 'Alias ID is required' })
      return
    }

    const alias = await AliasModel.findOne({
      _id: aliasId,
      user: user._id,
    })

    if (!alias) {
      res.status(404).json({ message: 'Alias not found' })
      return
    }

    await alias.deleteOne()

    res.json({
      message: 'Alias deleted successfully',
      id: aliasId,
    })
  } catch (error) {
    console.error('Delete alias error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
