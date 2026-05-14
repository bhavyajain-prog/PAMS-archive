FROM node:lts-bookworm-slim
WORKDIR /app

COPY package*.json .
RUN npm ci

COPY . .

EXPOSE 5000

CMD [ "npm", "start" ]