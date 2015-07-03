FROM node
RUN git clone https://github.com/quentinl-c/peerjs-prototype.git
WORKDIR /peerjs-prototype
RUN npm install
CMD ["node", "server.js"]