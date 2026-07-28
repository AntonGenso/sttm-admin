FROM node:20-alpine

WORKDIR /app

RUN apk update && apk add --no-cache git

COPY package*.json ./.

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5173"]