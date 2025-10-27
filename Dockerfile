FROM node:22

WORKDIR /usr/src/app

COPY package.json ./

CMD yarn install --prefer-offline && \
    yarn start:local
