const path = require("path");
const roomsData = require("../models/roomModels");

function checkWin(board, player) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let pattern of winPatterns) {
    if (pattern.every((index) => board[index] === player)) {
      return true;
    }
  }
  return false;
}

module.exports.getGame = (req, res) => {
  const roomId = req.params.roomId;

  try {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    if (!room) {
      return res.status(404).send({ message: "co room deo dau ma` vo" });
    }
    res.sendFile(
      path.join(__dirname, "..", "..", "public", "game", "game.html")
    );
  } catch (error) {
    console.error("Error getting game:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

module.exports.inGame = (socket, io) => {
  socket.on("start", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    room.isStarted = true;

    io.to(roomId).emit("start", room);

    console.log(`Room ${roomId} started`);
  });

  socket.on("game-data", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    const safeRoom = {
      ...room,
      timeout: null,
      players: room.players.map(({ timeout, ...player }) => player),
    };

    socket.emit("game-data", safeRoom);
  });

  socket.on("move", (move) => {
    const room = roomsData.rooms.find((room) => room.id === move.id);
    if (room.moveCount === 10) {
      io.to(move.id).emit("draw");
      return;
    }

    console.log(move);
    room.board[move.index] = move.player;
    room.currentPlayer = move.player === "X" ? "O" : "X";
    room.moveCount += 1;

    if (checkWin(room.board, move.player)) {
      const winStatus = {
        winner: move.userId,
        board: room.board,
        id: move.id,
      };

      const winner = room.players.find((player) => player.id === move.userId);
      winner.score += 1;

      console.log(winner);
      console.log(room.players);

      console.log(`Room ${move.id} win`);
      io.to(move.id).emit("win", winStatus);
      return;
    }

    io.to(move.id).emit("update", room);
  });

  socket.on("reset", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    room.board = Array(9).fill(null);
    room.currentPlayer = null;
    room.moveCount = 0;
    console.log(`Room ${roomId} reset`);
    io.to(roomId).emit("reset", room);
  });

  socket.on("ingame", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);

    roomsData.socketGames[socket.id] = room;
  });

  socket.on("disconnect", () => {
    const room = roomsData.socketGames[socket.id];
    if (room) {
      console.log(`User ${socket.username} disconnected while in game`);
      delete roomsData.socketGames[socket.id];
      roomsData.rooms.forEach((r) => {
        if (r.id === room.id) {
          const playerIndex = r.players.findIndex(
            (player) => player.name === socket.username
          );

          if (playerIndex !== -1) {
            const player = r.players[playerIndex];
            player.timeout = setTimeout(() => {
              r.players = r.players.filter(
                (player) => player.name !== socket.username
              );

              if (room.players.length === 0) {
                roomsData.rooms = roomsData.rooms.filter(
                  (r) => r.id !== room.id
                );
                console.log(`Room ${room.id} removed while in game`);
              }
              console.log(`User ${socket.username} removed from room ${r.id}`);
            }, 5000);
          }
        }
      });
    }
  });
};
