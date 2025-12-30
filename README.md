# Corners

Corners is a Node.js and Express web application that provides authentication and maze creation services.

## Features

- **Authentication System**: JWT-based authentication with base64 password support
- **RESTful API**: Comprehensive REST API for all operations
- **Integration with MongoDB**: Persistent data storage
- **Integration with [Maze Builder](https://github.com/zmertens/MazeBuilder) WebAssembly module**:
  - Efficient JavaScript layer around a C++ library
  - Provides maze-generating functions
- **Public and Authenticated Endpoints**: Mixed access levels for different features

## Setup Instructions

1. **Clone the repository:**

   ```
   git clone <repository-url>
   cd corners
   ```

2. **Install dependencies:**

   ```
   npm install
   ```

3. **Configure the database:**
   Update the `config/database.ts` file with your local MongoDB connection string if needed.

4. **Run the application:**

   ```
   npm run dev
   ```

5. **Access the API:**
   The API will be available at `http://localhost:3000/api/` endpoints.

## Deployment

This application is designed to be deployed on Heroku. Ensure you have the Heroku CLI installed and follow these steps:

1. Create a new Heroku app:

   ```
   heroku create <app-name>
   ```

2. Set up your MongoDB connection string as a Heroku config variable:

   ```
   heroku config:set MONGODB_URI=<your-mongodb-uri>
   ```

3. Deploy the application:

   ```
   git push heroku main
   ```

4. Open the application in your browser:
   ```
   heroku open
   ```
