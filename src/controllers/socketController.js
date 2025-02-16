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
      const safeRoom = {
        ...room,
        players: room.players.map(({ timeout, ...player }) => player),
      };
      delete roomsData.socketRooms[socket.id];

      if (!room.isStarted) {
        io.to(room.id).emit("leave", safeRoom);
        roomsData.rooms.forEach((r) => {
          if (r.id === room.id) {
            r.players = r.players.filter(
              (player) => player.name !== socket.username
            );
          }
        });

        if (room.players.length === 0) {
          console.log(`Room ${room.id} will remove if no players rejoin`);
          try {
            room.timeout = setTimeout(() => {
              roomsData.rooms = roomsData.rooms.filter((r) => r.id !== room.id);
              console.log(`Room ${room.id} removed cause no players`);
              io.emit(
                "list",
                roomsData.rooms.map(({ timeout, ...roomData }) => roomData)
              );
            }, 5000);
          } catch (error) {
            console.error("Lỗi trong đoạn code timeout:", error);
          }
        }
      }
    } else {
      console.log(`User ${socket.id} disconnected`);
    }

    const safeRooms = roomsData.rooms.map(({ timeout, ...roomData }) => ({
      ...roomData,
    }));
    io.emit("list", safeRooms);
  });

  socket.on("create", (roomName) => {
    if (roomsData.rooms.find((room) => room.name === roomName)) {
      console.log(`Room ${roomName} already exists`);
      socket.emit("error", "Room already exists");
      return;
    }

    console.log(`User ${socket.id} created room ${roomName}`);
    io.emit(
      "list",
      roomsData.rooms.map(({ timeout, ...roomData }) => roomData)
    );
  });

  socket.on("list", () => {
    const safeRooms = roomsData.rooms.map(({ timeout, players, ...room }) => ({
      ...room,
      players: players.map(({ timeout, ...player }) => player),
    }));
    socket.emit("list", safeRooms);
  });

  socket.on("join", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    const safeRooms = roomsData.rooms.map(({ timeout, players, ...room }) => ({
      ...room,
      players: players.map(({ timeout, ...player }) => player),
    }));

    const playerTimeout = room.players.find(
      (player) => player.name === socket.username
    );

    const safeRoom = {
      ...room,
      players: room.players.map(({ timeout, ...player }) => player),
    };

    if (playerTimeout) {
      clearTimeout(playerTimeout.timeout);
      playerTimeout.timeout = null;
      console.log(`User ${socket.username} reconnected to room ${roomId}`);
    }

    if (room.timeout) {
      clearTimeout(room.timeout);
      room.timeout = null;
      console.log(`Room ${roomId} timeout cleared`);
    }

    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    socket.join(roomId);
    roomsData.socketRooms[socket.id] = room;
    console.log(`User ${socket.id} joined room ${roomId}`);

    io.to(roomId).emit("joined", safeRoom);
    io.emit("list", safeRooms);
  });
};
