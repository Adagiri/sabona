FROM node:18

WORKDIR /app/

COPY . .

RUN npm install

RUN npm run db:generate

RUN npm run build

RUN npm run db:deploy

EXPOSE 3001

CMD ["npm", "run", "start"]