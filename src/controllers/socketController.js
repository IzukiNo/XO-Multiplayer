const roomsData = require("../models/roomModels");

module.exports.handleConnection = (socket, io) => {
  console.log("A user connected: " + socket.id);

  socket.on("register", (username) => {
    socket.username = username;
    console.log(`User ${socket.id} registered as ${username}`);
  });

  socket.on("disconnect", () => {
    const room = roomsData.socketRooms[socket.id];
    if (room) {
      console.log(`User ${socket.id} disconnected from room ${room.id}`);
      console.log(
        `Room ${room.id} ${room.isStarted ? "started" : "not started"}`
      );
      delete roomsData.socketRooms[socket.id];

      if (!room.isStarted) {
        roomsData.rooms.forEach((r) => {
          if (r.id === room.id) {
            r.players = r.players.filter(
              (player) => player !== socket.username
            );
          }
        });

        if (room.players.length === 0) {
          roomsData.rooms = roomsData.rooms.filter((r) => r.id !== room.id);
          console.log(`Room ${room.id} removed cause not started`);
          io.emit("list", roomsData.rooms);
          return;
        }
      }

      io.emit("list", roomsData.rooms);
      io.to(room.id).emit("leave", room);
      console.log(`Room ${room.id} players: ${room.players}`);
    } else {
      console.log(`User ${socket.id} disconnected`);
    }
  });

  socket.on("create", (roomName) => {
    if (roomsData.rooms.find((room) => room.name === roomName)) {
      console.log(`Room ${roomName} already exists`);
      socket.emit("error", "Room already exists");
      return;
    }

    console.log(`User ${socket.id} created room ${roomName}`);
    io.emit("list", roomsData.rooms);
  });

  socket.on("list", () => {
    socket.emit("list", roomsData.rooms);
  });

  socket.on("join", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    if (room.players.length > 2) {
      console.log(`Room ${roomId} is full`);
      return;
    }

    if (!room.players.includes(socket.username)) {
      room.players.push(socket.username);
      console.log(`Ko tim thay nen push HIHI ${socket.username}`);
    }

    socket.join(roomId);
    roomsData.socketRooms[socket.id] = room;
    console.log(`User ${socket.id} joined room ${roomId}`);

    io.to(roomId).emit("joined", room);
    io.emit("list", roomsData.rooms);
  });

  socket.on("data", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    socket.emit("data", room);
  });
};
