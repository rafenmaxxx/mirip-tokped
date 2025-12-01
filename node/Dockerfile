FROM node:20

WORKDIR /usr/src/app

# Copy package.json & install dependencies
COPY package*.json ./
RUN npm install

# Copy semua source code
COPY . .

EXPOSE 3000

# Jalankan aplikasi Node
CMD ["node", "src/server.js"]
