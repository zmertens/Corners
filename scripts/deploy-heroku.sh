#!/bin/bash

echo "Setting up Corners application for Heroku deployment..."

# Check for Heroku CLI
if ! command -v heroku &> /dev/null
then
    echo "Heroku CLI could not be found. Please install it first."
    exit 1
fi

# Login to Heroku if not already logged in
heroku auth:whoami &> /dev/null || heroku login

# Get app name from user
read -p "Enter a name for your Heroku app (leave blank for random name): " APP_NAME

if [ -z "$APP_NAME" ]
then
    echo "Creating Heroku app with random name..."
    heroku create
else
    echo "Creating Heroku app with name '$APP_NAME'..."
    heroku create $APP_NAME
fi

# Set environment variables
echo "Setting up MongoDB connection..."
read -p "Enter your MongoDB URI (e.g., mongodb+srv://...): " MONGODB_URI

if [ -z "$MONGODB_URI" ]
then
    echo "MongoDB URI is required. Exiting."
    exit 1
fi

heroku config:set MONGODB_URI="$MONGODB_URI"

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -hex 32)
heroku config:set JWT_SECRET="$JWT_SECRET"

# Set Node environment
heroku config:set NODE_ENV="production"

# Git setup
git add .
git commit -m "Prepare for Heroku deployment"

# Deploy
echo "Deploying to Heroku..."
git push heroku main

# Open the app
heroku open

echo "Deployment complete! Your app is now running on Heroku."
