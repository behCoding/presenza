FROM node:18

WORKDIR /app

COPY package.json ./
RUN yarn install

COPY . .

# Expose port for the frontend app
EXPOSE 3000

# Run the frontend application
CMD ["yarn", "start"]
