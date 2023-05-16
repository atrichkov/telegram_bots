FROM node:18-slim

WORKDIR /bot

COPY /package.json .

RUN npm install

COPY . .

CMD [ "npm", "start" ]