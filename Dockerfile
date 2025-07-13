FROM node:18

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app/

COPY . .

RUN pnpm install

RUN pnpm run db:generate

RUN pnpm run build

EXPOSE 8080

CMD ["pnpm", "run", "start"]