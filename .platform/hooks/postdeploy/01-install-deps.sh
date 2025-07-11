#!/bin/bash
echo "Installing dependencies on EC2"
npm install -g pnpm
pnpm install --frozen-lockfile
