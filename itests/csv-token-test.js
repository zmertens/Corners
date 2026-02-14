// Simple CSV token test to verify the enhanced authentication works
const crypto = require('crypto')

// Configuration
const TOKEN_SECRET = 'your-secret-key'
const TOKEN_EXPIRE_HOURS = 24
const CSV_DELIMITER = ';'

// Mock user data
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  ipAddress: '127.0.0.1',
  avatar: 'base64imagedata123',
}

console.log('=== CSV Token Generation Test ===')

// Generate CSV token (simulating the generateToken function)
function generateToken(user) {
  const now = Math.floor(Date.now() / 1000)
  const expireTime = now + TOKEN_EXPIRE_HOURS * 60 * 60

  // Create CSV header
  const headers = [
    'id',
    'username',
    'email',
    'ipAddress',
    'avatar',
    'iat',
    'exp',
  ]

  // Create CSV data row
  const data = [
    user._id.toString(),
    user.username || '',
    user.email || '',
    user.ipAddress || '',
    user.avatar || '',
    now.toString(),
    expireTime.toString(),
  ]

  // Escape CSV special characters
  const escapedData = data.map((field) => {
    if (
      field.includes(CSV_DELIMITER) ||
      field.includes('"') ||
      field.includes('\n')
    ) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  })

  // Create CSV content
  const csvContent =
    headers.join(CSV_DELIMITER) + '\n' + escapedData.join(CSV_DELIMITER)
  console.log('CSV Content:', csvContent)

  // Encrypt the CSV content
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(TOKEN_SECRET, 'salt', 32)
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(csvContent, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()
  const result =
    iv.toString('base64') + ':' + authTag.toString('base64') + ':' + encrypted

  return Buffer.from(result).toString('base64')
}

// Verify CSV token (simulating the verifyToken function)
function verifyToken(token) {
  try {
    // Decode the base64 token
    const decodedToken = Buffer.from(token, 'base64').toString('utf8')
    const [ivStr, authTagStr, encryptedData] = decodedToken.split(':')

    // Decrypt the CSV content
    const algorithm = 'aes-256-gcm'
    const key = crypto.scryptSync(TOKEN_SECRET, 'salt', 32)
    const iv = Buffer.from(ivStr, 'base64')
    const authTag = Buffer.from(authTagStr, 'base64')

    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    console.log('Decrypted CSV:', decrypted)

    // Parse CSV content
    const lines = decrypted.split('\n')
    const headers = lines[0].split(CSV_DELIMITER)
    const values = lines[1].split(CSV_DELIMITER)

    // Create token object from CSV data
    const tokenData = {}
    headers.forEach((header, index) => {
      let value = values[index] || ''

      // Remove quotes if present and unescape
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"')
      }

      // Convert numeric fields
      if (header === 'iat' || header === 'exp') {
        tokenData[header] = parseInt(value)
      } else {
        tokenData[header] = value || undefined
      }
    })

    return tokenData
  } catch (error) {
    console.error('Token verification error:', error.message)
    return null
  }
}

// Test the implementation
const token = generateToken(mockUser)
console.log('Generated CSV Token:', token)
console.log('Token length:', token.length, 'characters')

console.log('\n=== CSV Token Verification Test ===')
const decoded = verifyToken(token)

if (decoded) {
  console.log('Successfully decoded CSV token:')
  console.log('- User ID:', decoded.id)
  console.log('- Username:', decoded.username)
  console.log('- Email:', decoded.email)
  console.log('- IP Address:', decoded.ipAddress)
  console.log(
    '- Avatar:',
    decoded.avatar ? decoded.avatar.substring(0, 20) + '...' : 'None'
  )
  console.log('- Issued at:', new Date(decoded.iat * 1000).toISOString())
  console.log('- Expires at:', new Date(decoded.exp * 1000).toISOString())
  console.log(
    '- Valid for:',
    Math.floor((decoded.exp - decoded.iat) / 3600),
    'hours'
  )
} else {
  console.log('Failed to decode token')
}
