const express = require('express');
const http = require('http');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
app.use(cors());

const io = new Server(server, {
    cors: {
        origin: 'https://money-chat.netlify.app',
        // origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {

    console.log('user connected', socket.id);

    socket.on('join_room', ({ room, name }) => {
        socket.join(room);
        socket.emit('message', { author: 'System', message: `You just joined the chat` });
        socket.broadcast.to(room).emit('message', { author: 'System', message: `${name} just joined the chat` });
        console.log(`user with id: ${socket.id} joined room: ${room}`);
    });

    socket.on('send_message', (data) => {
        socket.to(data.room).emit('recive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    });

});

app.get('/', (req, res) => res.send('money chat server running'));

server.listen(port, () => console.log('server running at port 5000'));