# Corners - Maze Management Application

## Overview

Corners is a Node.js and Express web application that allows users to manage mazes stored in a MongoDB database.
The mazes are represented as base64 encoded strings, and the application provides a RESTful API for creating, retrieving, updating, and deleting mazes.
Additionally, the application integrates a WebAssembly (WASM) module compiled from Emscripten to allow for more portability.

## Features

- RESTful API for maze management:
  - GET /mazes/ - Retrieve all mazes
  - POST /maze/ - Create a new maze
  - DELETE /maze/:id - Delete a maze by ID
  - PUT /maze/:id - Update a maze by ID
- Integration with MongoDB for data storage
- Loading and interaction with a WASM module for enhanced functionality

## Project Structure

```
corners
├── src
│   ├── app.ts
│   ├── controllers
│   │   ├── corners_endpoints.ts
│   ├── models
│   │   └── complex.ts
│   ├── routes
│   │   └── navigations.ts
│   ├── services
│   │   └── wasmLoader.ts
│   └── types
│       └── index.ts
├── config
│   └── database.ts
├── public
│   └── wasm
│       └── mazebuilder.wasm
├── .gitignore
├── package.json
├── tsconfig.json
├── Procfile
└── README.md
```

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
   Update the `config/database.ts` file with your MongoDB connection string.

4. **Run the application:**

   ```
   npm start
   ```

5. **Access the API:**
   The API will be available at `http://localhost:3000/mazes`.

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
