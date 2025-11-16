FROM public.ecr.aws/amazonlinux/amazonlinux:2023

# Install Node.js 18
RUN dnf update -y && \
    dnf install -y nodejs npm && \
    dnf clean all

WORKDIR /app/
COPY . .
RUN npm install
RUN npm run db:generate
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "start"]