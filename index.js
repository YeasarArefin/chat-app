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
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('user connected', socket.id);

    socket.on('join_room', (data) => {
        socket.join(data);
        console.log(`user with id: ${socket.id} joind room: ${data}`);
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