# Use the official Node.js image as the base
FROM node:23

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire application to the container
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "edgeServer.js"]
