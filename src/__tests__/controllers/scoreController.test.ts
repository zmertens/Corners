import { Request, Response } from 'express'
import * as scoreController from '../../controllers/scoreController'
import { ScoreModel } from '../../models/score'
import { AuthRequest } from '../../types'
import { UserDocument } from '../../models/user'

// Mock the ScoreModel
jest.mock('../../models/score')

describe('Score Controller', () => {
  let mockReq: Partial<AuthRequest>
  let mockRes: Partial<Response>

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

    jest.clearAllMocks()
  })

  describe('getScores', () => {
    it('should return scores successfully', async () => {
      const mockScores = [
        {
          _id: 'score1',
          score: 100,
          maze: 'base64mazdata1',
          goal: { start: '0,0', steps: 10 },
          aliases: ['alias1', 'alias2'],
          createdAt: new Date(),
        },
        {
          _id: 'score2',
          score: 85,
          maze: 'base64mazdata2',
          goal: { start: '1,1', steps: 15 },
          aliases: ['alias3'],
          createdAt: new Date(),
        },
      ]

      const mockFind = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockScores),
          }),
        }),
      })

      ;(ScoreModel.find as jest.Mock) = mockFind

      await scoreController.getScores(mockReq as Request, mockRes as Response)

      expect(mockFind).toHaveBeenCalledWith({})
      expect(mockRes.json).toHaveBeenCalledWith({
        count: 2,
        scores: expect.arrayContaining([
          expect.objectContaining({
            score: 100,
            maze: 'base64mazdata1',
            goal: { start: '0,0', steps: 10 },
            aliases: ['alias1', 'alias2'],
          }),
        ]),
      })
    })

    it('should respect limit query parameter', async () => {
      mockReq.query = { limit: '5' }

      const mockFind = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      ;(ScoreModel.find as jest.Mock) = mockFind

      await scoreController.getScores(mockReq as Request, mockRes as Response)

      expect(mockFind().limit).toHaveBeenCalledWith(5)
    })

    it('should cap limit at 100', async () => {
      mockReq.query = { limit: '200' }

      const mockFind = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([]),
          }),
        }),
      })

      ;(ScoreModel.find as jest.Mock) = mockFind

      await scoreController.getScores(mockReq as Request, mockRes as Response)

      expect(mockFind().limit).toHaveBeenCalledWith(100)
    })
  })

  describe('createScore', () => {
    it('should create score successfully for authenticated user', async () => {
      mockReq.body = {
        score: 95,
        maze: 'base64mazedata',
        goal: { start: '0,0', steps: 12 },
        aliases: ['testalias1', 'testalias2'],
      }

      const mockCreatedScore = {
        _id: 'new-score-id',
        score: 95,
        maze: 'base64mazedata',
        goal: { start: '0,0', steps: 12 },
        aliases: ['testalias1', 'testalias2'],
        createdAt: new Date(),
      }

      ;(ScoreModel.create as jest.Mock).mockResolvedValue(mockCreatedScore)

      await scoreController.createScore(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(ScoreModel.create).toHaveBeenCalledWith({
        score: 95,
        maze: 'base64mazedata',
        goal: { start: '0,0', steps: 12 },
        aliases: ['testalias1', 'testalias2'],
        user: 'mock-user-id',
      })

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Score created successfully',
        score: expect.objectContaining({
          id: 'new-score-id',
          score: 95,
          maze: 'base64mazedata',
        }),
      })
    })

    it('should create score successfully for anonymous user', async () => {
      mockReq.user = undefined
      mockReq.body = {
        score: 80,
        maze: 'base64mazedata',
        goal: { start: '1,1', steps: 20 },
        aliases: ['anonymous'],
      }

      const mockCreatedScore = {
        _id: 'anonymous-score-id',
        score: 80,
        maze: 'base64mazedata',
        goal: { start: '1,1', steps: 20 },
        aliases: ['anonymous'],
        createdAt: new Date(),
      }

      ;(ScoreModel.create as jest.Mock).mockResolvedValue(mockCreatedScore)

      await scoreController.createScore(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(ScoreModel.create).toHaveBeenCalledWith({
        score: 80,
        maze: 'base64mazedata',
        goal: { start: '1,1', steps: 20 },
        aliases: ['anonymous'],
      })

      expect(mockRes.status).toHaveBeenCalledWith(201)
    })

    it('should return 400 for invalid score', async () => {
      mockReq.body = {
        score: -5, // Invalid negative score
        maze: 'base64mazedata',
        goal: { start: '0,0', steps: 12 },
        aliases: ['testalias'],
      }

      await scoreController.createScore(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Score must be a non-negative number',
      })
    })

    it('should return 400 for missing maze data', async () => {
      mockReq.body = {
        score: 95,
        // maze: missing
        goal: { start: '0,0', steps: 12 },
        aliases: ['testalias'],
      }

      await scoreController.createScore(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Maze data (base64 string) is required',
      })
    })

    it('should return 400 for missing aliases', async () => {
      mockReq.body = {
        score: 95,
        maze: 'base64mazedata',
        goal: { start: '0,0', steps: 12 },
        aliases: [], // Empty aliases array
      }

      await scoreController.createScore(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'At least one alias is required',
      })
    })
  })

  describe('updateScore', () => {
    it('should update score successfully', async () => {
      mockReq.params = { id: 'score-id' }
      mockReq.body = {
        score: 120,
        aliases: ['updatedalias'],
      }

      const mockScore = {
        _id: 'score-id',
        score: 100,
        maze: 'oldmazedata',
        goal: { start: '0,0', steps: 10 },
        aliases: ['oldalias'],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      }

      ;(ScoreModel.findOne as jest.Mock).mockResolvedValue(mockScore)

      await scoreController.updateScore(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockScore.save).toHaveBeenCalled()
      expect(mockScore.score).toBe(120)
      expect(mockScore.aliases).toEqual(['updatedalias'])

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Score updated successfully',
        score: expect.objectContaining({
          score: 120,
          aliases: ['updatedalias'],
        }),
      })
    })

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined

      await scoreController.updateScore(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication required to update scores',
      })
    })

    it('should return 404 if score not found', async () => {
      mockReq.params = { id: 'nonexistent-id' }
      ;(ScoreModel.findOne as jest.Mock).mockResolvedValue(null)

      await scoreController.updateScore(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Score not found or not authorized to update',
      })
    })
  })

  describe('getUserScores', () => {
    it('should return user scores successfully', async () => {
      const mockUserScores = [
        {
          _id: 'user-score1',
          score: 100,
          maze: 'usermazedata1',
          goal: { start: '0,0', steps: 8 },
          aliases: ['useralias1'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockFind = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUserScores),
          }),
        }),
      })

      ;(ScoreModel.find as jest.Mock) = mockFind

      await scoreController.getUserScores(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockFind).toHaveBeenCalledWith({ user: 'mock-user-id' })
      expect(mockRes.json).toHaveBeenCalledWith({
        count: 1,
        scores: expect.arrayContaining([
          expect.objectContaining({
            id: 'user-score1',
            score: 100,
            maze: 'usermazedata1',
          }),
        ]),
      })
    })

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined

      await scoreController.getUserScores(
        mockReq as AuthRequest,
        mockRes as Response
      )

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication required',
      })
    })
  })
})
