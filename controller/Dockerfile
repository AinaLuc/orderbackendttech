# Use an official Node.js runtime as a parent image
FROM node:18.17.1

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Use the official MongoDB image
# This includes the MongoDB tools, including the shell
FROM mongo:4.4


# Expose the port the app runs on
EXPOSE 3000

# Copy the rest of the application code
COPY . .

# Command to run your application
CMD ["npm", "start"]
