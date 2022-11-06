FROM node:16-alpine
WORKDIR /bunnybot

COPY . ./
RUN npm i
RUN npm run build

CMD ["sh", "run.sh"]