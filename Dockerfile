FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build client
RUN cd client && npm install && npm run build
RUN mv client/build server/public

WORKDIR /usr/src/app/server

# Set environment variables
ENV NODE_ENV=production

EXPOSE 5000

CMD [ "npm", "start" ] 