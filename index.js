const express = require('express');
const http = require('http');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const { log } = require('console');
app.use(cors());

const io = new Server(server, {
    cors: {
        // origin: 'https://money-chat.netlify.app',
        // origin: 'http://localhost:3000',
        origin: '*',
        methods: ['GET', 'POST']
    }
});

let users = [];
let existingUsers = [];
let roomCode;

io.on('connection', (socket) => {
    console.log('joined :', socket.id);
    socket.on('join_room', ({ room, name }) => {
        socket.join(room);
        roomCode = room;
        existingUsers = users.filter(user => user.room === room);
        const existingUsersName = existingUsers.map(user => user.name).join(', ');

        socket.emit('message', { author: 'System', message: `You just joined the chat` });

        if (existingUsers.length === 1) {
            socket.emit('message', { author: 'System', message: `${existingUsersName} have already joined the chat` });
        } else if (existingUsers.length > 1) {
            socket.emit('message', { author: 'System', message: `${existingUsersName} they have already joined the chat` });
        }
        socket.broadcast.to(room).emit('message', { author: 'System', message: `${name} just joined the chat` });
        users.push({ id: socket.id, name, room });
    });

    socket.on('send_message', (data) => {
        socket.to(data.room).emit('receive_message', data);
    });

    socket.on('send_file', (data) => {
        const base64File = Buffer.from(data.file).toString('base64');
        socket.to(roomCode).emit('receive_file', {
            filename: data.filename,
            file: base64File
        });
    });

    socket.on('disconnect', () => {
        const disconnectedUser = users.filter((user) => user.id === socket.id);
        users = users.filter((user) => user.id !== socket.id);
        existingUsers = existingUsers.filter((user) => user.id !== socket.id);
        console.log(roomCode);
        console.log("🚀 ~ socket.on ~ disconnectedUser:", disconnectedUser);
        socket.broadcast.to(roomCode).emit('message', { author: 'System', message: `${disconnectedUser[0]?.name} just left the chat` });
        console.log('disconnected :', socket.id);
    });

});

app.get('/', (req, res) => res.send('money chat server running'));

server.listen(port, () => console.log('server running at port 5000'));