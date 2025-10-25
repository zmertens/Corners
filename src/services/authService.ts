import crypto from 'crypto'
import { UserDocument } from '../models/user'

// Get values from environment variables
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-secret-key'
const TOKEN_EXPIRE_HOURS = parseInt(process.env.TOKEN_EXPIRE_HOURS || '24') // Default 24 hours

// CSV delimiter
const CSV_DELIMITER = ';' // Using semicolon to avoid conflicts with commas in data

/**
 * Interface for decoded CSV token
 */
export interface DecodedToken {
  id: string
  username: string
  email: string
  ipAddress?: string
  avatar?: string
  iat: number
  exp: number
}

/**
 * Generate CSV token for user authentication
 * @param user User document from MongoDB
 * @returns Base64 encoded CSV token string
 */
export const generateToken = (user: UserDocument): string => {
  const now = Math.floor(Date.now() / 1000) // Current time in seconds
  const expireTime = now + (TOKEN_EXPIRE_HOURS * 60 * 60) // Hours to seconds

  // Create CSV header (based on User interface fields)
  const headers = [
    'id',
    'username', 
    'email',
    'ipAddress',
    'avatar',
    'iat',
    'exp'
  ]

  // Create CSV data row
  const data = [
    user._id.toString(),
    user.username || '',
    user.email || '',
    user.ipAddress || '',
    user.avatar || '',
    now.toString(),
    expireTime.toString()
  ]

  // Escape any CSV special characters in data
  const escapedData = data.map(field => {
    // Handle empty fields
    if (!field) return ''
    
    if (field.includes(CSV_DELIMITER) || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"` // Escape quotes by doubling them
    }
    return field
  })

  // Create CSV content
  const csvContent = headers.join(CSV_DELIMITER) + '\n' + escapedData.join(CSV_DELIMITER)
  
  // Simply base64 encode the CSV content (no encryption)
  return Buffer.from(csvContent).toString('base64') // Final base64 encoding
}

/**
 * Verify CSV token and return payload if valid
 * @param token CSV token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): DecodedToken | null => {
  try {
    // Decode the base64 token to get CSV content
    const csvContent = Buffer.from(token, 'base64').toString('utf8')
    
    // Parse CSV content with proper handling of quoted fields
    const lines = csvContent.split('\n')
    if (lines.length < 2) {
      console.error('Invalid CSV format')
      return null
    }
    
    const headers = lines[0].split(CSV_DELIMITER)
    
    // Parse CSV row with proper quote handling
    const parseCSVRow = (row: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      let i = 0
      
      while (i < row.length) {
        const char = row[i]
        
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            // Escaped quote
            current += '"'
            i += 2
          } else {
            // Start or end of quoted field
            inQuotes = !inQuotes
            i++
          }
        } else if (char === CSV_DELIMITER && !inQuotes) {
          // Field separator
          result.push(current)
          current = ''
          i++
        } else {
          current += char
          i++
        }
      }
      
      result.push(current) // Add last field
      return result
    }
    
    const values = parseCSVRow(lines[1])
    
    // Create token object from CSV data
    const tokenData: any = {}
    headers.forEach((header, index) => {
      let value = values[index] || ''
      
      // Convert numeric fields
      if (header === 'iat' || header === 'exp') {
        tokenData[header] = parseInt(value)
      } else {
        tokenData[header] = value || undefined
      }
    })
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (tokenData.exp && tokenData.exp < now) {
      console.error('Token expired')
      return null
    }
    
    return tokenData as DecodedToken
  } catch (error) {
    const err = error as Error
    console.error('Token verification error:', err.message)
    return null
  }
}
