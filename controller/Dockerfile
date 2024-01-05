# Use an official Node.js runtime as a parent image
FROM node:18.17.1 AS build

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build your application
RUN npm run build

# Use a lighter image for runtime
FROM node:18.17.1-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy only the necessary files from the build stage
COPY --from=build /usr/src/app/dist /usr/src/app/dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run your application
CMD ["npm", "start"]
