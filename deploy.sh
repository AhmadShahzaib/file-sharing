#!/bin/bash

# Build and deploy
docker-compose build
docker-compose up -d

# Clean up
docker system prune -f 