FROM node:16-slim

WORKDIR /bot

COPY /package.json .

RUN npm install

COPY . .

CMD [ "npm", "start" ]