FROM public.ecr.aws/amazonlinux/amazonlinux:2023

# Install Node.js 18
RUN dnf update -y && \
    dnf install -y nodejs npm && \
    dnf clean all

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app/
COPY . .
RUN pnpm install
RUN pnpm run db:generate
RUN pnpm run build
EXPOSE 8080
CMD ["pnpm", "run", "start"]