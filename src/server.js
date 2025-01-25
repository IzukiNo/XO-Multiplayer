const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const roomsRouter = require("./routes/roomRouter");
const socketController = require("./controllers/socketController");
const gameController = require("./controllers/gameController");

const app = express();
const server = http.createServer(app);

app.use(express.json());
const io = new Server(server);

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/", roomsRouter);

io.on("connection", (socket) => {
  socketController.handleConnection(socket, io);
  gameController.inGame(socket, io);
});

server.listen(4000, () => {
  console.log("Listening on http://localhost:4000");
});
