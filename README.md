# Corners

Corners is a Node.js and Express web application that allows users to manage users. high-scores, and provide utility functions for generating mazes for games and stuff.

The user data consists of username and passwords, scores, and program arguments in JSON format. The user data can be taken to generate mazes in string formats.

The program arguments are representations of mazes that contain relevant information such as the number of rows, columns, seed, and generating-algorithm.

## Features

- RESTful API for communication
  - Provides action verbs for creating and retrieving users
- Integration with MongoDB for data storage
  - Persistent storage for user data
- Integration with a WebAssembly module for efficient and portable utilities
  - Provides maze-generating library
- JWT token-based authentication
  - Provides secure way to transfer login requests with session info
  - Password reset functionality via secure tokens

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
   Update the `config/database.ts` file with your local MongoDB connection string.

4. **Run the application:**

   ```
   npm start
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
