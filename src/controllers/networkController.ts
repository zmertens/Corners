import { Request, Response } from 'express'
import {
  getActivePlayers,
  upsertActivePlayer,
} from '../services/networkService'

const getRequestIp = (req: Request): string => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    'unknown'
  )
}

export const getNetworkData = async (_req: Request, res: Response) => {
  const activePlayers = getActivePlayers().map((player) => ({
    player_name: player.player_name,
    ip: player.ip,
    port: player.port,
  }))

  res.json({ active_players: activePlayers })
}

export const registerNetworkPlayer = async (req: Request, res: Response) => {
  const { player_name, port, ip } = req.body || {}

  if (!player_name || typeof player_name !== 'string') {
    return res.status(400).json({ message: 'player_name is required' })
  }

  const parsedPort = typeof port === 'string' ? parseInt(port, 10) : port
  if (!parsedPort || Number.isNaN(parsedPort) || parsedPort <= 0) {
    return res.status(400).json({ message: 'valid port is required' })
  }

  const resolvedIp =
    typeof ip === 'string' && ip.length > 0 ? ip : getRequestIp(req)

  const entry = upsertActivePlayer({
    player_name: player_name.trim(),
    ip: resolvedIp,
    port: parsedPort,
  })

  res.json({ message: 'player registered', player: entry })
}
