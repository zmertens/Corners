import mongoose from 'mongoose'

const connectDatabase = async () => {
  try {
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/corners'
    await mongoose.connect(dbUri, {})
    console.log('Database connected successfully')
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
}

export default connectDatabase
