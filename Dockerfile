FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Cloud Run uses port 8080 by default
ENV PORT=8080
EXPOSE 8080

CMD [ "npm", "start" ]
