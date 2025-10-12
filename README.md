# Corners

Corners is a Node.js and Express web application that provides endpoints for creating mazes.
  - POST or PUT `/api/mazes/create`

```json
   {
      "algo": "binary_tree",
      "seed": 10,
      "rows": 100,
      "columns": 100,
   }
```

## Features

- RESTful API `/api/mazes/`

- Integration with MongoDB for data storage
  
- Integration with the [Maze Builder](https://github.com/zmertens/MazeBuilder) WebAssembly module
  - Efficient JavaScript layer around a C++ library
  - Provides maze-generating functions

- @TODO Socket based UDP connections for real-time data transfers

- @TODO CRON job that works to provide maze data automatically

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
