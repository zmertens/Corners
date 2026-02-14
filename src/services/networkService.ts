interface ActivePlayer {
  player_name: string
  ip: string
  port: number
  lastSeen: number
}

const activePlayers = new Map<string, ActivePlayer>()
const PLAYER_TTL_MS = parseInt(process.env.NETWORK_PLAYER_TTL_MS || '30000')

const normalizeIp = (ip: string): string => {
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '')
  }
  if (ip === '::1') {
    return '127.0.0.1'
  }
  return ip
}

const cleanupExpiredPlayers = (): void => {
  const now = Date.now()
  let expiredCount = 0
  for (const [key, player] of activePlayers.entries()) {
    if (now - player.lastSeen > PLAYER_TTL_MS) {
      activePlayers.delete(key)
      expiredCount += 1
    }
  }

  if (expiredCount > 0) {
    console.log(`network heartbeat: expired ${expiredCount} player(s)`)
  }
}

export const upsertActivePlayer = (params: {
  player_name: string
  ip: string
  port: number
}): ActivePlayer => {
  cleanupExpiredPlayers()

  const entry: ActivePlayer = {
    player_name: params.player_name,
    ip: normalizeIp(params.ip),
    port: params.port,
    lastSeen: Date.now(),
  }

  const key = `${entry.player_name}:${entry.ip}:${entry.port}`
  activePlayers.set(key, entry)
  console.log(
    `network heartbeat: upsert ${entry.player_name} @ ${entry.ip}:${entry.port}`
  )
  return entry
}

export const getActivePlayers = (): ActivePlayer[] => {
  cleanupExpiredPlayers()
  return Array.from(activePlayers.values()).map((player) => ({
    player_name: player.player_name,
    ip: player.ip,
    port: player.port,
    lastSeen: player.lastSeen,
  }))
}
