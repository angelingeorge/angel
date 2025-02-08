const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("./public")); // Serve frontend files

let rooms = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ roomId }) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);

        if (!rooms[roomId]) {
            rooms[roomId] = { users: [], videoTime: 0 };
        }
        rooms[roomId].users.push(socket.id);

        socket.emit("sync-video", { time: rooms[roomId].videoTime });

        socket.on("play", () => {
            console.log(`Play event received in room: ${roomId}`);
            io.to(roomId).emit("play");
        });

        socket.on("pause", () => {
            console.log(`Pause event received in room: ${roomId}`);
            io.to(roomId).emit("pause");
        });

        socket.on("seek", ({ time }) => {
            console.log(`Seek event received in room: ${roomId}, time: ${time}`);
            rooms[roomId].videoTime = time;
            socket.broadcast.to(roomId).emit("seek", time);
        });

        socket.on("chatMessage", ({ message }) => {
            console.log(`Message received in room: ${roomId} - ${message}`);
            io.to(roomId).emit("chatMessage", { message });
        });

        socket.on("disconnect", () => {
            console.log(`User ${socket.id} disconnected from room: ${roomId}`);
            rooms[roomId].users = rooms[roomId].users.filter((id) => id !== socket.id);
            if (rooms[roomId].users.length === 0) delete rooms[roomId];
        });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
