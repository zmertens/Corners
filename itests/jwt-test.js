// Simple JWT test to verify the enhanced authentication works
const jwt = require('jsonwebtoken')

// Simulate the JWT creation process
const JWT_SECRET = 'your-secret-key'
const JWT_EXPIRE = '1d'

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
}

// Generate token
const payload = {
  id: mockUser._id,
  username: mockUser.username,
  email: mockUser.email,
}

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE })
console.log('Generated JWT:', token)

// Verify token
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('\nDecoded JWT payload:')
  console.log('- User ID:', decoded.id)
  console.log('- Username:', decoded.username)
  console.log('- Email:', decoded.email)
  console.log('- Issued at:', new Date(decoded.iat * 1000).toISOString())
  console.log('- Expires at:', new Date(decoded.exp * 1000).toISOString())
  console.log(
    '- Valid for:',
    Math.floor((decoded.exp - decoded.iat) / 3600),
    'hours'
  )
} catch (error) {
  console.error('JWT verification failed:', error.message)
}
