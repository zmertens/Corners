import { Request, Response } from 'express'
import * as aliasController from '../../controllers/aliasController'
import { AliasModel } from '../../models/alias'
import { AuthRequest } from '../../types'
import { UserDocument } from '../../models/user'

// Mock the AliasModel
jest.mock('../../models/alias')

describe('Alias Controller', () => {
  let mockReq: Partial<AuthRequest>
  let mockRes: Partial<Response>
  let mockNext: jest.Mock

  beforeEach(() => {
    mockReq = {
      user: {
        _id: 'mock-user-id',
        username: 'testuser',
        email: 'test@example.com',
      } as unknown as UserDocument,
      query: {},
      params: {},
      body: {},
    }

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    }

    mockNext = jest.fn()
    jest.clearAllMocks()
  })

  describe('getAliases', () => {
    it('should return user aliases successfully', async () => {
      const mockAliases = [
        {
          _id: 'alias1',
          name: 'TestAlias1',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'alias2',
          name: 'TestAlias2',
          active: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockFind = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockAliases),
          }),
        }),
      })

      ;(AliasModel.find as jest.Mock) = mockFind

      await aliasController.getAliases(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockFind).toHaveBeenCalledWith({ user: 'mock-user-id' })
      expect(mockRes.json).toHaveBeenCalledWith({
        count: 2,
        aliases: expect.arrayContaining([
          expect.objectContaining({
            id: 'alias1',
            name: 'TestAlias1',
            active: true,
          }),
        ]),
      })
    })

    it('should filter by active status when provided', async () => {
      mockReq.query = { active: 'true' }

      const mockFind = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      ;(AliasModel.find as jest.Mock) = mockFind

      await aliasController.getAliases(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockFind).toHaveBeenCalledWith({
        user: 'mock-user-id',
        active: true,
      })
    })

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined

      await aliasController.getAliases(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not authenticated',
      })
    })
  })

  describe('createAlias', () => {
    it('should create alias successfully', async () => {
      mockReq.body = { name: 'NewAlias', active: true }

      const mockAlias = {
        _id: 'new-alias-id',
        name: 'NewAlias',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(AliasModel.findOne as jest.Mock).mockResolvedValue(null)
      ;(AliasModel.create as jest.Mock).mockResolvedValue(mockAlias)

      await aliasController.createAlias(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(AliasModel.create).toHaveBeenCalledWith({
        name: 'NewAlias',
        user: 'mock-user-id',
        active: true,
      })

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Alias created successfully',
        alias: expect.objectContaining({
          id: 'new-alias-id',
          name: 'NewAlias',
          active: true,
        }),
      })
    })

    it('should return 409 if alias already exists', async () => {
      mockReq.body = { name: 'ExistingAlias' }
      ;(AliasModel.findOne as jest.Mock).mockResolvedValue({
        name: 'ExistingAlias',
      })

      await aliasController.createAlias(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Alias name already exists for this user',
      })
    })

    it('should return 400 if name is missing', async () => {
      mockReq.body = {}

      await aliasController.createAlias(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Alias name is required',
      })
    })
  })

  describe('updateAlias', () => {
    it('should update alias successfully', async () => {
      mockReq.params = { id: 'alias-id' }
      mockReq.body = { name: 'UpdatedAlias', active: false }

      const mockAlias = {
        _id: 'alias-id',
        name: 'OldAlias',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      }

      ;(AliasModel.findOne as jest.Mock).mockResolvedValueOnce(mockAlias) // For finding the alias
      ;(AliasModel.findOne as jest.Mock).mockResolvedValueOnce(null) // For checking name conflicts

      await aliasController.updateAlias(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockAlias.save).toHaveBeenCalled()
      expect(mockAlias.name).toBe('UpdatedAlias')
      expect(mockAlias.active).toBe(false)

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Alias updated successfully',
        alias: expect.objectContaining({
          name: 'UpdatedAlias',
          active: false,
        }),
      })
    })

    it('should return 404 if alias not found', async () => {
      mockReq.params = { id: 'nonexistent-id' }
      ;(AliasModel.findOne as jest.Mock).mockResolvedValue(null)

      await aliasController.updateAlias(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Alias not found',
      })
    })
  })

  describe('deleteAlias', () => {
    it('should delete alias successfully', async () => {
      mockReq.params = { id: 'alias-id' }

      const mockAlias = {
        deleteOne: jest.fn().mockResolvedValue(true),
      }

      ;(AliasModel.findOne as jest.Mock).mockResolvedValue(mockAlias)

      await aliasController.deleteAlias(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockAlias.deleteOne).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Alias deleted successfully',
        id: 'alias-id',
      })
    })

    it('should return 404 if alias not found', async () => {
      mockReq.params = { id: 'nonexistent-id' }
      ;(AliasModel.findOne as jest.Mock).mockResolvedValue(null)

      await aliasController.deleteAlias(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Alias not found',
      })
    })
  })
})
