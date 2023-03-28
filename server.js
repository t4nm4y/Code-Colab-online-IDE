const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

//this map will store which socketid belongs to which user, map[socket.id]=username
const userSocketMap = {};
function getAllConnectedClients(roomId) {
    //io.sockets.adapter.rooms will get all the live rooms on the server,
    //.get(roomId) this bydefault returns a map containing all socketids connected to that roomid,  so we used Array. to convert it to array
    //and then we will map all the socketids conected to that particular room
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            //to inform all the clients joined in that room, that a new user has joined, .emit is used to broadcast a message
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username, //this new user has joined who's username is this
                socketId: socket.id, //this new user has joined who's socketid is this
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code ,lang}) => {
        //send the changed code to all the sockets connected to the room, except urself
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code ,lang});
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code ,lang}) => { //sync the code to the newly joined socketId
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code,lang});
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms]; // [...map_name] is used to convert a map  to array
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
