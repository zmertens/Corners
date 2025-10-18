# Corners

Corners is a Node.js and Express web application that provides authentication services and endpoints for creating mazes and managing user scores.

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`

Login a user with username and base64 encoded password.

**Request Body:**

```json
{
  "username": "string",
  "password": "base64_encoded_password"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string"
  }
}
```

#### POST `/api/auth/logout`

Logout a user (client-side token removal).

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

#### POST `/api/auth/register`

Register a new user.

**Request Body:**

```json
{
  "username": "string",
  "email": "string",
  "password": "base64_encoded_password"
}
```

#### GET `/api/auth/aliases`

Get aliases for authenticated user (requires authentication).

**Query Parameters:**

- `limit` (optional): Number of results (default: 20, max: 100)
- `active` (optional): Filter by active status (true/false)

**Response:**

```json
{
  "count": 2,
  "aliases": [
    {
      "id": "alias_id",
      "name": "alias_name",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/auth/aliases`

Create a new alias (requires authentication).

**Request Body:**

```json
{
  "name": "string",
  "active": true
}
```

#### PUT `/api/auth/aliases/:id`

Update an existing alias (requires authentication).

#### DELETE `/api/auth/aliases/:id`

Delete an alias (requires authentication).

### Maze Endpoints

#### POST/PUT `/api/mazes/create`

Create a maze (public endpoint).

**Request Body:**

```json
{
  "algo": "binary_tree",
  "seed": 10,
  "rows": 100,
  "columns": 100,
  "distances": "optional_string"
}
```

**Response:**

```json
{
  "data": "base64_maze_data",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "version_str": "maze_builder_version",
  "config": {
    "algo": "binary_tree",
    "seed": 10,
    "rows": 100,
    "columns": 100
  }
}
```

#### GET `/api/mazes/scores`

Get maze scores (public endpoint).

**Query Parameters:**

- `limit` (optional): Number of results (default: 20, max: 100)

**Response:**

```json
{
  "count": 2,
  "scores": [
    {
      "score": 100,
      "maze": "base64_maze_string",
      "goal": {
        "start": "0,0",
        "steps": 10
      },
      "aliases": ["alias1", "alias2"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/mazes/scores`

Create a new score entry (public endpoint).

**Request Body:**

```json
{
  "score": 100,
  "maze": "base64_maze_string",
  "goal": {
    "start": "0,0",
    "steps": 10
  },
  "aliases": ["alias1", "alias2"]
}
```

#### PUT `/api/mazes/scores/:id`

Update an existing score (requires authentication, user can only update their own scores).

#### GET `/api/user/scores`

Get scores for authenticated user (requires authentication).

### Other Endpoints

#### GET `/api/help`

Get help information for the API and WASM module.

#### GET `/api/test-wasm`

Test endpoint to check WASM module availability.

## Features

- **Authentication System**: JWT-based authentication with base64 password support
- **User Aliases**: Create and manage user aliases for score tracking
- **Score Management**: Track and update maze completion scores
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
