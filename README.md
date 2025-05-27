# Corners

Helper app that provides a login server with REST API and WebAssembly integration. Handles transmitting and receiving data representing a maze. Can generate mazes too.

## Overview

Corners is a Node.js and Express web application that allows users to manage users and provide utility functions for generating mazes for games and stuff.

The data received consists of username and passwords, and program arguments in JSON format. The data can be utilized to generate mazes as 2D strings. These mazes can be shared with the user(s).

The JSON responses contain representations of 2D mazes that may be base64 encoded strings, and relevant information such as the number of rows, columns, algorithm utilized, and so forth.

Additionally, the application integrates a WebAssembly (WASM) module compiled from Emscripten to allow for more utility.

## Features

- RESTful API for communication
- Integration with MongoDB for data storage
- Integration with a WebAssembly module for efficient and portable utilities
- JWT token-based authentication
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
