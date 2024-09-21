const express = require('express');
const http = require('http');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const { disconnect } = require('process');

app.use(cors());

const io = new Server(server, {
    maxHttpBufferSize: 2e8, // 100MB limit
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

let users = [];

io.on('connection', (socket) => {
    socket.on('join_room', ({ room, name }) => {
        socket.join(room);
        const newUser = { id: socket.id, name, room };
        const existingUsersInRoom = users.filter(user => user.room === room);
        const existingUsersName = existingUsersInRoom.map(user => user.name).join(', ');

        socket.emit('message', { author: 'System', message: `You just joined the chat` });

        if (existingUsersInRoom.length === 1) {
            socket.emit('message', { author: 'System', message: `${existingUsersName} have already joined the chat` });
        } else if (existingUsersInRoom.length > 1) {
            socket.emit('message', { author: 'System', message: `${existingUsersName} they have already joined the chat` });
        }
        socket.broadcast.to(room).emit('message', { author: 'System', message: `${name} joined the chat` });
        users.push(newUser);
        console.log('Total User : ', users.length);
        console.log('Joined User : ', newUser);
    });

    socket.on('send_message', (data) => {
        socket.to(data.room).emit('receive_message', data);
    });

    socket.on('send_file', (data) => {
        const base64File = Buffer.from(data.file).toString('base64');
        socket.to(data.room).emit('receive_file', {
            author: data.author,
            filename: data.filename,
            file: base64File
        });
    });


    socket.on("typing", ({ room, name }) => socket.to(room).emit("typing", { name }));
    socket.on("stop_typing", ({ room, name }) => socket.to(room).emit("stop_typing", { name }));

    socket.on('disconnect', () => {
        const disconnectedUser = users.filter((user) => user.id === socket.id)[0];
        users = users.filter((user) => user.id !== socket.id);
        socket.broadcast.to(disconnectedUser?.room).emit('message', { author: 'System', message: `${disconnectedUser?.name} left the chat` });
        if (disconnect) {
            console.log('Disconnected User : ', disconnectedUser);
        }
    });
});

app.get('/', (req, res) => res.send('money chat server running'));
server.listen(port, () => console.log('server running at port 5000'));