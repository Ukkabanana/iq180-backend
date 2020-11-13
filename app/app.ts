import cors from 'cors';
import 'reflect-metadata';
import { useSocketServer } from 'socket-controllers';
import { Teyvat } from './teyvat';

const app = require('express')();
app.use(cors());

const server = require('http').createServer(app);
const socketServer = require('socket.io')(server);

useSocketServer(socketServer, {
    controllers: [Teyvat],
});

server.listen(process.env.PORT || 3001);

console.log('🎉 [app.ts] netcentric-iq180 is running!');
