# Use an official Node.js runtime as a parent image
FROM node:18.17.1

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

RUN apt-get update && \
    apt-get install -y gnupg libssl1.1 && \
    echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list && \
    apt-get update && \
    apt-get install -y mongodb-org-shell=4.4.15



# Expose the port the app runs on
EXPOSE 3000

# Copy the rest of the application code
COPY . .

# Command to run your application
CMD ["npm", "start"]
