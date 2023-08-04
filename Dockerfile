FROM node

WORKDIR /app

COPY ["package.json","package-lock.json*","./"]

RUN npm install --force

COPY . .

ENV mail_pass=odyhoziqkunvjkcj
ENV DBURL=mongodb+srv://lunatoys:lunatoys@cluster0.9yv231a.mongodb.net/Malaria?retryWrites=true&w=majority
ENV Redis_host=redis-15102.c1.asia-northeast1-1.gce.cloud.redislabs.com
ENV Redis_pass=uqgxpw3cmG6oZy32W5ywA2QuDwUE9psT

CMD [ "npm","run","docker" ]