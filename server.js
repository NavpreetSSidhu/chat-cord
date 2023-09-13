const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const createAdapter = require('@socket.io/redis-adapter').createAdapter;
const redis = require('redis');
require("dotenv").config();
const { createClient } = redis;
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')));
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const botName = 'ChatCord Bot';

(async() => {
    const pubClient = createClient({url: REDIS_URL});
    pubClient.on('error', (err) => {
        console.error("Error in pubClient:", err.message);
    });

    await pubClient.connect();
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient,subClient));
})();

//Run when a client connects
io.on('connection', socket => {
    // listen for joinroom
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id,username, room);

        //join room functionality from socket
        socket.join(user.room);

        // welcomes current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

        // broadcast's to others when a user connects apart from the said user
        socket.broadcast
            .to(user.room)
            .emit('message', formatMessage(botName, `${user.username} has joined the chat`));
            
        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });    

    //listen for the chat message
    socket.on('chatmessage', msg => {
        const user = getCurrentUser(socket.id);

        // emit to everyone
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // this runs when client disconnects
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);
        // io emit to let everyone know
        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            //Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }  
    });
})

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Listening on ${port}...`));