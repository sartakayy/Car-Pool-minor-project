#!/bin/bash

# Start JSON Server in background
echo "Starting JSON Server on port 3001..."
npx json-server --watch db.json --port 3001 &
JSON_SERVER_PID=$!

# Start Angular development server
echo "Starting Angular development server..."
npm start

# Kill JSON server when Angular server stops
kill $JSON_SERVER_PID