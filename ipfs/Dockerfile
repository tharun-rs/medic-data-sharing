# Use the official Node.js image as the base image
FROM node:23

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if available) to the container
COPY package*.json ./

# Install the dependencies defined in package.json
RUN npm install

# Copy the rest of the application files into the container
COPY . .

# Expose the port that your IPFS server will run on
EXPOSE 3001

# Start the application when the container starts
CMD ["node", "ipfsServer.js"]
