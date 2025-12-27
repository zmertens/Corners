import mongoose from 'mongoose'
import { UserModel } from '../src/models/user'
import { AliasModel } from '../src/models/alias'
import { ScoreModel } from '../src/models/score'

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/corners_dev'

/**
 * Seed script to populate database with test data
 */
async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB successfully!')

    // Clear existing data (be careful in production!)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Clearing existing data...')
      await UserModel.deleteMany({})
      await AliasModel.deleteMany({})
      await ScoreModel.deleteMany({})
      console.log('Data cleared!')
    }

    // Create test users with base64 encoded passwords
    console.log('Creating test users...')
    const testPassword1 = Buffer.from('password123').toString('base64')
    const testPassword2 = Buffer.from('testpass456').toString('base64')

    const user1 = await UserModel.create({
      username: 'testuser1',
      email: 'testuser1@example.com',
      password: testPassword1,
    })

    const user2 = await UserModel.create({
      username: 'testuser2',
      email: 'testuser2@example.com',
      password: testPassword2,
    })

    console.log('Created users:', user1.username, user2.username)

    // Create test aliases
    console.log('Creating test aliases...')
    const alias1 = await AliasModel.create({
      name: 'SpeedRunner',
      user: user1._id,
      active: true,
    })

    const alias2 = await AliasModel.create({
      name: 'MazeExpert',
      user: user1._id,
      active: true,
    })

    const alias3 = await AliasModel.create({
      name: 'PuzzleSolver',
      user: user2._id,
      active: true,
    })

    const alias4 = await AliasModel.create({
      name: 'InactiveAlias',
      user: user2._id,
      active: false,
    })

    console.log(
      'Created aliases:',
      alias1.name,
      alias2.name,
      alias3.name,
      alias4.name
    )

    // Create test scores
    console.log('Creating test scores...')

    // Sample base64 encoded maze data (this would normally come from the WASM module)
    const sampleMazeData1 = Buffer.from('maze_data_1_example').toString(
      'base64'
    )
    const sampleMazeData2 = Buffer.from('maze_data_2_example').toString(
      'base64'
    )
    const sampleMazeData3 = Buffer.from('maze_data_3_example').toString(
      'base64'
    )

    const score1 = await ScoreModel.create({
      score: 150,
      maze: sampleMazeData1,
      goal: {
        start: '0,0',
        steps: 12,
      },
      aliases: ['SpeedRunner', 'MazeExpert'],
      user: user1._id,
    })

    const score2 = await ScoreModel.create({
      score: 200,
      maze: sampleMazeData2,
      goal: {
        start: '5,5',
        steps: 8,
      },
      aliases: ['PuzzleSolver'],
      user: user2._id,
    })

    const score3 = await ScoreModel.create({
      score: 95,
      maze: sampleMazeData3,
      goal: {
        start: '1,1',
        steps: 20,
      },
      aliases: ['Anonymous'],
      // No user - anonymous score
    })

    console.log(
      'Created scores with values:',
      score1.score,
      score2.score,
      score3.score
    )

    console.log('Database seeding completed successfully!')

    // Display summary
    const userCount = await UserModel.countDocuments()
    const aliasCount = await AliasModel.countDocuments()
    const scoreCount = await ScoreModel.countDocuments()

    console.log('Database Summary:')
    console.log(`- Users: ${userCount}`)
    console.log(`- Aliases: ${aliasCount}`)
    console.log(`- Scores: ${scoreCount}`)

    console.log('Sample credentials for testing:')
    console.log(`Username: testuser1, Password (base64): ${testPassword1}`)
    console.log(`Username: testuser2, Password (base64): ${testPassword2}`)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  }
}

/**
 * Verify database connectivity
 */
async function verifyConnection() {
  try {
    console.log('Testing database connection...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Database connection successful!')

    const db = mongoose.connection.db
    if (db) {
      const collections = await db.listCollections().toArray()
      console.log(
        'Available collections:',
        collections.map((c) => c.name)
      )
    } else {
      console.log(
        'Database connection established but db instance not available'
      )
    }

    await mongoose.disconnect()
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Run the appropriate function based on command line argument
const command = process.argv[2]

if (command === 'seed') {
  seedDatabase()
} else if (command === 'verify') {
  verifyConnection()
} else {
  console.log('Usage:')
  console.log('  npm run seed:dev     # Seed database with test data')
  console.log('  npm run verify:db    # Verify database connection')
  console.log('')
  console.log('Or directly:')
  console.log('  npx ts-node src/scripts/seedData.ts seed')
  console.log('  npx ts-node src/scripts/seedData.ts verify')
}
