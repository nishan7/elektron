FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variable for API URL
ENV REACT_APP_API_URL=http://localhost:8000

# Expose the port the app runs on
EXPOSE 3000

# Start the application in development mode for now
CMD ["npm", "start"] 