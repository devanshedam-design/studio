#!/bin/sh

# This script creates a .env file for local development.

# Check if .env file already exists
if [ -f ".env" ]; then
  echo ".env file already exists. Please edit it manually if needed."
else
  # Create .env file with a placeholder for the Gemini API key
  echo "GEMINI_API_KEY=YOUR_API_KEY_HERE" > .env
  echo "✅ Created .env file."
  echo "➡️ Next step: Open the .env file and replace 'YOUR_API_KEY_HERE' with your actual Google AI API key."
fi
