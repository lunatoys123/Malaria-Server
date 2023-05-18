FROM node

WORKDIR /app

COPY ["package.json","package-lock.json*","./"]

RUN npm install --force

COPY . .

CMD [ "npm","run","docker" ]